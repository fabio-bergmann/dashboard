export type OpenRouterUsageRow = {
  model: string;
  date: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
};

// Fetches per-model, per-day activity for the last 30 UTC days.
// This is account-wide (not per-key) — OpenRouter doesn't support per-key model breakdown.
export async function fetchOpenRouterActivity(): Promise<OpenRouterUsageRow[]> {
  const provKey = process.env.OPENROUTER_PROVISIONING_KEY;
  if (!provKey) throw new Error("OPENROUTER_PROVISIONING_KEY not set");

  const res = await fetch("https://openrouter.ai/api/v1/activity", {
    headers: { Authorization: `Bearer ${provKey}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter activity error: ${res.status} - ${body}`);
  }

  const json: {
    data?: Array<{
      date: string;
      model: string;
      usage: number;
      prompt_tokens: number;
      completion_tokens: number;
    }>;
  } = await res.json();

  return (json.data ?? []).map((item) => ({
    model: item.model,
    date: item.date.split(" ")[0].split("T")[0],
    inputTokens: item.prompt_tokens ?? 0,
    outputTokens: item.completion_tokens ?? 0,
    cost: item.usage ?? 0,
  }));
}
