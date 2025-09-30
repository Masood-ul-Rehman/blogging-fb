import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
  args: {
    query: v.optional(v.string()),
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    let content = await ctx.db.query("content").collect();

    if (args.query) {
      const q = args.query.toLowerCase();
      content = content.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.url.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (args.tag) {
      content = content.filter((c) => c.tags.includes(args.tag!));
    }

    return content.sort((a, b) => b._creationTime - a._creationTime);
  },
});
