"use client";

import { useRef, useState, useCallback } from "react";

export type BarSegment = {
  label: string;
  value: number;
  color: string;
};

type StackedBarSparklineProps = {
  data: BarSegment[][];
  dayLabels?: string[];
  width?: number;
  height?: number;
  formatValue?: (value: number) => string;
};

export const PALETTE = [
  "#3b82f6",
  "#f97316",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#eab308",
  "#6366f1",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function StackedBarSparkline({
  data,
  dayLabels,
  width = 200,
  height = 60,
  formatValue = (v) => `$${v.toFixed(2)}`,
}: StackedBarSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const index = Math.floor(ratio * data.length);
      setHoveredIndex(Math.max(0, Math.min(data.length - 1, index)));
    },
    [data.length],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  if (data.length === 0) return null;

  const gap = 2;
  const barWidth = (width - gap * (data.length - 1)) / data.length;

  const dayTotals = data.map((segments) =>
    segments.reduce((sum, s) => sum + s.value, 0),
  );
  const maxTotal = Math.max(...dayTotals);

  if (maxTotal === 0) return null;

  const tooltipLeftPercent =
    hoveredIndex !== null
      ? ((hoveredIndex + 0.5) / data.length) * 100
      : 0;

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        overflow="visible"
      >
        {data.map((segments, dayIdx) => {
          const x = dayIdx * (barWidth + gap);
          const isHovered = hoveredIndex === dayIdx;
          const isDimmed = hoveredIndex !== null && !isHovered;

          let cumHeight = 0;
          const rects = segments
            .filter((s) => s.value > 0)
            .map((segment, segIdx, filtered) => {
              const segHeight = (segment.value / maxTotal) * height;
              const y = height - cumHeight - segHeight;
              cumHeight += segHeight;
              const isTop = segIdx === filtered.length - 1;
              return (
                <rect
                  key={segIdx}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={segHeight}
                  fill={segment.color}
                  rx={isTop ? Math.min(1.5, barWidth / 4) : 0}
                  ry={isTop ? Math.min(1.5, barWidth / 4) : 0}
                />
              );
            });

          return (
            <g
              key={dayIdx}
              opacity={isDimmed ? 0.4 : 1}
              style={{ transition: "opacity 0.15s" }}
            >
              {rects}
            </g>
          );
        })}
      </svg>

      {hoveredIndex !== null && (
        <div
          className="absolute bottom-full mb-2 pointer-events-none z-10"
          style={{
            left: `${tooltipLeftPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-foreground text-background text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            {dayLabels?.[hoveredIndex] && (
              <div className="text-background/60 mb-1">
                {dayLabels[hoveredIndex]}
              </div>
            )}
            {data[hoveredIndex]
              .filter((s) => s.value > 0)
              .sort((a, b) => b.value - a.value)
              .map((segment, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-background/70 truncate max-w-[120px]">
                    {segment.label}
                  </span>
                  <span className="ml-auto pl-2">
                    {formatValue(segment.value)}
                  </span>
                </div>
              ))}
            <div className="border-t border-background/20 mt-1 pt-1 text-right">
              {formatValue(dayTotals[hoveredIndex])}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
