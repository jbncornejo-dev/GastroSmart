"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/offline/db";
import { executeOfflineFirstWaste } from "@/lib/offline/sync-engine";
import {
  CategoryTag,
  NeutralCard,
  PeachCard,
  PillButton,
} from "@/components/ui";
import {
  WASTE_REASON_LABELS,
  type WasteReasonCode,
} from "@/lib/seed-data";
import { formatBs, formatQuantity, roundBs, roundQty } from "@/lib/utils/currency";

const REASON_OPTIONS: Array<{
  code: WasteReasonCode;
  label: string;
  hint: string;
}> = [
  {
    code: "EXPIRATION",
    label: "Caducidad / Vencimiento",
    hint: "Producto pasado de maduración",
  },
  {
    code: "COLD_SPOILAGE",
    label: "Deterioro en Frío",
    hint: "Falla de conservación o humedad",
  },
  {
    code: "PREP_ERROR",
    label: "Error de Cocción / Corte",
    hint: "Quemado, sobrecocido o merma alta",
  },
  {
    code: "PORTION_ERROR",
    label: "Porciones mal calculadas",
    hint: "Exceso en emplatado o sobrante",
  },
  {
    code: "THEFT_LOSS",
    label: "Robo o pérdida",
    hint: "Faltante no justificado en turno",
  },
];

