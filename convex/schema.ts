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
});
