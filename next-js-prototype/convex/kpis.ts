import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    metric: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let kpis = await ctx.db.query("kpis").collect();

    if (args.metric) {
      kpis = kpis.filter((k) => k.metric === args.metric);
    }

    return kpis.sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const add = mutation({
  args: {
    date: v.string(), // YYYY-MM-DD format
    metric: v.string(),
    value: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("kpis", {
      date: args.date,
      metric: args.metric,
      value: args.value,
    });
    return id;
  },
});