export default function MermasPage() {
  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const wastes =
    useLiveQuery(
      () => offlineDb.wastes.orderBy("createdAt").reverse().toArray(),
      [],
      []
    ) ?? [];

  const [selectedIngredientId, setSelectedIngredientId] =
    useState<string>("ing-tomate");
  const [quantityText, setQuantityText] = useState<string>("0.5");
  const [reason, setReason] = useState<WasteReasonCode>("EXPIRATION");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));
  const activeIngredient =
    ingredientMap.get(selectedIngredientId) ?? ingredients[0];

  const qtyValue = Math.max(0, parseFloat(quantityText) || 0);
  const estimatedLossBs = activeIngredient
    ? roundBs(qtyValue * activeIngredient.unitCostBs)
    : 0;

  const totalDayWasteBs = wastes.reduce(
    (sum, w) => sum + w.monetaryLossBs,
    0
  );

  function addQuickAmount(delta: number) {
    const next = roundQty(qtyValue + delta);
    setQuantityText(String(next));
  }

  async function handleConfirmWaste(e: React.FormEvent) {
    e.preventDefault();
    if (!activeIngredient || qtyValue <= 0 || submitting) return;

    setSubmitting(true);
    try {
      const res = await executeOfflineFirstWaste({
        ingredientId: activeIngredient.id,
        quantityLost: qtyValue,
        reason,
        notes: notes.trim(),
      });
      setConfirmation(
        `Merma registrada: -${formatQuantity(qtyValue, activeIngredient.unit)} de ${activeIngredient.name} (${formatBs(res.monetaryLossBs)})`
      );
      setNotes("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <CategoryTag>Módulo 4 · Registro táctil en menos de 10 segundos</CategoryTag>
        <h1 className="heading-md text-[#17191c] mt-1">
          Registro y cálculo de mermas
        </h1>
        <p className="text-[16px] text-[#777b86] mt-1">
          Anota cualquier pérdida en dos pasos para ver su impacto real en
          Bolivianos y descontar del stock al instante.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Formulario rapido (<10 segundos) */}
        <form
          onSubmit={handleConfirmWaste}
          className="lg:col-span-7 space-y-6"
        >
          {/* Paso 1 */}
          <NeutralCard className="p-6 md:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <CategoryTag>Paso 1 · Insumo y cantidad</CategoryTag>
              {activeIngredient && (
                <span className="text-[14px] text-[#777b86] tabular-nums">
                  Costo: {formatBs(activeIngredient.unitCostBs)} /{" "}
                  {activeIngredient.unit}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[14px] text-[#777b86] mb-1.5">
                Selecciona el insumo afectado
              </label>
              <select
                value={activeIngredient?.id ?? ""}
                onChange={(e) => setSelectedIngredientId(e.target.value)}
                className="w-full h-12 px-4 rounded-[16px] bg-[#ffffff] text-[#17191c] text-[15px] border border-[#17191c]/12 focus:outline-none focus:border-[#17191c]"
              >
                {ingredients.map((ing) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.name} — {formatBs(ing.unitCostBs)}/{ing.unit} (Stock:{" "}
                    {formatQuantity(ing.currentStock, ing.unit)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[14px] text-[#777b86] mb-1.5">
                Cantidad perdida ({activeIngredient?.unit ?? "kg"})
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  required
                  value={quantityText}
                  onChange={(e) => setQuantityText(e.target.value)}
                  className="w-36 h-12 px-4 rounded-[16px] bg-[#ffffff] text-[#17191c] text-[18px] font-medium tabular-nums border border-[#17191c]/12 focus:outline-none focus:border-[#17191c]"
                />
                <div className="flex items-center gap-2">
                  {[0.25, 0.5, 1.0].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => addQuickAmount(inc)}
                      className="px-4 py-2.5 rounded-full bg-[#ffffff] border border-[#17191c]/15 text-[14px] font-medium text-[#17191c] hover:bg-[#fafafb] cursor-pointer tabular-nums"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </NeutralCard>

          {/* Paso 2 */}
          <NeutralCard className="p-6 md:p-7 space-y-4">
            <CategoryTag>Paso 2 · Motivo de la merma</CategoryTag>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REASON_OPTIONS.map((opt) => {
                const selected = reason === opt.code;
                return (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setReason(opt.code)}
                    className={`text-left p-4 rounded-[16px] border transition-colors cursor-pointer ${
                      selected
                        ? "bg-[#17191c] text-[#ffffff] border-[#17191c]"
                        : "bg-[#ffffff] text-[#17191c] border-[#17191c]/10 hover:border-[#17191c]/35"
                    }`}
                  >
                    <div className="text-[15px] font-medium">{opt.label}</div>
                    <div
                      className={`text-[13px] mt-0.5 ${
                        selected ? "text-[#ffffff]/75" : "text-[#777b86]"
                      }`}
                    >
                      {opt.hint}
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Nota breve (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Tomate golpeado en entrega de la mañana"
                className="w-full h-11 px-4 rounded-[16px] bg-[#ffffff] text-[#17191c] placeholder:text-[#a3a6af] text-[14px] border border-[#17191c]/10 focus:outline-none"
              />
            </div>
          </NeutralCard>

          {/* Calculo en vivo y confirmacion */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-[24px] border border-[#f2f2f3] bg-[#ffffff]">
            <div>
              <span className="text-[13px] text-[#777b86] block">
                Pérdida monetaria calculada al instante
              </span>
              <span className="text-[30px] font-medium text-[#17191c] tabular-nums">
                {formatBs(estimatedLossBs)}
              </span>
            </div>

            <PillButton
              type="submit"
              variant="filled"
              size="lg"
              disabled={submitting || qtyValue <= 0}
            >
              {submitting
                ? "Registrando..."
                : "Confirmar merma y restar stock"}
            </PillButton>
          </div>

          {confirmation && (
            <p className="text-[14px] text-[#17191c] font-medium px-2">
              {confirmation}
            </p>
          )}
        </form>

        {/* Panel lateral con total acumulado y listado del turno */}
        <aside className="lg:col-span-5 space-y-5">
          {/* Unica PeachCard de la vista */}
          <PeachCard className="p-6">
            <p className="text-[14px] text-[#5d2a1a]/80">
              Total acumulado del turno
            </p>
            <div className="font-serif-editorial text-[38px] text-[#5d2a1a] mt-1 tabular-nums">
              {formatBs(totalDayWasteBs)}
            </div>
            <p className="text-[14px] text-[#5d2a1a]/80 mt-2">
              {wastes.length} registros cuantificados. Cada boliviano evitado
              va directo a utilidad neta.
            </p>
          </PeachCard>

          <div className="border border-[#f2f2f3] rounded-[24px] p-6 bg-[#ffffff]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-medium text-[#17191c]">
                Historial de mermas del turno
              </h2>
              <span className="text-[13px] text-[#979799] tabular-nums">
                {wastes.length}
              </span>
            </div>

            <div className="divide-y divide-[#f2f2f3]">
              {wastes.map((w) => {
                const ing = ingredientMap.get(w.ingredientId);
                return (
                  <div key={w.id} className="py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[15px] font-medium text-[#17191c]">
                          {ing?.name ?? "Insumo"}
                        </div>
                        <div className="text-[13px] text-[#777b86]">
                          {WASTE_REASON_LABELS[w.reason]} · -
                          {formatQuantity(w.quantityLost, ing?.unit ?? "kg")}
                        </div>
                        {w.notes && (
                          <div className="text-[12px] text-[#979799] mt-0.5">
                            {w.notes}
                          </div>
                        )}
                      </div>
                      <span className="text-[15px] font-medium text-[#17191c] tabular-nums shrink-0">
                        {formatBs(w.monetaryLossBs)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
