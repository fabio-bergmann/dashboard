"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import AppSelector from "./AppSelector";
import TrackedKeysDialog from "./TrackedKeysDialog";
import UsageTable from "./UsageTable";

export default function ApiStatsPage() {
  const apps = useQuery(api.apps.list);
  const [selectedAppId, setSelectedAppId] = useState<Id<"apps"> | null>(null);
  const [showKeysDialog, setShowKeysDialog] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const backfillApp = useMutation(api.costFetch.backfillApp);

  // Auto-select first app when apps load
  useEffect(() => {
    if (apps && apps.length > 0 && !selectedAppId) {
      setSelectedAppId(apps[0]._id);
    }
  }, [apps, selectedAppId]);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <AppSelector
          apps={apps ?? []}
          selectedAppId={selectedAppId}
          onSelect={setSelectedAppId}
        />
        <button
          onClick={() => setShowKeysDialog(true)}
          disabled={!selectedAppId}
          className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-task-hover disabled:opacity-50"
        >
          Manage Keys
        </button>
        <button
          onClick={async () => {
            if (!selectedAppId) return;
            setBackfilling(true);
            try {
              await backfillApp({ appId: selectedAppId, days: 7 });
            } finally {
              setBackfilling(false);
            }
          }}
          disabled={!selectedAppId || backfilling}
          className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-task-hover disabled:opacity-50"
        >
          {backfilling ? "Backfilling..." : "Backfill 7 days"}
        </button>
      </div>

      {selectedAppId && <UsageTable appId={selectedAppId} />}

      {showKeysDialog && selectedAppId && (
        <TrackedKeysDialog
          appId={selectedAppId}
          onClose={() => setShowKeysDialog(false)}
        />
      )}
    </div>
  );
}
