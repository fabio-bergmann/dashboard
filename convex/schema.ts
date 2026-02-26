import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const provider = v.union(
  v.literal("anthropic"),
  v.literal("openrouter"),
  v.literal("xai"),
);

export default defineSchema({
  x_stats: defineTable({
    date: v.string(),
    followers: v.number(),
    tweetCount: v.number(),
  }).index("by_date", ["date"]),

  apps: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),

  tracked_keys: defineTable({
    appId: v.id("apps"),
    provider,
    keyId: v.string(),
    keyName: v.string(),
    addedAt: v.number(),
  })
    .index("by_app", ["appId"])
    .index("by_provider", ["provider"]),

  daily_usage: defineTable({
    trackedKeyId: v.id("tracked_keys"),
    appId: v.id("apps"),
    provider,
    date: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cost: v.number(),
  })
    .index("by_app_date", ["appId", "date"])
    .index("by_tracked_key_date", ["trackedKeyId", "date"])
    .index("by_key_date_model", ["trackedKeyId", "date", "model"]),

  website_stats: defineTable({
    date: v.string(),
    site: v.string(),
    visitors: v.number(),
  }).index("by_site_date", ["site", "date"]),
});
