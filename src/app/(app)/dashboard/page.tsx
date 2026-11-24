"use client";

import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/offline/db";
import { useOfflineSync } from "@/lib/offline/use-offline-sync";
import {
  CategoryTag,
  NeutralCard,
  PeachCard,
  PillButton,
  StockProgressBar,
  StockStatusIndicator,
  TextArrowLink,
  getStockStatus,
} from "@/components/ui";
import { formatBs, formatQuantity } from "@/lib/utils/currency";

export default function DashboardPage() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const suppliers =
    useLiveQuery(() => offlineDb.suppliers.toArray(), [], []) ?? [];
  const wastes =
    useLiveQuery(() => offlineDb.wastes.toArray(), [], []) ?? [];
  const sales =
    useLiveQuery(() => offlineDb.sales.toArray(), [], []) ?? [];

  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const criticalItems = ingredients.filter(
    (i) => getStockStatus(i.currentStock, i.minStock) === "CRITICAL"
  );
  const lowItems = ingredients.filter(
    (i) => getStockStatus(i.currentStock, i.minStock) === "LOW"
  );
  const thresholdItems = [...criticalItems, ...lowItems];

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayWasteBs = wastes
    .filter((w) => w.createdAt.slice(0, 10) === todayStr)
    .reduce((acc, w) => acc + w.monetaryLossBs, 0);
  const displayWasteBs =
    todayWasteBs > 0
      ? todayWasteBs
      : wastes.reduce((acc, w) => acc + w.monetaryLossBs, 0);

  const todaySalesCount = sales.reduce((acc, s) => acc + s.quantitySold, 0);

  // Agrupacion de insumos listos para pedir por proveedor
  const supplierGroups = new Map<
    string,
    { supplierName: string; itemCount: number; estimatedBs: number }
  >();
  for (const ing of thresholdItems) {
    const supplierId = ing.defaultSupplierId || "unassigned";
    const sup = supplierMap.get(supplierId);
    const qtyToOrder = Math.max(0.5, ing.optimalStock - ing.currentStock);
    const prev = supplierGroups.get(supplierId) ?? {
      supplierName: sup?.name ?? "Proveedor asignado",
      itemCount: 0,
      estimatedBs: 0,
    };
    prev.itemCount += 1;
    prev.estimatedBs += qtyToOrder * ing.unitCostBs;
    supplierGroups.set(supplierId, prev);
  }

  return (
    <div className="space-y-10">
      {/* Cabecera editorial */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <CategoryTag>Módulo 1 · Control rápido del turno</CategoryTag>
          <h1 className="heading-md text-[#17191c] mt-1">
            Panorama operativo de cocina
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            {todaySalesCount} platos registrados hoy · Visibilidad inmediata de
            stock crítico, mermas y reposición.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PillButton href="/recetas" variant="filled">
            + Marcar plato vendido
          </PillButton>
          <PillButton href="/mermas" variant="ghost">
            Anotar merma
          </PillButton>
        </div>
      </div>

      {/* Fila superior de 4 metricas limpias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <NeutralCard className="p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Insumos en estado crítico</CategoryTag>
            <div className="text-[32px] font-medium text-[#17191c] mt-2 tabular-nums">
              {criticalItems.length}
            </div>
            <p className="text-[14px] text-[#777b86] mt-1">
              Debajo del stock mínimo operativo
            </p>
          </div>
          <div className="mt-5">
            <TextArrowLink href="/compras">Generar pedido</TextArrowLink>
          </div>
        </NeutralCard>

        <NeutralCard className="p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Próximos a agotarse</CategoryTag>
            <div className="text-[32px] font-medium text-[#17191c] mt-2 tabular-nums">
              {lowItems.length}
            </div>
            <p className="text-[14px] text-[#777b86] mt-1">
              Margen reducido antes del quiebre
            </p>
          </div>
          <div className="mt-5">
            <TextArrowLink href="/inventario">Revisar stock</TextArrowLink>
          </div>
        </NeutralCard>

        <NeutralCard className="p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Merma acumulada del día</CategoryTag>
            <div className="text-[32px] font-medium text-[#17191c] mt-2 tabular-nums">
              {formatBs(displayWasteBs)}
            </div>
            <p className="text-[14px] text-[#777b86] mt-1">
              Pérdida cuantificada en Bolivianos
            </p>
          </div>
          <div className="mt-5">
            <TextArrowLink href="/mermas">Anotar merma</TextArrowLink>
          </div>
        </NeutralCard>

        <NeutralCard className="p-6 flex flex-col justify-between">
          <div>
            <CategoryTag>Estado de operación</CategoryTag>
            <div className="text-[20px] font-medium text-[#17191c] mt-3">
              {isOnline ? "Sincronizado en la nube" : "Modo local activo"}
            </div>
            <p className="text-[14px] text-[#777b86] mt-1 tabular-nums">
              {pendingCount > 0
                ? `${pendingCount} cambios pendientes en cola`
                : "Sin cambios pendientes"}
            </p>
          </div>
          <div className="mt-5">
            <PillButton
              variant="ghost"
              size="sm"
              onClick={() => void syncNow()}
              disabled={!isOnline || isSyncing}
            >
              {isSyncing ? "Sincronizando..." : "Sincronizar nube"}
            </PillButton>
          </div>
        </NeutralCard>
      </div>

      {/* Callout principal: Unica Accent Peach Card de la vista */}
      <PeachCard className="p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-[14px] text-[#5d2a1a]/80">
            Resumen listo para reposición por WhatsApp
          </p>
          <h2 className="font-serif-editorial text-[26px] md:text-[30px] text-[#5d2a1a] mt-1 leading-[1.3]">
            {thresholdItems.length > 0
              ? `${thresholdItems.length} insumos listos para pedir en ${supplierGroups.size} proveedores`
              : "Todo tu inventario está por encima del mínimo operativo"}
          </h2>
          {supplierGroups.size > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-[#5d2a1a]/85 tabular-nums">
              {Array.from(supplierGroups.entries()).map(([supplierId, g]) => (
                <span key={supplierId}>
                  {g.supplierName} ({g.itemCount} · est. {formatBs(g.estimatedBs)})
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0">
          <PillButton href="/compras" variant="filled" size="lg">
            Abrir despachador de WhatsApp
          </PillButton>
        </div>
      </PeachCard>

      {/* Lista de Insumos en Umbral Minimo */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <CategoryTag>Reposición prioritaria</CategoryTag>
            <h2 className="text-[22px] font-medium text-[#17191c] mt-0.5">
              Insumos en umbral mínimo
            </h2>
          </div>
          <TextArrowLink href="/inventario">Ver todos los insumos</TextArrowLink>
        </div>

        <div className="border border-[#f2f2f3] rounded-[24px] overflow-hidden bg-[#ffffff]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#f2f2f3] text-[13px] text-[#979799] font-normal">
                  <th className="py-3.5 px-5 font-normal">Insumo</th>
                  <th className="py-3.5 px-5 font-normal">Estado</th>
                  <th className="py-3.5 px-5 font-normal">Stock actual vs mínimo</th>
                  <th className="py-3.5 px-5 font-normal">Proveedor asignado</th>
                  <th className="py-3.5 px-5 font-normal text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f3] text-[15px]">
                {thresholdItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 px-5 text-center text-[#777b86]"
                    >
                      Sin alertas de reposición en este momento.
                    </td>
                  </tr>
                ) : (
                  thresholdItems.map((ing) => {
                    const status = getStockStatus(ing.currentStock, ing.minStock);
                    const sup = supplierMap.get(ing.defaultSupplierId);
                    return (
                      <tr
                        key={ing.id}
                        className="hover:bg-[#fafafb] transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="font-medium text-[#17191c]">
                            {ing.name}
                          </div>
                          <div className="text-[13px] text-[#979799]">
                            {ing.location} · {formatBs(ing.unitCostBs)}/{ing.unit}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <StockStatusIndicator status={status} />
                        </td>
                        <td className="py-4 px-5 min-w-[200px]">
                          <div className="flex items-center justify-between text-[13px] text-[#777b86] mb-1.5 tabular-nums">
                            <span>
                              {formatQuantity(ing.currentStock, ing.unit)}
                            </span>
                            <span>
                              mín. {formatQuantity(ing.minStock, ing.unit)}
                            </span>
                          </div>
                          <StockProgressBar
                            currentStock={ing.currentStock}
                            minStock={ing.minStock}
                            optimalStock={ing.optimalStock}
                          />
                        </td>
                        <td className="py-4 px-5 text-[14px] text-[#777b86]">
                          {sup?.name ?? "Sin proveedor"}
                        </td>
                        <td className="py-4 px-5 text-right">
                          <TextArrowLink href="/compras">
                            Preparar pedido
                          </TextArrowLink>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
