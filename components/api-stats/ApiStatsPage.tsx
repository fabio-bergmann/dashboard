"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ApiCostKpiCard from "./ApiCostKpiCard";

export default function ApiStatsPage() {
  const apps = useQuery(api.apps.list);
  const createApp = useMutation(api.apps.create);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await createApp({ name: trimmed });
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">API Stats</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Add App
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {apps?.map((app) => (
          <ApiCostKpiCard key={app._id} appId={app._id} appName={app.name} />
        ))}
      </div>

      <div
        className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${showCreate ? "bg-black/30 backdrop-blur-[2px]" : "bg-transparent pointer-events-none"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setShowCreate(false);
        }}
      >
        <div className={`w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-lg dark:bg-surface transition-all duration-200 ${showCreate ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            New App
          </h2>
          <input
            autoFocus={showCreate}
            type="text"
            placeholder="App name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowCreate(false);
            }}
            className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none dark:bg-surface"
          />
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowCreate(false);
                setNewName("");
              }}
              className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-task-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
