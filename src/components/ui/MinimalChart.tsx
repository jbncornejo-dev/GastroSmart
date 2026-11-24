import React from "react";

interface MinimalChartProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  className?: string;
}

/**
 * Grafica gestural minimalista en trazo #5d2a1a sin ejes ni cuadriculas.
 */
export function MinimalChart({
  data,
  width = 220,
  height = 56,
  strokeColor = "#5d2a1a",
  className = "",
}: MinimalChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const padding = 6;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((val, idx) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (idx / (data.length - 1)) * innerW;
    const y = padding + innerH - ((val - min) / range) * innerH;
    return { x, y };
  });

  const polylinePoints = points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`w-full overflow-visible ${className}`}
      role="img"
      aria-label="Tendencia operativa"
    >
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />
      {last && (
        <circle cx={last.x} cy={last.y} r="3" fill={strokeColor} />
      )}
    </svg>
  );
}
