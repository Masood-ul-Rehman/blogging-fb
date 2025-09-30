import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";

// Define valid roles
const VALID_ROLES = ["admin", "manager", "user"] as const;
type Role = (typeof VALID_ROLES)[number];

// Helper to validate role
const isValidRole = (role: string): role is Role => {
  return VALID_ROLES.includes(role as Role);
};

export const create = mutation({
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
      // User already exists, update instead
      return await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        role: (args.role && isValidRole(args.role)
          ? args.role
          : "user") as Role,
        updatedAt: Date.now(),
      });
    }

    return await ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      email: args.email,
      role: (args.role && isValidRole(args.role) ? args.role : "user") as Role,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateUser = mutation({
  args: {
    userId: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("admin"), v.literal("manager"), v.literal("user"))
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.role !== undefined) {
      updates.role = args.role;
    }

    return await ctx.db.patch(user._id, updates);
  },
});

export const deleteUser = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

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

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});
