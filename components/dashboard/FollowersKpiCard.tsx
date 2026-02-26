"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import KpiCard from "./KpiCard";
import KpiCardWrapper from "./KpiCardWrapper";
import AreaSparkline from "./AreaSparkline";

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function FollowersKpiCard() {
  const data = useQuery(api.xStats.list);

  if (data === undefined) {
    return <KpiCard label="Followers" />;
  }

  if (data.length === 0) {
    return (
      <KpiCardWrapper
        cardId="followers"
        defaultIcon={<XIcon />}
        defaultUrl="https://x.com/i/account_analytics"
        defaultLinkType="external"
      >
        {(icon) => <KpiCard label="Followers" value="0" icon={icon} />}
      </KpiCardWrapper>
    );
  }

  const last30 = data.slice(0, 30);

  const currentValue = last30[0].followers;
  const oldestValue = last30[last30.length - 1].followers;
  const changePercent =
    oldestValue !== 0
      ? ((currentValue - oldestValue) / oldestValue) * 100
      : 0;

  const reversed = [...last30].reverse();
  const chartData = reversed.map((d) => d.followers);
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
      cardId="followers"
      defaultIcon={<XIcon />}
      defaultUrl="https://x.com/i/account_analytics"
      defaultLinkType="external"
    >
      {(icon) => (
        <KpiCard
          label="Followers"
          value={formattedValue}
          change={{ value: changePercent, period: "vs 30d ago" }}
          icon={icon}
          chart={<AreaSparkline data={chartData} labels={chartLabels} />}
        />
      )}
    </KpiCardWrapper>
  );
}
