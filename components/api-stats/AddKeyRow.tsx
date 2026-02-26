"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type Provider = "anthropic" | "openrouter" | "xai";

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "xai", label: "xAI" },
];

function Dropdown({
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none transition-colors hover:bg-task-hover focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 dark:bg-surface"
      >
        <span className={selectedLabel ? "text-foreground" : "text-muted"}>
          {selectedLabel ?? placeholder}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 shrink-0 text-muted"
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      <div
        className={`absolute left-0 top-full mt-1 z-20 w-fit rounded-xl border border-border bg-white p-1.5 shadow-lg dark:bg-surface origin-top transition-all duration-150 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              close();
            }}
            className={`flex w-full items-center rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
              option.value === value
                ? "bg-accent/10 text-accent font-medium"
                : "text-foreground hover:bg-task-hover"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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

  const keyOptions = (availableKeys ?? []).map((k) => ({
    value: k.keyId,
    label: k.name,
  }));

  return (
    <div>
      <div className="flex items-center gap-2">
        <Dropdown
          value={provider}
          placeholder="Provider..."
          options={PROVIDERS}
          onChange={handleProviderChange}
        />

        <Dropdown
          value={selectedKeyId}
          placeholder={loading ? "Loading..." : "Select key..."}
          options={keyOptions}
          disabled={!availableKeys || loading}
          onChange={setSelectedKeyId}
        />

        <button
          onClick={handleAdd}
          disabled={!selectedKeyId}
          className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red">{error}</p>}
    </div>
  );
}
