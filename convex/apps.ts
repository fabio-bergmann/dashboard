import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("apps").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("apps"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("apps", {
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { appId: v.id("apps") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const usageRows = await ctx.db
      .query("daily_usage")
      .withIndex("by_app_date", (q) => q.eq("appId", args.appId))
      .collect();
    for (const row of usageRows) {
      await ctx.db.delete(row._id);
    }

    const keys = await ctx.db
      .query("tracked_keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
    for (const key of keys) {
      await ctx.db.delete(key._id);
    }

    await ctx.db.delete(args.appId);
  },
});
