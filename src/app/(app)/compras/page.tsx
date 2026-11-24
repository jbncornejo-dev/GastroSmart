"use client";

import React, { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, Copy, ExternalLink, Minus, Plus } from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import { executeOfflineFirstPurchaseOrder } from "@/lib/offline/sync-engine";
import {
  CategoryTag,
  NeutralCard,
  PeachCard,
  PillButton,
  getStockStatus,
} from "@/components/ui";
import {
  buildWhatsAppUrl,
  formatWhatsAppOrderMessage,
  type WhatsAppOrderItem,
} from "@/lib/services/whatsapp-formatter";
import { formatBs, formatQuantity, roundBs, roundQty } from "@/lib/utils/currency";

interface DemandSuggestionResponse {
  weeklyHeadline: string;
  weeklyContextNote: string;
  suggestions: Array<{
    ingredientId: string;
    adjustedRecommendedQty: number;
    operationalSummary: string;
    demandLevel: "ESTABLE" | "ALTA";
  }>;
}

export default function ComprasPage() {
  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const suppliers =
    useLiveQuery(() => offlineDb.suppliers.toArray(), [], []) ?? [];
  const restaurant = useLiveQuery(() =>
    offlineDb.restaurant.toArray().then((r) => r[0])
  );
  const purchaseOrders =
    useLiveQuery(
      () => offlineDb.purchaseOrders.orderBy("createdAt").reverse().toArray(),
      [],
      []
    ) ?? [];

  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>(
    {}
  );
  const [demandSignals, setDemandSignals] =
    useState<DemandSuggestionResponse | null>(null);
  const [copiedSupplierId, setCopiedSupplierId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/recommendations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DemandSuggestionResponse | null) => {
        if (active && data) setDemandSignals(data);
      })
      .catch(() => {
        // En modo offline se usa el cálculo local determinístico (optimal - current)
      });
    return () => {
      active = false;
    };
  }, [ingredients.length]);

  const signalMap = new Map(
    (demandSignals?.suggestions ?? []).map((s) => [s.ingredientId, s])
  );

  // Detectar insumos criticos o proximos al minimo
  const lowIngredients = ingredients.filter((ing) => {
    const st = getStockStatus(ing.currentStock, ing.minStock);
    return st === "CRITICAL" || st === "LOW";
  });

  // Agrupar automaticamente por proveedor
  const groupsBySupplier = new Map<
    string,
    {
      supplier: (typeof suppliers)[number];
      items: WhatsAppOrderItem[];
      estimatedTotalBs: number;
    }
  >();

  for (const ing of lowIngredients) {
    const supplier = suppliers.find((s) => s.id === ing.defaultSupplierId);
    if (!supplier) continue;

    const signal = signalMap.get(ing.id);
    const defaultQty =
      signal?.adjustedRecommendedQty ??
      Math.max(1, roundQty(ing.optimalStock - ing.currentStock));
    const finalQty = manualOverrides[ing.id] ?? defaultQty;
    const subtotalBs = roundBs(finalQty * ing.unitCostBs);

    const group = groupsBySupplier.get(supplier.id) ?? {
      supplier,
      items: [],
      estimatedTotalBs: 0,
    };

    group.items.push({
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      quantity: finalQty,
      unitCostBs: ing.unitCostBs,
      subtotalBs,
    });
    group.estimatedTotalBs = roundBs(group.estimatedTotalBs + subtotalBs);
    groupsBySupplier.set(supplier.id, group);
  }

  const restaurantName = restaurant?.name ?? "El Solar Cochabambino";

  function adjustQty(ingredientId: string, currentQty: number, delta: number) {
    const next = Math.max(0.5, roundQty(currentQty + delta));
    setManualOverrides((prev) => ({ ...prev, [ingredientId]: next }));
  }

  async function handleCopyMessage(supplierId: string, message: string) {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedSupplierId(supplierId);
      setTimeout(() => setCopiedSupplierId(null), 2200);
    } catch {
      setStatusFeedback("No se pudo copiar automáticamente al portapapeles.");
    }
  }

  async function handleOpenWhatsApp(group: {
    supplier: (typeof suppliers)[number];
    items: WhatsAppOrderItem[];
    estimatedTotalBs: number;
  }, message: string) {
    const orderId = `po-${group.supplier.id}-${new Date().toISOString().slice(0, 10)}`;
    await executeOfflineFirstPurchaseOrder({
      id: orderId,
      supplierId: group.supplier.id,
      status: "SENT_WHATSAPP",
      whatsappMessage: message,
      estimatedTotalBs: group.estimatedTotalBs,
      items: group.items,
    });

    const url = buildWhatsAppUrl(group.supplier.whatsappPhone, message);
    window.open(url, "_blank", "noopener,noreferrer");
    setStatusFeedback(`Orden marcada como Enviada a ${group.supplier.name}.`);
  }

  async function handleMarkReceived(group: {
    supplier: (typeof suppliers)[number];
    items: WhatsAppOrderItem[];
    estimatedTotalBs: number;
  }, message: string) {
    const orderId = `po-${group.supplier.id}-${Date.now()}`;
    await executeOfflineFirstPurchaseOrder({
      id: orderId,
      supplierId: group.supplier.id,
      status: "RECEIVED",
      whatsappMessage: message,
      estimatedTotalBs: group.estimatedTotalBs,
      items: group.items,
    });
    setStatusFeedback(
      `Recepción confirmada: las cantidades de ${group.supplier.name} ya se sumaron al inventario.`
    );
  }

  const groupedList = Array.from(groupsBySupplier.values());
  const grandTotalBs = groupedList.reduce(
    (sum, g) => sum + g.estimatedTotalBs,
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <CategoryTag>Módulo 5 · Automatización de compras por WhatsApp</CategoryTag>
        <h1 className="heading-md text-[#17191c] mt-1">
          Despachador de órdenes por proveedor
        </h1>
        <p className="text-[16px] text-[#777b86] mt-1">
          {demandSignals?.weeklyContextNote ??
            "Agrupación automática de insumos debajo del mínimo con cantidades sugeridas para cubrir el stock óptimo."}
        </p>
      </div>

      {/* Unica PeachCard de la vista */}
      <PeachCard className="p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[14px] text-[#5d2a1a]/80">
            {demandSignals?.weeklyHeadline ??
              "Reposición sugerida para esta semana"}
          </p>
          <p className="font-serif-editorial text-[26px] text-[#5d2a1a] mt-1">
            {groupedList.length > 0
              ? `${groupedList.length} órdenes listas para enviar · Total estimado ${formatBs(grandTotalBs)}`
              : "Todos tus insumos están abastecidos sobre el umbral mínimo."}
          </p>
          {statusFeedback && (
            <p className="text-[14px] text-[#5d2a1a] font-medium mt-2">
              {statusFeedback}
            </p>
          )}
        </div>
      </PeachCard>

      {groupedList.length === 0 ? (
        <NeutralCard className="p-8 text-center">
          <p className="text-[16px] text-[#777b86]">
            No hay insumos críticos o próximos a agotarse pendientes de pedido.
          </p>
        </NeutralCard>
      ) : (
        <div className="space-y-6">
          {groupedList.map((group) => {
            const message = formatWhatsAppOrderMessage({
              supplierName: group.supplier.name,
              restaurantName,
              items: group.items,
              estimatedTotalBs: group.estimatedTotalBs,
            });
            const isCopied = copiedSupplierId === group.supplier.id;

            return (
              <div
                key={group.supplier.id}
                className="border border-[#f2f2f3] rounded-[24px] p-6 md:p-7 bg-[#ffffff] grid grid-cols-1 lg:grid-cols-12 gap-6"
              >
                {/* Lista de items ajustables */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CategoryTag>{group.supplier.category}</CategoryTag>
                      <h2 className="text-[20px] font-medium text-[#17191c] mt-0.5">
                        {group.supplier.name}
                      </h2>
                      <p className="text-[13px] text-[#777b86] mt-0.5">
                        WhatsApp: {group.supplier.whatsappPhone}
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="text-[12px] text-[#979799] block">
                        Total estimado
                      </span>
                      <span className="text-[20px] font-medium text-[#17191c]">
                        {formatBs(group.estimatedTotalBs)}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-[#f2f2f3]">
                    {group.items.map((item) => {
                      const signal = signalMap.get(item.ingredientId);
                      return (
                        <div
                          key={item.ingredientId}
                          className="py-3.5 flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-[15px] font-medium text-[#17191c]">
                              {item.ingredientName}
                            </div>
                            <div className="text-[13px] text-[#777b86] tabular-nums">
                              {formatBs(item.unitCostBs)}/{item.unit} · Subtotal{" "}
                              {formatBs(item.subtotalBs)}
                              {signal && (
                                <span className="ml-2 text-[#979799]">
                                  · {signal.operationalSummary}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="inline-flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                adjustQty(item.ingredientId, item.quantity, -1)
                              }
                              aria-label="Restar cantidad"
                              className="w-8 h-8 rounded-full border border-[#17191c]/15 flex items-center justify-center hover:bg-[#fafafb] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                            <span className="min-w-[68px] text-center text-[15px] font-medium tabular-nums">
                              {formatQuantity(item.quantity, item.unit)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                adjustQty(item.ingredientId, item.quantity, 1)
                              }
                              aria-label="Sumar cantidad"
                              className="w-8 h-8 rounded-full border border-[#17191c]/15 flex items-center justify-center hover:bg-[#fafafb] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Vista previa del mensaje preformateado */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div>
                    <CategoryTag>Vista previa de mensaje WhatsApp</CategoryTag>
                    <pre className="mt-2 p-5 rounded-[16px] bg-[#f2f2f3] text-[14px] leading-[1.6] text-[#17191c] whitespace-pre-wrap font-sans">
                      {message}
                    </pre>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-5">
                    <PillButton
                      variant="filled"
                      onClick={() => void handleOpenWhatsApp(group, message)}
                    >
                      <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                      Abrir en WhatsApp
                    </PillButton>
                    <PillButton
                      variant="ghost"
                      onClick={() =>
                        void handleCopyMessage(group.supplier.id, message)
                      }
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4" strokeWidth={1.5} />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" strokeWidth={1.5} />
                          Copiar pedido
                        </>
                      )}
                    </PillButton>
                    <PillButton
                      variant="ghost"
                      onClick={() => void handleMarkReceived(group, message)}
                    >
                      Marcar como recibida
                    </PillButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historial de ordenes enviadas/recibidas */}
      {purchaseOrders.length > 0 && (
        <section className="space-y-3">
          <CategoryTag>Seguimiento reciente de pedidos</CategoryTag>
          <div className="border border-[#f2f2f3] rounded-[24px] overflow-hidden">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#f2f2f3] text-[13px] text-[#979799]">
                  <th className="py-3 px-5 font-normal">Proveedor</th>
                  <th className="py-3 px-5 font-normal">Estado</th>
                  <th className="py-3 px-5 font-normal">Total estimado</th>
                  <th className="py-3 px-5 font-normal text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f3]">
                {purchaseOrders.map((po) => {
                  const sup = suppliers.find((s) => s.id === po.supplierId);
                  return (
                    <tr key={po.id} className="hover:bg-[#fafafb]">
                      <td className="py-3 px-5 font-medium text-[#17191c]">
                        {sup?.name ?? po.supplierId}
                      </td>
                      <td className="py-3 px-5 text-[#777b86]">
                        {po.status === "RECEIVED"
                          ? "Recibida (stock sumado)"
                          : po.status === "SENT_WHATSAPP"
                            ? "Enviada por WhatsApp"
                            : "Borrador local"}
                      </td>
                      <td className="py-3 px-5 tabular-nums">
                        {formatBs(po.estimatedTotalBs)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#979799] tabular-nums">
                        {new Date(po.createdAt).toLocaleString("es-BO", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
