"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import ProviderBadge from "./ProviderBadge";
import AddKeyRow from "./AddKeyRow";

type TrackedKeysDialogProps = {
  appId: Id<"apps">;
  open: boolean;
  onClose: () => void;
};

export default function TrackedKeysDialog({
  appId,
  open,
  onClose,
}: TrackedKeysDialogProps) {
  const keys = useQuery(api.trackedKeys.listByApp, { appId });
  const removeKey = useMutation(api.trackedKeys.remove);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${open ? "bg-black/30 backdrop-blur-[2px]" : "bg-transparent pointer-events-none"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-lg dark:bg-surface transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Tracked Keys
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-task-hover hover:text-foreground"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {keys === undefined ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-lg bg-border"
              />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            No keys tracked yet. Add one below.
          </p>
        ) : (
          <div className="mb-4 space-y-1">
            {keys.map((key) => (
              <div
                key={key._id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <ProviderBadge provider={key.provider} />
                  <span className="text-sm text-foreground">
                    {key.keyName}
                  </span>
                </div>
                <button
                  onClick={() => removeKey({ trackedKeyId: key._id })}
                  className="rounded p-1 text-muted transition-colors hover:bg-red/10 hover:text-red"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted">Add a key</p>
          <AddKeyRow appId={appId} />
        </div>
      </div>
    </div>
  );
}
