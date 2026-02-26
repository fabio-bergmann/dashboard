import { v } from "convex/values";
import { query } from "./_generated/server";
import { internalAction, internalMutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("x_stats").withIndex("by_date").order("desc").collect();
  },
});

export const fetchAndStore = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) {
      throw new Error("X_BEARER_TOKEN environment variable is not set");
    }

    const response = await fetch(
      "https://api.x.com/2/users/by/username/fabiobergmann?user.fields=public_metrics",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`X API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const metrics = json.data.public_metrics;

    const today = new Date().toISOString().split("T")[0];

    await ctx.runMutation(internal.xStats.upsertDailyStats, {
      date: today,
      followers: metrics.followers_count,
      tweetCount: metrics.tweet_count,
    });
  },
});

import { internal } from "./_generated/api";

export const upsertDailyStats = internalMutation({
  args: {
    date: v.string(),
    followers: v.number(),
    tweetCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("x_stats")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        followers: args.followers,
        tweetCount: args.tweetCount,
      });
    } else {
      await ctx.db.insert("x_stats", {
        date: args.date,
        followers: args.followers,
        tweetCount: args.tweetCount,
      });
    }
  },
});
