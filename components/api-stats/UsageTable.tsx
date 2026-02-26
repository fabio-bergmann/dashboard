"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ProviderBadge from "./ProviderBadge";

export default function UsageTable({ appId }: { appId: Id<"apps"> }) {
  const usage = useQuery(api.dailyUsage.listByApp, { appId });

  if (usage === undefined) {
    return (
      <div className="rounded-2xl border border-border p-6">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-full animate-pulse rounded bg-border" />
          ))}
        </div>
      </div>
    );
  }

  if (usage.length === 0) {
    return (
      <div className="rounded-2xl border border-border py-12 text-center text-sm text-muted">
        No usage data yet. Add tracked keys to start collecting data.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            <th className="px-4 py-3 text-left font-medium text-muted">
              Date
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Provider
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted">
              Model
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted">
              Input Tokens
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted">
              Output Tokens
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted">
              Cost
            </th>
          </tr>
        </thead>
        <tbody>
          {usage.map((row) => (
            <tr
              key={row._id}
              className="border-b border-border last:border-0 hover:bg-task-hover"
            >
              <td className="px-4 py-3 tabular-nums">{row.date}</td>
              <td className="px-4 py-3">
                <ProviderBadge provider={row.provider} />
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {row.model === "_total" ? "All models" : row.model}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.inputTokens > 0
                  ? row.inputTokens.toLocaleString()
                  : "\u2014"}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {row.outputTokens > 0
                  ? row.outputTokens.toLocaleString()
                  : "\u2014"}
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums">
                ${row.cost.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
