"use client";

const providerStyles: Record<string, string> = {
  anthropic: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  openrouter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  xai: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
};

const providerLabels: Record<string, string> = {
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
  xai: "xAI",
};

export default function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${providerStyles[provider] ?? "bg-neutral-100 text-neutral-700"}`}
    >
      {providerLabels[provider] ?? provider}
    </span>
  );
}
