"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useCardSettings(cardId: string) {
  const settings = useQuery(api.cardSettings.get, { cardId });
  const icons = useQuery(api.customIcons.list);

  const customIcon =
    settings?.iconId && icons
      ? icons.find((i) => i._id === settings.iconId) ?? null
      : null;

  return { settings, customIcon, icons };
}
