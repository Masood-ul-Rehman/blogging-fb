import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";
import { initializeDefaultPermissions } from "../auth/helpers";

// Initialize the role system with default permissions
export const initializeRoleSystem = mutation({
  args: {},
  handler: async (ctx) => {
    await initializeDefaultPermissions(ctx);
    return { success: true, message: "Role system initialized successfully" };
  },
});

// Create the first admin user (only if no admins exist)
export const createFirstAdmin = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admin users already exist
    const existingAdmins = await ctx.db.query("users").collect();
    const adminCount = existingAdmins.filter(
      (user) => user.role === "admin"
    ).length;

    if (adminCount > 0) {
      throw new ConvexError(
        "Admin users already exist. Cannot create first admin."
      );
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      // Promote existing user to admin
      await ctx.db.patch(existingUser._id, {
        role: "admin",
        updatedAt: Date.now(),
      });

      // Log the role change
      await ctx.db.insert("roleAuditLog", {
        targetUserId: args.userId,
        targetUserEmail: args.email,
        changedByUserId: "system",
        changedByEmail: "system",
        oldRole: existingUser.role,
        newRole: "admin",
        reason: "First admin user creation",
        timestamp: Date.now(),
      });

      return {
        success: true,
        message: "User promoted to admin",
        userId: args.userId,
      };
    }

    // Create new admin user
    const newUser = await ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      role: "admin",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    // Log the creation
    await ctx.db.insert("roleAuditLog", {
      targetUserId: args.userId,
      targetUserEmail: args.email,
      changedByUserId: "system",
      changedByEmail: "system",
      oldRole: "none",
      newRole: "admin",
      reason: "First admin user creation",
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: "First admin user created",
      userId: args.userId,
      id: newUser,
    };
  },
});

// Get system statistics
export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError("Only admins can view system statistics");
    }

    const users = await ctx.db.query("users").collect();
    const roleAuditLogs = await ctx.db.query("roleAuditLog").collect();
    const permissions = await ctx.db.query("rolePermissions").collect();
    const content = await ctx.db.query("content").collect();

    return {
      userStats: {
        total: users.length,
        admin: users.filter((u) => u.role === "admin").length,
        manager: users.filter((u) => u.role === "manager").length,
        user: users.filter((u) => u.role === "user").length,
        active: users.filter((u) => u.isActive !== false).length,
        inactive: users.filter((u) => u.isActive === false).length,
      },
      contentStats: {
        total: content.length,
        byCreator: content.reduce((acc, c) => {
          acc[c.createdBy] = (acc[c.createdBy] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      auditStats: {
        totalRoleChanges: roleAuditLogs.length,
        recentChanges: roleAuditLogs
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10),
      },
      permissionStats: {
        totalPermissions: permissions.length,
        byRole: permissions.reduce((acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    };
  },
});

// Clean up inactive users (soft delete)
export const deactivateInactiveUsers = mutation({
  args: {
    inactiveDays: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Authentication required");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new ConvexError("Only admins can deactivate users");
    }

    const cutoffTime = Date.now() - args.inactiveDays * 24 * 60 * 60 * 1000;
    const users = await ctx.db.query("users").collect();

    const inactiveUsers = users.filter(
      (user) =>
        user.role === "user" && // Only deactivate regular users
        user.lastLoginAt &&
        user.lastLoginAt < cutoffTime &&
        user.isActive !== false
    );

    const results = [];
    for (const user of inactiveUsers) {
      await ctx.db.patch(user._id, {
        isActive: false,
        updatedAt: Date.now(),
      });

      await ctx.db.insert("roleAuditLog", {
        targetUserId: user.userId,
        targetUserEmail: user.email,
        changedByUserId: currentUser.userId,
        changedByEmail: currentUser.email,
        oldRole: user.role,
        newRole: user.role,
        reason: `Auto-deactivated after ${args.inactiveDays} days of inactivity`,
        timestamp: Date.now(),
      });

      results.push({
        userId: user.userId,
        email: user.email,
        lastLogin: user.lastLoginAt,
      });
    }

    return {
      success: true,
      deactivatedCount: results.length,
      deactivatedUsers: results,
    };
  },
});
