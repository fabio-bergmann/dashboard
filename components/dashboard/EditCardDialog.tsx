"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import SvgIcon from "./SvgIcon";

function sanitizeSvg(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

type EditCardDialogProps = {
  cardId: string;
  open: boolean;
  defaultIcon: React.ReactNode;
  defaultUrl: string;
  defaultLinkType: "internal" | "external";
  onClose: () => void;
};

export default function EditCardDialog({
  cardId,
  open,
  defaultIcon,
  defaultUrl,
  defaultLinkType,
  onClose,
}: EditCardDialogProps) {
  const settings = useQuery(api.cardSettings.get, { cardId });
  const icons = useQuery(api.customIcons.list);
  const upsert = useMutation(api.cardSettings.upsert);

  const [selectedIconId, setSelectedIconId] = useState<
    Id<"custom_icons"> | null
  >(null);
  const [url, setUrl] = useState(defaultUrl);
  const [linkType, setLinkType] = useState<"internal" | "external">(
    defaultLinkType,
  );
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadIcon = useMutation(api.customIcons.upload);
  const removeIcon = useMutation(api.customIcons.remove);

  useEffect(() => {
    if (settings !== undefined && !initialized) {
      if (settings) {
        setSelectedIconId(settings.iconId ?? null);
        setUrl(settings.destinationUrl);
        setLinkType(settings.linkType);
      }
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsert({
        cardId,
        iconId: selectedIconId ?? undefined,
        destinationUrl: url,
        linkType,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${open ? "bg-black/30 backdrop-blur-[2px]" : "bg-transparent pointer-events-none"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-lg dark:bg-surface transition-all duration-200 ${open ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Edit Card</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
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

        {/* Icon Picker */}
        <div className="mb-4">
          <label className="mb-2 block text-xs font-medium text-muted">
            Icon
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const svgContent = sanitizeSvg(text);
              const name = file.name.replace(/\.svg$/i, "");
              await uploadIcon({ name, svgContent });
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
          {icons === undefined ? (
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 animate-pulse rounded-lg bg-border"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedIconId(null)}
                title="Default"
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-foreground transition-colors ${
                  selectedIconId === null
                    ? "border-accent bg-accent/10"
                    : "border-border hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {defaultIcon}
              </button>
              {icons.map((icon) => (
                <div key={icon._id} className="group relative">
                  <button
                    onClick={() => setSelectedIconId(icon._id)}
                    title={icon.name}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                      selectedIconId === icon._id
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <SvgIcon
                      svgContent={icon.svgContent}
                      className="h-5 w-5 text-foreground"
                    />
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedIconId === icon._id) setSelectedIconId(null);
                      await removeIcon({ iconId: icon._id });
                    }}
                    className="absolute -right-1.5 -top-1.5 hidden h-4 w-4 items-center justify-center rounded-full bg-red text-white group-hover:flex"
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload SVG icon"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Destination URL */}
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-muted">
            Destination URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com or /dashboard"
            className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-accent dark:bg-surface"
          />
        </div>

        {/* Link Type */}
        <div className="mb-6">
          <label className="mb-1 block text-xs font-medium text-muted">
            Link Type
          </label>
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => setLinkType("internal")}
              className={`flex-1 rounded-l-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                linkType === "internal"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Internal
            </button>
            <button
              onClick={() => setLinkType("external")}
              className={`flex-1 rounded-r-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                linkType === "external"
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              External
            </button>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !url.trim()}
          className="h-9 w-full rounded-lg bg-accent text-sm font-medium text-white transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
