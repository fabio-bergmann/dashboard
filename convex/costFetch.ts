import { v } from "convex/values";
import {
  mutation,
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { fetchAnthropicCosts } from "./providers/anthropic";
import { fetchOpenRouterActivity } from "./providers/openrouter";
import { fetchXaiUsage } from "./providers/xai";

const providerValidator = v.union(
  v.literal("anthropic"),
  v.literal("openrouter"),
  v.literal("xai"),
);

// --- Internal queries ---

export const getAllTrackedKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tracked_keys").collect();
  },
});

export const getTrackedKeysByApp = internalQuery({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tracked_keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
  },
});

export const getTrackedKey = internalQuery({
  args: { trackedKeyId: v.id("tracked_keys") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.trackedKeyId);
  },
});

// --- Upsert mutation ---

export const upsertDailyUsageBatch = internalMutation({
  args: {
    rows: v.array(
      v.object({
        trackedKeyId: v.id("tracked_keys"),
        appId: v.id("apps"),
        provider: providerValidator,
        date: v.string(),
        model: v.string(),
        inputTokens: v.number(),
        outputTokens: v.number(),
        cost: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      const existing = await ctx.db
        .query("daily_usage")
        .withIndex("by_key_date_model", (q) =>
          q
            .eq("trackedKeyId", row.trackedKeyId)
            .eq("date", row.date)
            .eq("model", row.model),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          inputTokens: row.inputTokens,
          outputTokens: row.outputTokens,
          cost: row.cost,
        });
      } else {
        await ctx.db.insert("daily_usage", row);
      }
    }
  },
});

// --- Daily cron action ---

export const fetchAllDailyCosts = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allKeys = await ctx.runQuery(
      internal.costFetch.getAllTrackedKeys,
      {},
    );

    const byProvider = groupBy(allKeys, (k) => k.provider);
    const tomorrow = getDateString(1);
    const yesterday = getDateString(-1);

    // Anthropic
    const anthropicKeys = byProvider.anthropic ?? [];
    if (anthropicKeys.length > 0) {
      try {
        const rows = await fetchAnthropicCosts(
          anthropicKeys.map((k) => k.keyId),
          `${yesterday}T00:00:00Z`,
          `${tomorrow}T00:00:00Z`,
        );
        const mapped = mapAnthropicRows(rows, anthropicKeys);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
      } catch (err) {
        console.error("Failed to fetch Anthropic costs:", err);
      }
    }

    // OpenRouter (account-wide activity, attributed to each app's first key)
    const openrouterKeys = byProvider.openrouter ?? [];
    if (openrouterKeys.length > 0) {
      try {
        const rows = await fetchOpenRouterActivity();
        const mapped = mapOpenRouterRows(rows, openrouterKeys);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
      } catch (err) {
        console.error("Failed to fetch OpenRouter costs:", err);
      }
    }

    // xAI
    const xaiKeys = byProvider.xai ?? [];
    if (xaiKeys.length > 0) {
      try {
        const rows = await fetchXaiUsage(yesterday, tomorrow);
        const mapped = mapXaiRows(rows, xaiKeys);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
      } catch (err) {
        console.error("Failed to fetch xAI costs:", err);
      }
    }
  },
});

// --- Backfill action ---

