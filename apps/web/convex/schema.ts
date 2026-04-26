import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  posts: defineTable({
    author: v.string(),
    body: v.string(),
    channel: v.string(),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),
});
