"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import KpiCard from "./KpiCard";
import KpiCardWrapper from "./KpiCardWrapper";
import AreaSparkline from "./AreaSparkline";

function YouTubeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function SubscribersKpiCard() {
  const data = useQuery(api.youtubeStats.list);

  if (data === undefined) {
    return <KpiCard label="Subscribers" />;
  }

  if (data.length === 0) {
    return (
      <KpiCardWrapper
        cardId="yt-subscribers"
        defaultIcon={<YouTubeIcon />}
        defaultUrl="https://studio.youtube.com"
        defaultLinkType="external"
      >
        {(icon) => <KpiCard label="Subscribers" value="0" icon={icon} />}
      </KpiCardWrapper>
    );
  }

  const last30 = data.slice(0, 30);

  const currentValue = last30[0].subscriberCount;
  const oldestValue = last30[last30.length - 1].subscriberCount;
  const changePercent =
    oldestValue !== 0
      ? ((currentValue - oldestValue) / oldestValue) * 100
      : 0;

  const reversed = [...last30].reverse();
  const chartData = reversed.map((d) => d.subscriberCount);
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
      cardId="yt-subscribers"
      defaultIcon={<YouTubeIcon />}
      defaultUrl="https://studio.youtube.com"
      defaultLinkType="external"
    >
      {(icon) => (
        <KpiCard
          label="Subscribers"
          value={formattedValue}
          change={{ value: changePercent, period: "vs 30d ago" }}
          icon={icon}
          chart={<AreaSparkline data={chartData} labels={chartLabels} />}
        />
      )}
    </KpiCardWrapper>
  );
}
