import { v } from "convex/values";
import { query } from "./_generated/server";
import { internalAction, internalMutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("youtube_stats").withIndex("by_date").order("desc").collect();
  },
});

export const fetchAndStore = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY environment variable is not set");
    }

    const channel = process.env.YOUTUBE_CHANNEL_ID;
    if (!channel) {
      throw new Error("YOUTUBE_CHANNEL_ID environment variable is not set");
    }

    const param = channel.startsWith("@") ? `forHandle=${encodeURIComponent(channel)}` : `id=${encodeURIComponent(channel)}`;

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&${param}&key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (!json.items || json.items.length === 0) {
      throw new Error(`No channel found for: ${channel}`);
    }

    const stats = json.items[0].statistics;
    const today = new Date().toISOString().split("T")[0];

    await ctx.runMutation(internal.youtubeStats.upsertDailyStats, {
      date: today,
      subscriberCount: Number(stats.subscriberCount),
      viewCount: Number(stats.viewCount),
      videoCount: Number(stats.videoCount),
    });
  },
});

import { internal } from "./_generated/api";

export const upsertDailyStats = internalMutation({
  args: {
    date: v.string(),
    subscriberCount: v.number(),
    viewCount: v.number(),
    videoCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("youtube_stats")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        subscriberCount: args.subscriberCount,
        viewCount: args.viewCount,
        videoCount: args.videoCount,
      });
    } else {
      await ctx.db.insert("youtube_stats", {
        date: args.date,
        subscriberCount: args.subscriberCount,
        viewCount: args.viewCount,
        videoCount: args.videoCount,
      });
    }
  },
});
