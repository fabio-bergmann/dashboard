export type XaiUsageRow = {
  apiKeyId: string;
  model: string;
  date: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
};

export async function fetchXaiUsage(
  startDate: string,
  endDate: string,
): Promise<XaiUsageRow[]> {
  const apiKey = process.env.XAI_MANAGEMENT_KEY;
  const teamId = process.env.XAI_TEAM_ID;
  if (!apiKey || !teamId)
    throw new Error("XAI_MANAGEMENT_KEY or XAI_TEAM_ID not set");

  const res = await fetch(
    `https://management-api.x.ai/v1/billing/teams/${teamId}/usage`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start_date: startDate,
        end_date: endDate,
        granularity: "daily",
        group_by: ["api_key", "model"],
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    console.error(`xAI usage error: ${res.status} - ${body}`);
    throw new Error(`xAI usage error: ${res.status} - ${body}`);
  }
  const json = await res.json();
  console.log("xAI usage response:", JSON.stringify(json, null, 2));

  return mapXaiResponse(json);
}

function mapXaiResponse(json: unknown): XaiUsageRow[] {
  const rows: XaiUsageRow[] = [];

  // The xAI usage API response schema is not fully documented.
  // This handles the most likely response shapes.
  const data = (json as Record<string, unknown>).data ?? json;

  if (!Array.isArray(data)) {
    // If the response is a single object with usage entries, try to extract
    const entries = (data as Record<string, unknown>).usage_entries ?? (data as Record<string, unknown>).entries;
    if (Array.isArray(entries)) {
      return mapEntries(entries);
    }
    return rows;
  }

  return mapEntries(data);
}

function mapEntries(entries: unknown[]): XaiUsageRow[] {
  return entries
    .map((entry: unknown) => {
      const e = entry as Record<string, unknown>;
      const costTicks = Number(e.cost_in_usd_ticks ?? e.cost ?? 0);
      // cost_in_usd_ticks is in units of 1/10 billionth of a dollar
      const cost =
        e.cost_in_usd_ticks !== undefined
          ? costTicks / 10_000_000_000
          : costTicks;

      return {
        apiKeyId: String(e.api_key_id ?? e.apiKeyId ?? "unknown"),
        model: String(e.model ?? "unknown"),
        date: String(e.date ?? "").split("T")[0],
        inputTokens: Number(e.prompt_tokens ?? e.input_tokens ?? 0),
        outputTokens: Number(e.completion_tokens ?? e.output_tokens ?? 0),
        cost,
      };
    })
    .filter((r) => r.date.length > 0);
}
