"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import KpiCard from "../dashboard/KpiCard";
import StackedBarSparkline, {
  PALETTE,
  type BarSegment,
} from "./StackedBarSparkline";
import TrackedKeysDialog from "./TrackedKeysDialog";

function CardMenu({
  onManageKeys,
  onRemove,
}: {
  onManageKeys: () => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center justify-center w-6 h-6 rounded-md text-muted transition-colors hover:bg-task-hover hover:text-foreground"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      <div
        className={`absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-xl border border-border bg-white p-1.5 shadow-lg dark:bg-surface origin-top-right transition-all duration-150 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
      >
        <button
          onClick={() => {
            setOpen(false);
            onManageKeys();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-task-hover"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.87601 18.1156C2.92195 17.7021 2.94493 17.4954 3.00748 17.3022C3.06298 17.1307 3.1414 16.9676 3.24061 16.8171C3.35242 16.6475 3.49952 16.5005 3.7937 16.2063L17 3C18.1046 1.89543 19.8954 1.89543 21 3C22.1046 4.10457 22.1046 5.89543 21 7L7.7937 20.2063C7.49951 20.5005 7.35242 20.6475 7.18286 20.7594C7.03242 20.8586 6.86926 20.937 6.69782 20.9925C6.50457 21.055 6.29783 21.078 5.88434 21.124L2.49997 21.5L2.87601 18.1156Z" />
          </svg>
          Manage Keys
        </button>
        <button
          onClick={() => {
            setOpen(false);
            onRemove();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red transition-colors hover:bg-red/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6M10 10.5V15.5M14 10.5V15.5" />
          </svg>
          Remove App
        </button>
      </div>
    </div>
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openrouter: "OpenRouter",
  xai: "xAI",
};

export default function ApiCostKpiCard({
  appId,
  appName,
}: {
  appId: Id<"apps">;
  appName: string;
}) {
  const usage = useQuery(api.dailyUsage.listByApp, { appId });
  const removeApp = useMutation(api.apps.remove);
  const [showKeysDialog, setShowKeysDialog] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const menu = (
    <CardMenu
      onManageKeys={() => setShowKeysDialog(true)}
      onRemove={() => setShowConfirmRemove(true)}
    />
  );

  const card = (() => {
    if (usage === undefined) {
      return <KpiCard label={appName} icon={menu} />;
    }

    if (usage.length === 0) {
      return <KpiCard label={appName} value="$0.00" icon={menu} />;
    }

    const { chartData, dayLabels, totalCost, change } = transformUsage(usage);

    return (
      <KpiCard
        label={appName}
        value={`$${totalCost.toFixed(2)}`}
        change={change}
        icon={menu}
        chart={
          chartData.length > 0 ? (
            <StackedBarSparkline data={chartData} dayLabels={dayLabels} />
          ) : undefined
        }
      />
    );
  })();

  return (
    <>
      {card}
      <TrackedKeysDialog
        appId={appId}
        open={showKeysDialog}
        onClose={() => setShowKeysDialog(false)}
      />
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${showConfirmRemove ? "bg-black/30 backdrop-blur-[2px]" : "bg-transparent pointer-events-none"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowConfirmRemove(false);
        }}
      >
        <div className={`w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-lg dark:bg-surface transition-all duration-200 ${showConfirmRemove ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <h2 className="text-lg font-semibold text-foreground">
            Remove App
          </h2>
          <p className="mt-2 text-sm text-muted">
            Are you sure you want to remove <strong>{appName}</strong>? All
            tracked keys and usage data will be permanently deleted.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowConfirmRemove(false)}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-task-hover"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await removeApp({ appId });
                setShowConfirmRemove(false);
              }}
              className="h-9 rounded-lg bg-red px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

type UsageRow = {
  provider: string;
  date: string;
  model: string;
  cost: number;
};

function transformUsage(rows: UsageRow[]) {
  const groupKey = (r: UsageRow) => `${r.date}|${r.provider}`;
  const groups = new Map<string, UsageRow[]>();
  for (const r of rows) {
    const k = groupKey(r);
    const arr = groups.get(k);
    if (arr) arr.push(r);
    else groups.set(k, [r]);
  }

  const cleaned: { date: string; model: string; cost: number }[] = [];
  for (const [, group] of groups) {
    const hasNamed = group.some((r) => r.model !== "_total");
    for (const r of group) {
      if (r.model === "_total" && hasNamed) continue;
      cleaned.push({
        date: r.date,
        model:
          r.model === "_total"
            ? (PROVIDER_LABELS[r.provider] ?? r.provider)
            : r.model,
        cost: r.cost,
      });
    }
  }

  const byDate = new Map<string, Map<string, number>>();
  for (const r of cleaned) {
    let dateMap = byDate.get(r.date);
    if (!dateMap) {
      dateMap = new Map();
      byDate.set(r.date, dateMap);
    }
    dateMap.set(r.model, (dateMap.get(r.model) ?? 0) + r.cost);
  }

  const sortedDates = Array.from(byDate.keys()).sort();
  const windowDates = sortedDates.slice(-7);

  if (windowDates.length === 0) {
    return { chartData: [], dayLabels: [], totalCost: 0, change: undefined };
  }

  const allModels = new Set<string>();
  for (const date of windowDates) {
    const dateMap = byDate.get(date)!;
    for (const model of dateMap.keys()) {
      allModels.add(model);
    }
  }
  const modelList = Array.from(allModels).sort();
  const modelColors = new Map(
    modelList.map((m, i) => [m, PALETTE[i % PALETTE.length]]),
  );

  const chartData: BarSegment[][] = windowDates.map((date) => {
    const dateMap = byDate.get(date)!;
    return modelList
      .map((model) => ({
        label: model,
        value: dateMap.get(model) ?? 0,
        color: modelColors.get(model)!,
      }))
      .filter((s) => s.value > 0);
  });

  const dayLabels = windowDates.map((d) => {
    const [year, month, day] = d.split("-");
    return new Date(+year, +month - 1, +day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  });

  const dayTotals = windowDates.map((date) => {
    const dateMap = byDate.get(date)!;
    let sum = 0;
    for (const v of dateMap.values()) sum += v;
    return sum;
  });

  const totalCost = dayTotals.reduce((a, b) => a + b, 0);
  const recentDay = dayTotals[dayTotals.length - 1];
  const oldestDay = dayTotals[0];
  const change =
    oldestDay > 0
      ? {
          value: ((recentDay - oldestDay) / oldestDay) * 100,
          period: "vs 7d ago",
        }
      : undefined;

  return { chartData, dayLabels, totalCost, change };
}
