"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import KpiCard from "./KpiCard";
import AreaSparkline from "./AreaSparkline";

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function VisitorsKpiCard({ site }: { site: string }) {
  const data = useQuery(api.websiteStats.list, { site });
  const label = `${site.charAt(0).toUpperCase()}${site.slice(1)} Visitors`;

  if (data === undefined) {
    return <KpiCard label={label} />;
  }

  if (data.length === 0) {
    return <KpiCard label={label} value="0" icon={<GlobeIcon />} />;
  }

  const last30 = data.slice(0, 30);

  const currentValue = last30[0].visitors;
  const oldestValue = last30[last30.length - 1].visitors;
  const changePercent =
    oldestValue !== 0
      ? ((currentValue - oldestValue) / oldestValue) * 100
      : 0;

  const reversed = [...last30].reverse();
  const chartData = reversed.map((d) => d.visitors);
  const chartLabels = reversed.map((d) => {
    const [year, month, day] = d.date.split("-");
    return new Date(+year, +month - 1, +day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  });
  const formattedValue = new Intl.NumberFormat("en-US").format(currentValue);

  return (
    <KpiCard
      label={label}
      value={formattedValue}
      change={{ value: changePercent, period: "vs 30d ago" }}
      icon={
        <a
          href={`https://${site}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          <GlobeIcon />
        </a>
      }
      chart={<AreaSparkline data={chartData} labels={chartLabels} />}
    />
  );
}
