export type OpenRouterUsageRow = {
  keyHash: string;
  date: string;
  cost: number;
};

export async function fetchOpenRouterKeyCost(
  keyHash: string,
): Promise<{ daily: number }> {
  const provKey = process.env.OPENROUTER_PROVISIONING_KEY;
  if (!provKey) throw new Error("OPENROUTER_PROVISIONING_KEY not set");

  const res = await fetch(`https://openrouter.ai/api/v1/keys/${keyHash}`, {
    headers: { Authorization: `Bearer ${provKey}` },
  });
  if (!res.ok) throw new Error(`OpenRouter key detail error: ${res.status}`);
  const json = await res.json();

  return {
    daily: json.data?.usage_daily ?? 0,
  };
}
