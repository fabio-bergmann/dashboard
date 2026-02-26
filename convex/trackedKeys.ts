import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { internal } from "./_generated/api";

const providerValidator = v.union(
  v.literal("anthropic"),
  v.literal("openrouter"),
  v.literal("xai"),
);

export const listByApp = query({
  args: { appId: v.id("apps") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tracked_keys")
      .withIndex("by_app", (q) => q.eq("appId", args.appId))
      .collect();
  },
});

export const add = mutation({
  args: {
    appId: v.id("apps"),
    provider: providerValidator,
    keyId: v.string(),
    keyName: v.string(),
  },
  returns: v.id("tracked_keys"),
  handler: async (ctx, args) => {
    const trackedKeyId = await ctx.db.insert("tracked_keys", {
      appId: args.appId,
      provider: args.provider,
      keyId: args.keyId,
      keyName: args.keyName,
      addedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.costFetch.backfillKey, {
      trackedKeyId,
      days: 7,
    });
    return trackedKeyId;
  },
});

export const remove = mutation({
  args: { trackedKeyId: v.id("tracked_keys") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const usageRows = await ctx.db
      .query("daily_usage")
      .withIndex("by_tracked_key_date", (q) =>
        q.eq("trackedKeyId", args.trackedKeyId),
      )
      .collect();
    for (const row of usageRows) {
      await ctx.db.delete(row._id);
    }
    await ctx.db.delete(args.trackedKeyId);
  },
});

export const fetchProviderKeys = action({
  args: { provider: providerValidator },
  returns: v.array(v.object({ keyId: v.string(), name: v.string() })),
  handler: async (_ctx, args) => {
    switch (args.provider) {
      case "anthropic":
        return await fetchAnthropicKeys();
      case "openrouter":
        return await fetchOpenRouterKeys();
      case "xai":
        return await fetchXaiKeys();
    }
  },
});

async function fetchAnthropicKeys(): Promise<
  { keyId: string; name: string }[]
> {
  const apiKey = process.env.ANTHROPIC_ADMIN_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_ADMIN_KEY not set");

  const res = await fetch("https://api.anthropic.com/v1/organizations/api_keys", {
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const json = await res.json();
  return json.data
    .filter((k: { status: string }) => k.status === "active")
    .map((k: { id: string; name: string }) => ({ keyId: k.id, name: k.name }));
}

async function fetchOpenRouterKeys(): Promise<
  { keyId: string; name: string }[]
> {
  const apiKey = process.env.OPENROUTER_PROVISIONING_KEY;
  if (!apiKey) throw new Error("OPENROUTER_PROVISIONING_KEY not set");

  const res = await fetch("https://openrouter.ai/api/v1/keys", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`OpenRouter API error: ${res.status}`);
  const json = await res.json();
  return json.data.map((k: { hash: string; name: string }) => ({
    keyId: k.hash,
    name: k.name,
  }));
}

async function fetchXaiKeys(): Promise<{ keyId: string; name: string }[]> {
  const apiKey = process.env.XAI_MANAGEMENT_KEY;
  const teamId = process.env.XAI_TEAM_ID;
  if (!apiKey || !teamId)
    throw new Error("XAI_MANAGEMENT_KEY or XAI_TEAM_ID not set");

  const res = await fetch(
    `https://management-api.x.ai/auth/teams/${teamId}/api-keys`,
    { headers: { Authorization: `Bearer ${apiKey}` } },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`xAI API error: ${res.status} - ${body}`);
  }
  const json = await res.json();
  console.log("xAI list keys response:", JSON.stringify(json, null, 2));

  // Try multiple possible response shapes
  const keys: unknown[] = Array.isArray(json)
    ? json
    : json.data ?? json.api_keys ?? json.apiKeys ?? json.results ?? json.items ?? [];

  if (!Array.isArray(keys)) return [];

  return keys.map((item) => {
    const k = item as Record<string, unknown>;
    return {
      keyId: String(k.apiKeyId ?? k.api_key_id ?? k.id ?? ""),
      name: String(k.name ?? k.display_name ?? k.label ?? "Unnamed"),
    };
  }).filter((k) => k.keyId.length > 0);
}
