"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download } from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import {
  CategoryTag,
  MinimalChart,
  PeachCard,
  PillButton,
  TextArrowLink,
} from "@/components/ui";
import { WASTE_REASON_LABELS, type WasteReasonCode } from "@/lib/seed-data";
import { formatBs } from "@/lib/utils/currency";

export default function ReportesPage() {
  const sales =
    useLiveQuery(() => offlineDb.sales.toArray(), [], []) ?? [];
  const wastes =
    useLiveQuery(() => offlineDb.wastes.toArray(), [], []) ?? [];
  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const restaurant = useLiveQuery(() =>
    offlineDb.restaurant.toArray().then((r) => r[0])
  );

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalRevenueBs, 0);
  const totalIngredientCost = sales.reduce(
    (sum, s) => sum + s.totalIngredientCostBs,
    0
  );
  const costRatioPct =
    totalRevenue > 0 ? (totalIngredientCost / totalRevenue) * 100 : 29.4;

  const totalWasteBs = wastes.reduce((sum, w) => sum + w.monetaryLossBs, 0);

  // Desglose por causa principal
  const reasonTotals = new Map<WasteReasonCode, number>();
  for (const w of wastes) {
    reasonTotals.set(
      w.reason,
      (reasonTotals.get(w.reason) ?? 0) + w.monetaryLossBs
    );
  }
  const topReasonEntry = Array.from(reasonTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const monthlyProjectedWaste = totalWasteBs * 4;
  const estimatedMonthlySavings = Math.max(420, monthlyProjectedWaste * 2.4);

  const inventoryValuation = ingredients.reduce(
    (sum, i) => sum + i.currentStock * i.unitCostBs,
    0
  );

  function exportCsv() {
    const header = [
      "Insumo",
      "Categoría",
      "Ubicación",
      "Stock Actual",
      "Unidad",
      "Costo Unitario (Bs)",
      "Valor en Stock (Bs)",
      "Régimen",
    ].join(",");

    const regime = restaurant?.taxRegime ?? "GENERAL";
    const rows = ingredients.map((ing) =>
      [
        `"${ing.name}"`,
        `"${ing.category}"`,
        `"${ing.location}"`,
        ing.currentStock.toFixed(2),
        ing.unit,
        ing.unitCostBs.toFixed(2),
        (ing.currentStock * ing.unitCostBs).toFixed(2),
        regime,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gastrosmart-resumen-costos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <CategoryTag>Módulo 6 · Reportes gerenciales y costos</CategoryTag>
          <h1 className="heading-md text-[#17191c] mt-1">
            Rentabilidad, mermas y evolución de insumos
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Indicadores operativos listos para control interno y respaldo bajo
            Régimen General o RTS en Bolivia.
          </p>
        </div>

        <PillButton variant="filled" onClick={exportCsv}>
          <Download className="w-4 h-4" strokeWidth={1.5} />
          Exportar resumen CSV
        </PillButton>
      </div>

      {/* 3 Tarjetas principales con graficas gesturales minimalistas (#5d2a1a sin ejes ni rejillas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#ffffff] border border-[#f2f2f3] rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Costo de insumos (% sobre ventas)</CategoryTag>
            <div className="text-[28px] font-medium text-[#17191c] mt-2 tabular-nums">
              {costRatioPct.toFixed(1)}%
            </div>
            <div className="text-[14px] text-[#777b86] mt-1 mb-5">
              Meta operativa: debajo del 32.0%
            </div>
          </div>
          <MinimalChart data={[34.2, 33.1, 31.8, 30.9, 30.2, costRatioPct]} />
        </div>

        <div className="bg-[#ffffff] border border-[#f2f2f3] rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Ahorro / Merma mensual en Bs</CategoryTag>
            <div className="text-[28px] font-medium text-[#17191c] mt-2 tabular-nums">
              {formatBs(totalWasteBs)}
            </div>
            <div className="text-[14px] text-[#777b86] mt-1 mb-5">
              {topReasonEntry
                ? `Causa principal: ${WASTE_REASON_LABELS[topReasonEntry[0]]}`
                : "Sin mermas registradas"}
            </div>
          </div>
          <MinimalChart data={[115, 98, 86, 74, 58, Math.max(20, totalWasteBs)]} />
        </div>

        <div className="bg-[#ffffff] border border-[#f2f2f3] rounded-[24px] p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Estado de suscripción local</CategoryTag>
            <div className="text-[24px] font-medium text-[#17191c] mt-2">
              Plan {restaurant?.plan ?? "PRO"} ·{" "}
              {restaurant?.subscriptionStatus === "ACTIVE_DEMO"
                ? "Activa (Demo)"
                : "Prueba 30 días"}
            </div>
            <div className="text-[14px] text-[#777b86] mt-1 mb-5">
              Régimen: {restaurant?.taxRegime ?? "GENERAL"} · Zona{" "}
              {restaurant?.zone ?? "Centro"}
            </div>
          </div>
          <TextArrowLink href="/suscripcion">
            Gestionar plan y QR demo
          </TextArrowLink>
        </div>
      </div>

      {/* Unica PeachCard de la vista */}
      <PeachCard className="p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[14px] text-[#5d2a1a]/80">
            Proyección de ahorro mensual por control de mermas
          </p>
          <p className="font-serif-editorial text-[26px] text-[#5d2a1a] mt-1">
            Ahorro estimado de {formatBs(estimatedMonthlySavings)} al mes · Valor
            actual en inventario: {formatBs(inventoryValuation)}
          </p>
        </div>
      </PeachCard>

      {/* Tabla de evolucion de costos de insumos */}
      <section className="space-y-4">
        <div>
          <CategoryTag>Detalle por insumo</CategoryTag>
          <h2 className="text-[20px] font-medium text-[#17191c] mt-0.5">
            Evolución de costos e inventario valorado
          </h2>
        </div>

        <div className="border border-[#f2f2f3] rounded-[24px] overflow-hidden bg-[#ffffff]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#f2f2f3] text-[13px] text-[#979799]">
                  <th className="py-3.5 px-5 font-normal">Insumo</th>
                  <th className="py-3.5 px-5 font-normal">Categoría</th>
                  <th className="py-3.5 px-5 font-normal">Costo unitario</th>
                  <th className="py-3.5 px-5 font-normal">Stock actual</th>
                  <th className="py-3.5 px-5 font-normal text-right">
                    Valor en almacén
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f3]">
                {ingredients.map((ing) => (
                  <tr key={ing.id} className="hover:bg-[#fafafb]">
                    <td className="py-3.5 px-5 font-medium text-[#17191c]">
                      {ing.name}
                    </td>
                    <td className="py-3.5 px-5 text-[#979799]">
                      {ing.category}
                    </td>
                    <td className="py-3.5 px-5 tabular-nums">
                      {formatBs(ing.unitCostBs)} / {ing.unit}
                    </td>
                    <td className="py-3.5 px-5 tabular-nums text-[#777b86]">
                      {ing.currentStock.toFixed(2)} {ing.unit}
                    </td>
                    <td className="py-3.5 px-5 text-right font-medium tabular-nums">
                      {formatBs(ing.currentStock * ing.unitCostBs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
