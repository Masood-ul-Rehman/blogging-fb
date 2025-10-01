import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define valid roles as a union type for validation
const roleValidator = v.union(
  v.literal("admin"),
  v.literal("manager"),
  v.literal("user")
);

export default defineSchema({
  content: defineTable({
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    createdBy: v.string(), // User ID who created this content
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }).index("by_createdBy", ["createdBy"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    userId: v.string(), // Clerk user ID
    role: roleValidator, // Validated role field
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
    isActive: v.optional(v.boolean()), // For soft deletion/deactivation
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"])
    .index("by_email", ["email"]),

  // New table for role permissions and actions tracking
  rolePermissions: defineTable({
    role: roleValidator,
    action: v.string(),
    resource: v.string(),
    allowed: v.boolean(),
    createdAt: v.number(),
  }).index("by_role_action", ["role", "action"]),

  // Audit log for role changes
  roleAuditLog: defineTable({
    targetUserId: v.string(),
    targetUserEmail: v.string(),
    changedByUserId: v.string(),
    changedByEmail: v.string(),
    oldRole: v.string(),
    newRole: v.string(),
    reason: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_targetUser", ["targetUserId"])
    .index("by_changedBy", ["changedByUserId"])
    .index("by_timestamp", ["timestamp"]),

  // Facebook Marketing Integration
  facebook_connections: defineTable({
    clerkUserId: v.string(), // Clerk user ID
    fbUserId: v.string(), // Facebook user ID
    accessToken: v.string(), // Encrypted long-lived token
    tokenType: v.string(), // Usually "bearer"
    expiresAt: v.number(), // Unix timestamp when token expires
    scopes: v.array(v.string()), // Granted permissions
    adAccounts: v.array(
      v.object({
        id: v.string(),
        accountId: v.string(),
        name: v.string(),
        currency: v.string(),
        timezone: v.optional(v.string()),
      })
    ),
    connectedAt: v.number(), // When first connected
    lastSyncedAt: v.number(), // Last time we refreshed ad accounts
    isActive: v.boolean(), // Whether connection is still valid
  })
    .index("by_clerkUserId", ["clerkUserId"])
    .index("by_fbUserId", ["fbUserId"])
    .index("by_isActive", ["isActive"]),

  // Audit log for Facebook ad actions
  facebook_action_logs: defineTable({
    actorClerkId: v.string(), // Who performed the action
    action: v.string(), // e.g., "pause_ad", "resume_ad", "update_budget"
    targetType: v.string(), // e.g., "ad", "adset", "campaign"
    targetId: v.string(), // Facebook ID of the target
    targetName: v.optional(v.string()), // Human-readable name
    adAccountId: v.string(), // Which ad account
    result: v.string(), // "success" or "failure"
    errorMessage: v.optional(v.string()), // If failed
    metadata: v.optional(
      v.object({
        previousStatus: v.optional(v.string()),
        newStatus: v.optional(v.string()),
        previousBudget: v.optional(v.number()),
        newBudget: v.optional(v.number()),
      })
    ),
    timestamp: v.number(),
  })
    .index("by_actorClerkId", ["actorClerkId"])
    .index("by_adAccountId", ["adAccountId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),
});
