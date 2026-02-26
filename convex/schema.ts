import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  x_stats: defineTable({
    date: v.string(),
    followers: v.number(),
    tweetCount: v.number(),
  }).index("by_date", ["date"]),
});
