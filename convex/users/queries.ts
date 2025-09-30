import { v } from "convex/values";
import { query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Helper to get current user from Convex auth
const getCurrentUser = async (ctx: any) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null; // Allow unauthenticated queries in some cases
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
    .first();

  return user;
};

export const getByUserId = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const getCurrentUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);
    if (!currentUser) {
      return null;
    }
    return currentUser;
  },
});

export const list = query({
  args: {
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only authenticated users can see user lists
    if (!currentUser) {
      throw new ConvexError("Authentication required to view users");
    }

    // Only admins and managers can see all users
    if (currentUser.role !== "admin" && currentUser.role !== "manager") {
      throw new ConvexError("Insufficient permissions to view user list");
    }

    let query = ctx.db.query("users");

    if (args.role) {
      // Filter by role if specified
      const users = await query.collect();
      return users.filter((user) => user.role === args.role);
    }

    return await query.collect();
  },
});

export const getUsersByRole = query({
  args: {
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only authenticated users can query by role
    if (!currentUser) {
      throw new ConvexError("Authentication required");
    }

    // Only admins and managers can see user lists
    if (currentUser.role !== "admin" && currentUser.role !== "manager") {
      throw new ConvexError("Insufficient permissions to view users by role");
    }

    const users = await ctx.db.query("users").collect();
    return users.filter((user) => user.role === args.role);
  },
});

export const getRoleStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Only admins can see role statistics
    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError("Only admins can view role statistics");
    }

    const users = await ctx.db.query("users").collect();

    const stats = {
      total: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      manager: users.filter((u) => u.role === "manager").length,
      user: users.filter((u) => u.role === "user").length,
    };

    return stats;
  },
});

export const canPerformAction = query({
  args: {
    action: v.string(),
    targetUserId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser) {
      return false;
    }

    const userRole = currentUser.role;

    switch (args.action) {
      case "manage_content":
        return userRole === "admin" || userRole === "manager";

      case "delete_content":
        return userRole === "admin" || userRole === "manager";

      case "create_content":
        return userRole === "admin" || userRole === "manager";

      case "view_users":
        return userRole === "admin" || userRole === "manager";

      case "modify_user_roles":
        return userRole === "admin";

      case "delete_users":
        return userRole === "admin";

      case "view_role_stats":
        return userRole === "admin";

      case "promote_to_admin":
        return userRole === "admin";

      case "promote_to_manager":
        return userRole === "admin";

      case "demote_user":
        if (args.targetUserId && args.targetUserId === currentUser.userId) {
          return false; // Cannot demote yourself
        }
        return userRole === "admin";

      default:
        return false;
    }
  },
});

export const searchUsers = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx);

    // Only authenticated users with manage permissions can search
    if (!currentUser) {
      throw new ConvexError("Authentication required");
    }

    if (currentUser.role !== "admin" && currentUser.role !== "manager") {
      throw new ConvexError("Insufficient permissions to search users");
    }

    const users = await ctx.db.query("users").collect();
    const limit = args.limit || 10;
    const searchQuery = args.query.toLowerCase();

    const filteredUsers = users
      .filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery) ||
          user.email.toLowerCase().includes(searchQuery) ||
          user.role.toLowerCase().includes(searchQuery)
      )
      .slice(0, limit);

    return filteredUsers;
  },
});
