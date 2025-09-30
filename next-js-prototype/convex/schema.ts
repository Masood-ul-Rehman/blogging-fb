import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  resources: defineTable({
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    createdBy: v.optional(v.string()),
  }),
  kpis: defineTable({
    date: v.string(), // YYYY-MM-DD format
    metric: v.string(),
    value: v.number(),
  }),
});
