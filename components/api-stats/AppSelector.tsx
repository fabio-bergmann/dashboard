"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type App = {
  _id: Id<"apps">;
  name: string;
};

type AppSelectorProps = {
  apps: App[];
  selectedAppId: Id<"apps"> | null;
  onSelect: (appId: Id<"apps">) => void;
};

export default function AppSelector({
  apps,
  selectedAppId,
  onSelect,
}: AppSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const createApp = useMutation(api.apps.create);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = await createApp({ name: trimmed });
    onSelect(id);
    setNewName("");
    setIsCreating(false);
  };

  if (isCreating) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") setIsCreating(false);
          }}
          placeholder="App name..."
          autoFocus
          className="h-9 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent dark:bg-surface"
        />
        <button
          onClick={handleCreate}
          className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Create
        </button>
        <button
          onClick={() => setIsCreating(false)}
          className="h-9 rounded-lg border border-border px-3 text-sm font-medium text-muted transition-colors hover:bg-task-hover"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedAppId ?? ""}
        onChange={(e) => {
          if (e.target.value === "__create__") {
            setIsCreating(true);
          } else if (e.target.value) {
            onSelect(e.target.value as Id<"apps">);
          }
        }}
        className="h-9 rounded-lg border border-border bg-white px-3 pr-8 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent dark:bg-surface"
      >
        {apps.length === 0 && <option value="">No apps yet</option>}
        {apps.map((app) => (
          <option key={app._id} value={app._id}>
            {app.name}
          </option>
        ))}
        <option value="__create__">+ New App</option>
      </select>
    </div>
  );
}
