"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { useCardSettings } from "@/hooks/useCardSettings";
import CardContextMenu from "./CardContextMenu";
import EditCardDialog from "./EditCardDialog";
import SvgIcon from "./SvgIcon";

type KpiCardWrapperProps = {
  cardId: string;
  defaultIcon: ReactNode;
  defaultUrl: string;
  defaultLinkType: "internal" | "external";
  children: (icon: ReactNode) => ReactNode;
};

export default function KpiCardWrapper({
  cardId,
  defaultIcon,
  defaultUrl,
  defaultLinkType,
  children,
}: KpiCardWrapperProps) {
  const { settings, customIcon } = useCardSettings(cardId);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const iconElement = customIcon ? (
    <SvgIcon svgContent={customIcon.svgContent} className="h-4 w-4" />
  ) : (
    defaultIcon
  );

  const url = settings?.destinationUrl ?? defaultUrl;
  const linkType = settings?.linkType ?? defaultLinkType;

  const wrappedIcon =
    linkType === "internal" ? (
      <Link
        href={url}
        className="text-muted transition-colors hover:text-foreground"
      >
        {iconElement}
      </Link>
    ) : (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted transition-colors hover:text-foreground"
      >
        {iconElement}
      </a>
    );

  return (
    <div onContextMenu={handleContextMenu}>
      {children(wrappedIcon)}

      {contextMenu && (
        <CardContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => setEditOpen(true)}
          onClose={() => setContextMenu(null)}
        />
      )}

      <EditCardDialog
        cardId={cardId}
        open={editOpen}
        defaultIcon={defaultIcon}
        defaultUrl={defaultUrl}
        defaultLinkType={defaultLinkType}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
