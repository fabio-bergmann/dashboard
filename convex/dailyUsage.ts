import { v } from "convex/values";
import { query } from "./_generated/server";

export const listByApp = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("daily_usage")
      .withIndex("by_app_date", (q) => q.eq("appId", args.appId))
      .order("desc")
      .collect();
  },
});
