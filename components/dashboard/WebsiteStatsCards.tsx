"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import VisitorsKpiCard from "./VisitorsKpiCard";
import KpiCard from "./KpiCard";

export default function WebsiteStatsCards() {
  const sites = useQuery(api.websiteStats.listSites);

  if (sites === undefined) {
    return <KpiCard label="Visitors" />;
  }

  return (
    <>
      {sites.map((site) => (
        <VisitorsKpiCard key={site} site={site} />
      ))}
    </>
  );
}
