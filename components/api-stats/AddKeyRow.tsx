"use client";

import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Provider = "anthropic" | "openrouter" | "xai";

export default function AddKeyRow({ appId }: { appId: Id<"apps"> }) {
  const [provider, setProvider] = useState<Provider | "">("");
  const [availableKeys, setAvailableKeys] = useState<
    { keyId: string; name: string }[] | null
  >(null);
  const [selectedKeyId, setSelectedKeyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useAction(api.trackedKeys.fetchProviderKeys);
  const addKey = useMutation(api.trackedKeys.add);

  const handleProviderChange = async (value: string) => {
    if (!value) return;
    const p = value as Provider;
    setProvider(p);
    setSelectedKeyId("");
    setAvailableKeys(null);
    setError(null);
    setLoading(true);
    try {
      const keys = await fetchKeys({ provider: p });
      setAvailableKeys(keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch keys");
      setAvailableKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!provider || !selectedKeyId) return;
    const keyName =
      availableKeys?.find((k) => k.keyId === selectedKeyId)?.name ?? "";
    await addKey({ appId, provider, keyId: selectedKeyId, keyName });
    setProvider("");
    setAvailableKeys(null);
    setSelectedKeyId("");
  };

  const selectClass =
    "h-9 rounded-lg border border-border bg-white px-3 pr-8 text-sm text-foreground outline-none focus:border-accent focus:ring-1 focus:ring-accent dark:bg-surface disabled:opacity-50";

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          value={provider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className={selectClass}
        >
          <option value="">Provider...</option>
          <option value="anthropic">Anthropic</option>
          <option value="openrouter">OpenRouter</option>
          <option value="xai">xAI</option>
        </select>

        <select
          value={selectedKeyId}
          disabled={!availableKeys || loading}
          onChange={(e) => setSelectedKeyId(e.target.value)}
          className={selectClass}
        >
          <option value="">
            {loading ? "Loading..." : "Select key..."}
          </option>
          {availableKeys?.map((k) => (
            <option key={k.keyId} value={k.keyId}>
              {k.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleAdd}
          disabled={!selectedKeyId}
          className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red">{error}</p>
      )}
    </div>
  );
}
