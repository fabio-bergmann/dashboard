"use client";

import { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value?: string;
  change?: {
    value: number;
    period: string;
  };
  icon?: ReactNode;
  chart?: ReactNode;
  className?: string;
};

export default function KpiCard({
  label,
  value,
  change,
  icon,
  chart,
  className,
}: KpiCardProps) {
  if (value === undefined) {
    return (
      <div
        className={`bg-white dark:bg-surface border border-border rounded-2xl p-5 ${className ?? ""}`}
      >
        <div className="h-4 w-20 bg-border rounded animate-pulse" />
        <div className="mt-3 h-9 w-28 bg-border rounded animate-pulse" />
        <div className="mt-2 h-4 w-24 bg-border rounded animate-pulse" />
        <div className="mt-4 h-[60px] w-full bg-border rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-surface border border-border rounded-2xl p-5 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-muted tracking-wide">
          {label}
        </span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>

      <div className="mt-2 text-3xl font-semibold text-foreground tabular-nums">
        {value}
      </div>

      {change && (
        <div className="mt-1 flex items-center gap-1">
          {change.value >= 0 ? (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="text-green"
              fill="currentColor"
            >
              <path d="M5 2L9 7H1L5 2Z" />
            </svg>
          ) : (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="text-red"
              fill="currentColor"
            >
              <path d="M5 8L1 3H9L5 8Z" />
            </svg>
          )}
          <span
            className={`text-sm font-medium ${change.value >= 0 ? "text-green" : "text-red"}`}
          >
            {change.value >= 0 ? "+" : ""}
            {change.value.toFixed(1)}%
          </span>
          <span className="text-xs text-muted ml-1">{change.period}</span>
        </div>
      )}

      {chart && <div className="mt-4 h-[60px]">{chart}</div>}
    </div>
  );
}
