import React from "react";

export type StockLevelStatus = "CRITICAL" | "LOW" | "OPTIMAL";

export function getStockStatus(
  currentStock: number,
  minStock: number
): StockLevelStatus {
  if (currentStock <= minStock) return "CRITICAL";
  if (currentStock <= minStock * 1.45) return "LOW";
  return "OPTIMAL";
}

export function getStockStatusLabel(status: StockLevelStatus): string {
  if (status === "CRITICAL") return "Crítico";
  if (status === "LOW") return "Por agotarse";
  return "Óptimo";
}

/**
 * Indicador tipografico acromatico con punto discreto de 6px.
 * No usa badges coloridos saturados.
 */
export function StockStatusIndicator({
  status,
  className = "",
}: {
  status: StockLevelStatus;
  className?: string;
}) {
  const label = getStockStatusLabel(status);
  const isOptimal = status === "OPTIMAL";

  return (
    <span
      className={`inline-flex items-center gap-2 text-[14px] ${
        status === "CRITICAL"
          ? "text-[#17191c] font-medium"
          : status === "LOW"
            ? "text-[#17191c] font-normal"
            : "text-[#777b86] font-normal"
      } ${className}`}
    >
      <span
        className={`w-[6px] h-[6px] rounded-full shrink-0 ${
          isOptimal
            ? "bg-[#17191c]/40"
            : status === "LOW"
              ? "bg-[#5d2a1a]/70"
              : "bg-[#5d2a1a]"
        }`}
      />
      <span>{label}</span>
    </span>
  );
}

/**
 * Barra de progreso delgada: #17191c (optimo) o #5d2a1a sobre pista #fbe1d1 (critico/bajo).
 */
export function StockProgressBar({
  currentStock,
  minStock,
  optimalStock,
}: {
  currentStock: number;
  minStock: number;
  optimalStock: number;
}) {
  const status = getStockStatus(currentStock, minStock);
  const denom = optimalStock > 0 ? optimalStock : Math.max(minStock * 2, 1);
  const pct = Math.max(4, Math.min(100, (currentStock / denom) * 100));
  const isAlert = status === "CRITICAL" || status === "LOW";

  return (
    <div
      className={`w-full h-[5px] rounded-full overflow-hidden ${
        isAlert ? "bg-[#fbe1d1]" : "bg-[#f2f2f3]"
      }`}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${
          isAlert ? "bg-[#5d2a1a]" : "bg-[#17191c]"
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
