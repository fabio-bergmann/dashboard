"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import KpiCard from "./KpiCard";
import KpiCardWrapper from "./KpiCardWrapper";
import AreaSparkline from "./AreaSparkline";

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12H22M2 12C2 17.5228 6.47715 22 12 22M2 12C2 6.47715 6.47715 2 12 2M22 12C22 17.5228 17.5228 22 12 22M22 12C22 6.47715 17.5228 2 12 2M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" />
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
    return (
      <KpiCardWrapper
        cardId={`visitors-${site}`}
        defaultIcon={<GlobeIcon />}
        defaultUrl={`https://${site}`}
        defaultLinkType="external"
      >
        {(icon) => <KpiCard label={label} value="0" icon={icon} />}
      </KpiCardWrapper>
    );
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
    <KpiCardWrapper
      cardId={`visitors-${site}`}
      defaultIcon={<GlobeIcon />}
      defaultUrl={`https://${site}`}
      defaultLinkType="external"
    >
      {(icon) => (
        <KpiCard
          label={label}
          value={formattedValue}
          change={{ value: changePercent, period: "vs 30d ago" }}
          icon={icon}
          chart={<AreaSparkline data={chartData} labels={chartLabels} />}
        />
      )}
    </KpiCardWrapper>
  );
}
