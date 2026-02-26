import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("custom_icons").collect();
  },
});

export const upload = mutation({
  args: { name: v.string(), svgContent: v.string() },
  returns: v.id("custom_icons"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("custom_icons", {
      name: args.name,
      svgContent: args.svgContent,
      uploadedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { iconId: v.id("custom_icons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const settings = await ctx.db.query("card_settings").collect();
    for (const s of settings) {
      if (s.iconId === args.iconId) {
        await ctx.db.patch(s._id, { iconId: undefined });
      }
    }
    await ctx.db.delete(args.iconId);
  },
});
