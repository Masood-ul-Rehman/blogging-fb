import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

// Define valid roles
const VALID_ROLES = ["admin", "manager", "user"] as const;
type Role = (typeof VALID_ROLES)[number];

// Helper to validate role
const isValidRole = (role: string): role is Role => {
  return VALID_ROLES.includes(role as Role);
};

// Helper to get current user from Convex auth
const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError("Not authenticated");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  if (!user) {
    throw new ConvexError("User not found in database");
  }

  return user;
};

// Helper to check if user has permission to modify roles
const canModifyRoles = (userRole: string, targetRole: string): boolean => {
  // Only admins can modify admin roles
  if (targetRole === "admin") {
    return userRole === "admin";
  }

  // Admins can modify any role, managers can modify user roles
  if (userRole === "admin") {
    return true;
  }

  if (userRole === "manager" && targetRole === "user") {
    return true;
  }

  return false;
};

export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const role = args.role || "user";

    if (!isValidRole(role)) {
      throw new ConvexError(
        `Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(", ")}`
      );
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      // User already exists, update instead
      return await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        role: role,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      role: role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateRole = mutation({
  args: {
    targetUserId: v.string(),
    newRole: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate role
    if (!isValidRole(args.newRole)) {
      throw new ConvexError(
        `Invalid role: ${args.newRole}. Must be one of: ${VALID_ROLES.join(
          ", "
        )}`
      );
    }

    // Get current user (the one making the request)
    const currentUser = await getCurrentUser(ctx);

    // Get target user
    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (!targetUser) {
      throw new ConvexError("Target user not found");
    }

    // Check permissions
    if (!canModifyRoles(currentUser.role, args.newRole)) {
      throw new ConvexError(
        `Insufficient permissions to assign role: ${args.newRole}`
      );
    }

    // Additional check: users cannot modify their own role to admin
    if (currentUser.userId === args.targetUserId && args.newRole === "admin") {
      throw new ConvexError("Cannot promote yourself to admin");
    }

    return await ctx.db.patch(targetUser._id, {
      role: args.newRole,
      updatedAt: Date.now(),
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;

    return await ctx.db.patch(currentUser._id, updates);
  },
});

export const deleteUser = mutation({
  args: {
    targetUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only admins can delete users
    if (currentUser.role !== "admin") {
      throw new ConvexError("Only admins can delete users");
    }

    // Cannot delete yourself
    if (currentUser.userId === args.targetUserId) {
      throw new ConvexError("Cannot delete yourself");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (targetUser) {
      await ctx.db.delete(targetUser._id);
    }
  },
});

// Batch role update for admin use
export const batchUpdateRoles = mutation({
  args: {
    updates: v.array(
      v.object({
        userId: v.string(),
        role: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only admins can do batch updates
    if (currentUser.role !== "admin") {
      throw new ConvexError("Only admins can perform batch role updates");
    }

    const results = [];

    for (const update of args.updates) {
      if (!isValidRole(update.role)) {
        throw new ConvexError(
          `Invalid role: ${update.role}. Must be one of: ${VALID_ROLES.join(
            ", "
          )}`
        );
      }

      const targetUser = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", update.userId))
        .first();

      if (targetUser) {
        await ctx.db.patch(targetUser._id, {
          role: update.role,
          updatedAt: Date.now(),
        });
        results.push({ userId: update.userId, success: true });
      } else {
        results.push({
          userId: update.userId,
          success: false,
          error: "User not found",
        });
      }
    }

    return results;
  },
});