export const backfillKey = internalAction({
  args: { trackedKeyId: v.id("tracked_keys"), days: v.optional(v.number()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const key = await ctx.runQuery(internal.costFetch.getTrackedKey, {
      trackedKeyId: args.trackedKeyId,
    });
    if (!key) return;

    const days = args.days ?? 30;
    const tomorrow = getDateString(1);
    const startDate = getDateString(-days);

    console.log(`Backfilling ${key.provider} key "${key.keyName}" from ${startDate} to ${tomorrow}`);

    switch (key.provider) {
      case "anthropic": {
        const rows = await fetchAnthropicCosts(
          [key.keyId],
          `${startDate}T00:00:00Z`,
          `${tomorrow}T00:00:00Z`,
        );
        console.log(`Anthropic returned ${rows.length} rows`);
        const mapped = mapAnthropicRows(rows, [key]);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
        break;
      }
      case "openrouter": {
        const rows = await fetchOpenRouterActivity();
        console.log(`OpenRouter activity returned ${rows.length} rows`);
        const mapped = mapOpenRouterRows(rows, [key]);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
        break;
      }
      case "xai": {
        let rows;
        try {
          rows = await fetchXaiUsage(startDate, tomorrow);
        } catch (err) {
          console.error(`xAI fetch failed (skipping): ${err}`);
          break;
        }
        console.log(`xAI returned ${rows.length} rows`);
        const mapped = mapXaiRows(rows, [key]);
        console.log(`xAI mapped to ${mapped.length} rows after key matching`);
        for (const chunk of chunkArray(mapped, 100)) {
          await ctx.runMutation(
            internal.costFetch.upsertDailyUsageBatch,
            { rows: chunk },
          );
        }
        break;
      }
    }
  },
});

// --- Public backfill mutation (schedules backfills and returns immediately) ---

export const backfillApp = mutation({
  args: { appId: v.id("apps"), days: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const keys = await ctx.db
      .query("tracked_keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
    for (const key of keys) {
      await ctx.scheduler.runAfter(0, internal.costFetch.backfillKey, {
        trackedKeyId: key._id,
        days: args.days,
      });
    }
  },
});

// --- Helpers ---

type TrackedKey = Doc<"tracked_keys">;

type UsageRow = {
  trackedKeyId: Id<"tracked_keys">;
  appId: Id<"apps">;
  provider: "anthropic" | "openrouter" | "xai";
  date: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
};

function mapAnthropicRows(
  rows: { apiKeyId: string; model: string; date: string; inputTokens: number; outputTokens: number; cost: number }[],
  keys: TrackedKey[],
): UsageRow[] {
  const keyMap = new Map(keys.map((k) => [k.keyId, k]));
  return rows
    .filter((r) => keyMap.has(r.apiKeyId))
    .map((r) => {
      const key = keyMap.get(r.apiKeyId)!;
      return {
        trackedKeyId: key._id,
        appId: key.appId,
        provider: "anthropic" as const,
        date: r.date,
        model: r.model,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        cost: r.cost,
      };
    });
}

function mapXaiRows(
  rows: { apiKeyId: string; model: string; date: string; inputTokens: number; outputTokens: number; cost: number }[],
  keys: TrackedKey[],
): UsageRow[] {
  const keyMap = new Map(keys.map((k) => [k.keyId, k]));
  return rows
    .filter((r) => keyMap.has(r.apiKeyId))
    .map((r) => {
      const key = keyMap.get(r.apiKeyId)!;
      return {
        trackedKeyId: key._id,
        appId: key.appId,
        provider: "xai" as const,
        date: r.date,
        model: r.model,
        inputTokens: r.inputTokens,
        outputTokens: r.outputTokens,
        cost: r.cost,
      };
    });
}

// OpenRouter activity is account-wide, so we attribute all rows to each app's
// first OpenRouter key. If multiple apps track OpenRouter, data is duplicated.
function mapOpenRouterRows(
  rows: { model: string; date: string; inputTokens: number; outputTokens: number; cost: number }[],
  keys: TrackedKey[],
): UsageRow[] {
  // Group keys by app — pick one key per app to attribute
  const appKeys = new Map<string, TrackedKey>();
  for (const k of keys) {
    if (!appKeys.has(k.appId)) appKeys.set(k.appId, k);
  }
  return Array.from(appKeys.values()).flatMap((key) =>
    rows.map((r) => ({
      trackedKeyId: key._id,
      appId: key.appId,
      provider: "openrouter" as const,
      date: r.date,
      model: r.model,
      inputTokens: r.inputTokens,
      outputTokens: r.outputTokens,
      cost: r.cost,
    })),
  );
}

function getDateString(daysOffset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = fn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
