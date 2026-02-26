import { v } from "convex/values";
import { query } from "./_generated/server";
import { internalAction, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: { site: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("website_stats")
      .withIndex("by_site_date", (q) => q.eq("site", args.site))
      .order("desc")
      .collect();
  },
});

export const listSites = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("website_stats").collect();
    const sites = new Set(all.map((row) => row.site));
    return [...sites];
  },
});

export const fetchAndStore = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const sitesJson = process.env.DATAFAST_SITES;
    if (!sitesJson) {
      throw new Error("DATAFAST_SITES environment variable is not set");
    }

    const sites: Record<string, string> = JSON.parse(sitesJson);

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const date = yesterday.toISOString().split("T")[0];

    for (const [site, apiKey] of Object.entries(sites)) {
      const url = `https://datafa.st/api/v1/analytics/overview?fields=visitors&startAt=${date}&endAt=${date}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `Datafast API error for ${site}: ${response.status} ${response.statusText}`,
        );
        continue;
      }

      const json = await response.json();
      const visitors = json.data[0].visitors;

      await ctx.runMutation(internal.websiteStats.upsertDailyStats, {
        date,
        site,
        visitors,
      });
    }
  },
});

export const backfill = internalAction({
  args: { days: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sitesJson = process.env.DATAFAST_SITES;
    if (!sitesJson) {
      throw new Error("DATAFAST_SITES environment variable is not set");
    }

    const sites: Record<string, string> = JSON.parse(sitesJson);

    const endDate = new Date();
    endDate.setUTCDate(endDate.getUTCDate() - 1);
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - args.days + 1);

    const startAt = startDate.toISOString().split("T")[0];
    const endAt = endDate.toISOString().split("T")[0];

    for (const [site, apiKey] of Object.entries(sites)) {
      const url = `https://datafa.st/api/v1/analytics/timeseries?fields=visitors&interval=day&startAt=${startAt}&endAt=${endAt}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          `Datafast API error for ${site}: ${response.status} ${response.statusText}`,
        );
        continue;
      }

      const json = await response.json();

      for (const entry of json.data) {
        const date = entry.timestamp.split("T")[0];
        await ctx.runMutation(internal.websiteStats.upsertDailyStats, {
          date,
          site,
          visitors: entry.visitors,
        });
      }
    }
  },
});

export const upsertDailyStats = internalMutation({
  args: {
    date: v.string(),
    site: v.string(),
    visitors: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("website_stats")
      .withIndex("by_site_date", (q) =>
        q.eq("site", args.site).eq("date", args.date),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        visitors: args.visitors,
      });
    } else {
      await ctx.db.insert("website_stats", {
        date: args.date,
        site: args.site,
        visitors: args.visitors,
      });
    }
  },
});
