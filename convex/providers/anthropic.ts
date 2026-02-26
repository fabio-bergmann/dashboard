export type AnthropicUsageRow = {
  apiKeyId: string;
  model: string;
  date: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
};

// Per-million-token pricing (USD). Input / Output.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-0": { input: 15, output: 75 },
  "claude-sonnet-4-0": { input: 3, output: 15 },
  "claude-sonnet-4-5-20250514": { input: 3, output: 15 },
  "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
  "claude-3-5-sonnet-20240620": { input: 3, output: 15 },
  "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
  "claude-3-opus-20240229": { input: 15, output: 75 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
};

const DEFAULT_PRICING = { input: 3, output: 15 };

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing =
    Object.entries(MODEL_PRICING).find(([key]) =>
      model.includes(key),
    )?.[1] ?? DEFAULT_PRICING;
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

export async function fetchAnthropicCosts(
  keyIds: string[],
  startDate: string,
  endDate: string,
): Promise<AnthropicUsageRow[]> {
  const adminKey = process.env.ANTHROPIC_ADMIN_KEY;
  if (!adminKey) throw new Error("ANTHROPIC_ADMIN_KEY not set");

  const headers = {
    "x-api-key": adminKey,
    "anthropic-version": "2023-06-01",
  };

  const buckets = await fetchUsageReport(headers, keyIds, startDate, endDate);
  return mapUsageToRows(buckets);
}

type UsageBucket = {
  starting_at: string;
  results: Array<{
    model?: string;
    api_key_id?: string;
    uncached_input_tokens: number;
    cache_read_input_tokens: number;
    output_tokens: number;
    cache_creation?: {
      ephemeral_5m_input_tokens: number;
      ephemeral_1h_input_tokens: number;
    };
  }>;
};

async function fetchUsageReport(
  headers: Record<string, string>,
  keyIds: string[],
  startDate: string,
  endDate: string,
): Promise<UsageBucket[]> {
  const url = new URL(
    "https://api.anthropic.com/v1/organizations/usage_report/messages",
  );
  url.searchParams.set("starting_at", startDate);
  url.searchParams.set("ending_at", endDate);
  url.searchParams.set("bucket_width", "1d");
  url.searchParams.set("limit", "31");
  url.searchParams.append("group_by[]", "api_key_id");
  url.searchParams.append("group_by[]", "model");
  for (const id of keyIds) {
    url.searchParams.append("api_key_ids[]", id);
  }

  const buckets: UsageBucket[] = [];
  let nextPage: string | null = url.toString();
  console.log("Anthropic usage URL:", nextPage);

  while (nextPage) {
    const res: Response = await fetch(nextPage, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic usage_report error: ${res.status} - ${body}`);
    }
    const json: {
      data?: UsageBucket[];
      has_more?: boolean;
      next_page?: string;
    } = await res.json();
    buckets.push(...(json.data ?? []));
    nextPage = json.has_more ? json.next_page ?? null : null;
  }

  return buckets;
}

function mapUsageToRows(buckets: UsageBucket[]): AnthropicUsageRow[] {
  const resultMap = new Map<string, AnthropicUsageRow>();

  for (const bucket of buckets) {
    const date = bucket.starting_at.split("T")[0];
    for (const r of bucket.results) {
      const apiKeyId = r.api_key_id ?? "unknown";
      const model = r.model ?? "unknown";
      const key = `${apiKeyId}|${date}|${model}`;

      const inputTokens =
        (r.uncached_input_tokens ?? 0) +
        (r.cache_read_input_tokens ?? 0) +
        (r.cache_creation?.ephemeral_5m_input_tokens ?? 0) +
        (r.cache_creation?.ephemeral_1h_input_tokens ?? 0);
      const outputTokens = r.output_tokens ?? 0;

      const existing = resultMap.get(key);
      if (existing) {
        existing.inputTokens += inputTokens;
        existing.outputTokens += outputTokens;
        existing.cost = estimateCost(
          model,
          existing.inputTokens,
          existing.outputTokens,
        );
      } else {
        resultMap.set(key, {
          apiKeyId,
          model,
          date,
          inputTokens,
          outputTokens,
          cost: estimateCost(model, inputTokens, outputTokens),
        });
      }
    }
  }

  return Array.from(resultMap.values());
}
