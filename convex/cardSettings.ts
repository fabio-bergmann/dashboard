import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const get = query({
  args: { cardId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("card_settings")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    cardId: v.string(),
    iconId: v.optional(v.id("custom_icons")),
    destinationUrl: v.string(),
    linkType: v.union(v.literal("internal"), v.literal("external")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("card_settings")
      .withIndex("by_cardId", (q) => q.eq("cardId", args.cardId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        iconId: args.iconId,
        destinationUrl: args.destinationUrl,
        linkType: args.linkType,
      });
    } else {
      await ctx.db.insert("card_settings", {
        cardId: args.cardId,
        iconId: args.iconId,
        destinationUrl: args.destinationUrl,
        linkType: args.linkType,
      });
    }
  },
});
