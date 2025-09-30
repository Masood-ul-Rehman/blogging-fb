import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    query: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let resources = await ctx.db.query("resources").collect();

    if (args.query) {
      const q = args.query.toLowerCase();
      resources = resources.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (args.tag) {
      resources = resources.filter((r) => r.tags.includes(args.tag));
    }

    return resources.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("resources", {
      title: args.title,
      url: args.url,
      description: args.description,
      tags: args.tags,
      createdBy: args.createdBy,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("resources") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
