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

  // xAI uses gRPC with JSON transcoding. Schema from:
  // https://github.com/xai-org/xai-proto/blob/main/proto/xai/shared/analytics/analytics.proto
  const requestBody = {
    analyticsRequest: {
      timeRange: {
        startTime: `${startDate} 00:00:00`,
        endTime: `${endDate} 00:00:00`,
        timezone: "UTC",
      },
      timeUnit: "TIME_UNIT_DAY",
      values: [
        { name: "cost", aggregation: "AGGREGATION_SUM" },
        { name: "tokens", aggregation: "AGGREGATION_SUM" },
      ],
      groupBy: ["api_key", "model"],
    },
  };
  console.log("xAI usage request:", JSON.stringify(requestBody));

  const res = await fetch(
    `https://management-api.x.ai/v1/billing/teams/${teamId}/usage`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
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
  const root = json as Record<string, unknown>;

  // The response likely has time-bucketed results
  const buckets =
    (root.buckets as unknown[]) ??
    (root.data as unknown[]) ??
    (root.results as unknown[]) ??
    (root.rows as unknown[]);

  if (Array.isArray(buckets)) {
    return buckets.flatMap(mapBucketOrEntry);
  }

  // Maybe the response is flat entries
  const entries =
    (root.entries as unknown[]) ??
    (root.items as unknown[]);
  if (Array.isArray(entries)) {
    return entries.flatMap(mapBucketOrEntry);
  }

  return [];
}

function mapBucketOrEntry(item: unknown): XaiUsageRow[] {
  const e = item as Record<string, unknown>;

  // If this bucket has nested results (time-bucketed response)
  const nested =
    (e.results as unknown[]) ??
    (e.rows as unknown[]) ??
    (e.entries as unknown[]);
  if (Array.isArray(nested)) {
    const bucketDate = extractDate(e);
    return nested.map((sub) => mapSingleEntry(sub as Record<string, unknown>, bucketDate));
  }

  // Otherwise this is a flat entry
  return [mapSingleEntry(e, "")];
}

function mapSingleEntry(e: Record<string, unknown>, fallbackDate: string): XaiUsageRow {
  // Extract cost — could be in various formats
  let cost = 0;
  if (e.cost !== undefined) {
    cost = Number(e.cost);
  } else if (e.cost_in_usd_ticks !== undefined) {
    cost = Number(e.cost_in_usd_ticks) / 10_000_000_000;
  }
  // Check for values array (analytics response format)
  const values = e.values as unknown[];
  if (Array.isArray(values)) {
    for (const v of values) {
      const val = v as Record<string, unknown>;
      if (val.name === "cost") cost = Number(val.value ?? 0);
      if (val.name === "tokens") {
        // tokens value might be available here
      }
    }
  }

  const date = extractDate(e) || fallbackDate;

  return {
    apiKeyId: String(
      e.api_key ?? e.apiKey ?? e.api_key_id ?? e.apiKeyId ?? "unknown",
    ),
    model: String(e.model ?? "unknown"),
    date,
    inputTokens: Number(e.prompt_tokens ?? e.input_tokens ?? 0),
    outputTokens: Number(e.completion_tokens ?? e.output_tokens ?? 0),
    cost,
  };
}

function extractDate(e: Record<string, unknown>): string {
  const raw =
    e.date ?? e.time ?? e.timestamp ?? e.startTime ?? e.start_time ?? "";
  return String(raw).split(" ")[0].split("T")[0];
}
