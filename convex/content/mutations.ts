import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const add = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const id = await ctx.db.insert("content", {
      title: args.title,
      url: args.url,
      description: args.description,
      tags: args.tags,
      createdBy: identity.subject,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("content") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    // Optional: Check if user owns the content before allowing deletion
    const content = await ctx.db.get(args.id);
    if (!content) {
      throw new Error("Content not found");
    }

    await ctx.db.delete(args.id);
  },
});
