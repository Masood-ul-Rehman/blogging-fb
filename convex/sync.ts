// Helper functions for syncing data between Clerk and Convex
// These are useful for one-time operations or manual syncing
// NOTE: Roles are now managed exclusively in Convex, not inherited from Clerk

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { ConvexError } from "convex/values";
import { logRoleChange } from "./auth/helpers";

// Define valid roles
const VALID_ROLES = ["admin", "manager", "user"] as const;
type Role = (typeof VALID_ROLES)[number];

// Helper to validate role
const isValidRole = (role: string): role is Role => {
  return VALID_ROLES.includes(role as Role);
};

// Manual sync function to create a user if they don't exist
// This can be called from your app when a user logs in for the first time
export const syncUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("user"))
    ),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existingUser) {
      // Update existing user profile data only, preserve role
      return await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        lastLoginAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true, // Reactivate if was inactive
      });
    } else {
      // Create new user with default "user" role (roles managed separately)
      const newUser = await ctx.db.insert("users", {
        userId: args.userId,
        name: args.name,
        email: args.email,
        role: "user" as Role, // All new users start as "user"
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastLoginAt: Date.now(),
        isActive: true,
      });

      // Log the user creation
      await logRoleChange(
        ctx,
        args.userId,
        args.email,
        "system",
        "system",
        "none",
        "user",
        "New user registration"
      );

      return newUser;
    }
  },
});

// Batch update user roles (admin function)
export const updateUserRole = mutation({
  args: {
    userId: v.string(),
    role: v.union(v.literal("admin"), v.literal("manager"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return await ctx.db.patch(user._id, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});
