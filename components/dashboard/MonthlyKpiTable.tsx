"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const fmt = new Intl.NumberFormat("en-US");

function getMonthKey(date: string) {
  return date.slice(0, 7); // "YYYY-MM"
}

function formatMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Date(+year, +month - 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** For each month, pick the last snapshot (highest date) as the month-end value. */
function aggregateMonthly(
  rows: { date: string }[],
  getValue: (row: never) => number,
): Map<string, number> {
  const map = new Map<string, { date: string; value: number }>();
  for (const row of rows) {
    const key = getMonthKey(row.date);
    const existing = map.get(key);
    if (!existing || row.date > existing.date) {
      map.set(key, { date: row.date, value: getValue(row as never) });
    }
  }
  const result = new Map<string, number>();
  for (const [key, { value }] of map) {
    result.set(key, value);
  }
  return result;
}

export default function MonthlyKpiTable() {
  const ytData = useQuery(api.youtubeStats.list);
  const xData = useQuery(api.xStats.list);

  // Loading state
  if (ytData === undefined || xData === undefined) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface">
        <div className="p-4 space-y-3">
          <div className="h-4 w-32 bg-border rounded animate-pulse" />
          <div className="h-4 w-full bg-border rounded animate-pulse" />
          <div className="h-4 w-full bg-border rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Aggregate per month
  const ytMonthly = aggregateMonthly(ytData, (r: { subscriberCount: number }) => r.subscriberCount);
  const xMonthly = aggregateMonthly(xData, (r: { followers: number }) => r.followers);

  // All months of the current year (Jan–Dec), filled in advance
  const currentYear = new Date().getFullYear();
  const allMonths = Array.from({ length: 12 }, (_, i) =>
    `${currentYear}-${String(i + 1).padStart(2, "0")}`,
  );

  const rows = [
    { label: "YouTube Subs", data: ytMonthly },
    { label: "X Followers", data: xMonthly },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white dark:bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted sticky left-0 bg-white dark:bg-surface">
                KPI
              </th>
              {allMonths.map((m) => {
                const isCurrentMonth = m === getMonthKey(new Date().toISOString());
                return (
                  <th
                    key={m}
                    className={`px-4 py-3 text-right font-medium whitespace-nowrap ${isCurrentMonth ? "text-foreground" : "text-muted"}`}
                  >
                    {formatMonthLabel(m)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-white dark:bg-surface whitespace-nowrap">
                  {row.label}
                </td>
                {allMonths.map((m) => {
                  const value = row.data.get(m);
                  return (
                    <td
                      key={m}
                      className="px-4 py-3 tabular-nums text-right text-foreground"
                    >
                      {value !== undefined ? fmt.format(value) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
