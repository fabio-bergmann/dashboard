"use client";

import { useId, useRef, useState, useCallback } from "react";

type AreaSparklineProps = {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
  formatValue?: (value: number) => string;
};

export default function AreaSparkline({
  data,
  labels,
  width = 200,
  height = 60,
  strokeColor = "var(--accent)",
  fillColor = "var(--accent)",
  strokeWidth = 2,
  className,
  formatValue = (v) => v.toLocaleString("en-US"),
}: AreaSparklineProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const index = Math.round(ratio * (data.length - 1));
      setHoveredIndex(Math.max(0, Math.min(data.length - 1, index)));
    },
    [data.length],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  if (data.length < 2) return null;

  const paddingTop = strokeWidth + 2;
  let min = Math.min(...data);
  let max = Math.max(...data);

  if (min === max) {
    min -= 1;
    max += 1;
  }

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y =
      paddingTop + ((max - value) / (max - min)) * (height - paddingTop);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  const gradientId = `sparkline-gradient-${id}`;

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;
  const hoveredValue = hoveredIndex !== null ? data[hoveredIndex] : null;
  const hoveredLabel =
    hoveredIndex !== null && labels ? labels[hoveredIndex] : null;

  // Compute tooltip pixel position for positioning in the container
  const tooltipLeftPercent =
    hoveredIndex !== null ? (hoveredIndex / (data.length - 1)) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={className ?? "w-full h-full relative"}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
        overflow="visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.15} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {hovered && (
          <>
            <line
              x1={hovered.x}
              y1={0}
              x2={hovered.x}
              y2={height}
              stroke="var(--muted)"
              strokeWidth={1}
              strokeDasharray="3,3"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={4}
              fill={strokeColor}
              stroke="var(--surface)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      {hoveredValue !== null && (
        <div
          className="absolute bottom-full mb-2 pointer-events-none"
          style={{
            left: `${tooltipLeftPercent}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-foreground text-background text-xs font-medium rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
            {hoveredLabel && (
              <div className="text-background/60">{hoveredLabel}</div>
            )}
            <div>{formatValue(hoveredValue)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
