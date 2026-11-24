"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import {
  executeOfflineFirstRecipeCreate,
  executeOfflineFirstSale,
} from "@/lib/offline/sync-engine";
import {
  CategoryTag,
  Modal,
  NeutralCard,
  PeachCard,
  PillButton,
  getStockStatus,
} from "@/components/ui";
import { formatBs, formatQuantity } from "@/lib/utils/currency";

export default function RecetasPage() {
  const recipes =
    useLiveQuery(() => offlineDb.recipes.toArray(), [], []) ?? [];
  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const sales =
    useLiveQuery(
      () => offlineDb.sales.orderBy("createdAt").reverse().limit(12).toArray(),
      [],
      []
    ) ?? [];

  const [lastSoldMessage, setLastSoldMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Platos Fuertes");
  const [newPrice, setNewPrice] = useState("45");
  const [newItems, setNewItems] = useState<
    Array<{ ingredientId: string; quantityRequired: string }>
  >([{ ingredientId: "ing-carne", quantityRequired: "0.25" }]);

  const ingredientMap = new Map(ingredients.map((i) => [i.id, i]));
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const criticalAfterOps = ingredients.filter(
    (i) => getStockStatus(i.currentStock, i.minStock) === "CRITICAL"
  );

  async function handleSellPlate(recipeId: string, recipeName: string) {
    await executeOfflineFirstSale({
      recipeId,
      quantitySold: 1,
      source: "MANUAL_POS",
    });
    setLastSoldMessage(
      `Plato descontado del inventario: 1 × ${recipeName}`
    );
  }

  function addRecipeLine() {
    const firstAvailable = ingredients[0]?.id ?? "ing-tomate";
    setNewItems((prev) => [
      ...prev,
      { ingredientId: firstAvailable, quantityRequired: "0.15" },
    ]);
  }

  async function handleCreateRecipe(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || newItems.length === 0) return;

    await executeOfflineFirstRecipeCreate({
      name: newName.trim(),
      category: newCategory.trim() || "Tradicional",
      salePriceBs: Math.max(1, parseFloat(newPrice) || 35),
      ingredients: newItems.map((line) => ({
        ingredientId: line.ingredientId,
        quantityRequired: Math.max(0.01, parseFloat(line.quantityRequired) || 0.1),
      })),
    });

    setModalOpen(false);
    setNewName("");
    setNewPrice("45");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <CategoryTag>Módulo 3 · Recetas estándar y simulador POS</CategoryTag>
          <h1 className="heading-md text-[#17191c] mt-1">
            Fichas técnicas y descuento automático
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Cada plato vendido descuenta gramos y mililitros al instante, incluso
            sin conexión a internet.
          </p>
        </div>

        <PillButton variant="filled" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nueva receta estándar
        </PillButton>
      </div>

      {/* Unica PeachCard de la vista si hay alerta o confirmacion */}
      {(lastSoldMessage || criticalAfterOps.length > 0) && (
        <PeachCard className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14px] text-[#5d2a1a]/80">
              {lastSoldMessage ?? "Monitor de stock en vivo"}
            </p>
            <p className="text-[16px] font-medium text-[#5d2a1a] mt-0.5">
              {criticalAfterOps.length > 0
                ? `${criticalAfterOps.length} insumos en umbral crítico tras los descuentos del turno.`
                : "Todos los ingredientes de tus recetas tienen cobertura."}
            </p>
          </div>
          <PillButton href="/compras" variant="filled" size="sm">
            Ver orden de compra
          </PillButton>
        </PeachCard>
      )}

      {/* Grid de tarjetas de fichas tecnicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((rec) => {
          const recipeCost = rec.ingredients.reduce((sum, ri) => {
            const ing = ingredientMap.get(ri.ingredientId);
            return sum + (ing ? ing.unitCostBs * ri.quantityRequired : 0);
          }, 0);
          const marginPct =
            rec.salePriceBs > 0
              ? ((rec.salePriceBs - recipeCost) / rec.salePriceBs) * 100
              : 0;

          return (
            <NeutralCard
              key={rec.id}
              className="p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CategoryTag>{rec.category}</CategoryTag>
                    <h2 className="text-[20px] font-medium text-[#17191c] mt-1">
                      {rec.name}
                    </h2>
                  </div>
                  <span className="text-[18px] font-medium text-[#17191c] tabular-nums shrink-0">
                    {formatBs(rec.salePriceBs)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 py-3 border-y border-[#17191c]/10 text-[14px] tabular-nums">
                  <div>
                    <span className="text-[#777b86] block text-[12px]">
                      Costo de receta
                    </span>
                    <span className="font-medium text-[#17191c]">
                      {formatBs(recipeCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#777b86] block text-[12px]">
                      Margen bruto
                    </span>
                    <span className="font-medium text-[#17191c]">
                      {marginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="text-[12px] text-[#979799]">
                    Descuento por plato:
                  </div>
                  {rec.ingredients.map((ri) => {
                    const ing = ingredientMap.get(ri.ingredientId);
                    if (!ing) return null;
                    return (
                      <div
                        key={ri.id}
                        className="flex items-center justify-between text-[13px] text-[#17191c]"
                      >
                        <span>
                          {formatQuantity(ri.quantityRequired, ing.unit)}{" "}
                          {ing.name}
                        </span>
                        <span className="text-[#777b86] tabular-nums">
                          stock: {formatQuantity(ing.currentStock, ing.unit)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6">
                <PillButton
                  variant="filled"
                  className="w-full"
                  onClick={() => void handleSellPlate(rec.id, rec.name)}
                >
                  + Marcar plato vendido (POS)
                </PillButton>
              </div>
            </NeutralCard>
          );
        })}
      </div>

      {/* Historial de ventas y descuentos del turno */}
      <section className="space-y-4">
        <div>
          <CategoryTag>Trazabilidad automática</CategoryTag>
          <h2 className="text-[20px] font-medium text-[#17191c] mt-0.5">
            Historial de ventas y descuentos del turno
          </h2>
        </div>

        <div className="border border-[#f2f2f3] rounded-[24px] overflow-hidden bg-[#ffffff]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-[#f2f2f3] text-[13px] text-[#979799]">
                  <th className="py-3 px-5 font-normal">Plato</th>
                  <th className="py-3 px-5 font-normal">Cant.</th>
                  <th className="py-3 px-5 font-normal">Origen</th>
                  <th className="py-3 px-5 font-normal">Venta</th>
                  <th className="py-3 px-5 font-normal">Costo insumos</th>
                  <th className="py-3 px-5 font-normal text-right">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f2f3]">
                {sales.map((s) => {
                  const rec = recipeMap.get(s.recipeId);
                  return (
                    <tr key={s.id} className="hover:bg-[#fafafb]">
                      <td className="py-3 px-5 font-medium text-[#17191c]">
                        {rec?.name ?? "Plato"}
                      </td>
                      <td className="py-3 px-5 tabular-nums">
                        {s.quantitySold}
                      </td>
                      <td className="py-3 px-5 text-[#777b86]">
                        {s.source === "MANUAL_POS" ? "POS Manual" : "POS Externo"}
                      </td>
                      <td className="py-3 px-5 tabular-nums">
                        {formatBs(s.totalRevenueBs)}
                      </td>
                      <td className="py-3 px-5 tabular-nums text-[#777b86]">
                        {formatBs(s.totalIngredientCostBs)}
                      </td>
                      <td className="py-3 px-5 text-right text-[#979799] tabular-nums">
                        {new Date(s.createdAt).toLocaleTimeString("es-BO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modal nueva receta estandar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear receta estándar"
        subtitle="Vincula insumos existentes para automatizar el descuento por cada plato vendido."
      >
        <form onSubmit={handleCreateRecipe} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[13px] text-[#777b86] mb-1">
                Nombre del plato
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Chairo Paceño o Charque"
                className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[15px]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Precio venta (Bs)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[15px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] mb-1">
              Categoría
            </label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[15px]"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] text-[#777b86]">
                Ingredientes (en unidad base del insumo)
              </label>
              <button
                type="button"
                onClick={addRecipeLine}
                className="text-[13px] text-[#17191c] hover:underline cursor-pointer"
              >
                + Añadir insumo
              </button>
            </div>

            {newItems.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={line.ingredientId}
                  onChange={(e) => {
                    const copy = [...newItems];
                    copy[idx].ingredientId = e.target.value;
                    setNewItems(copy);
                  }}
                  className="flex-1 h-10 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
                >
                  {ingredients.map((ing) => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({ing.unit})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.05"
                  min="0.01"
                  value={line.quantityRequired}
                  onChange={(e) => {
                    const copy = [...newItems];
                    copy[idx].quantityRequired = e.target.value;
                    setNewItems(copy);
                  }}
                  className="w-24 h-10 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px] tabular-nums"
                />
                {newItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setNewItems(newItems.filter((_, i) => i !== idx))
                    }
                    className="p-2 text-[#777b86] hover:text-[#17191c] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <PillButton variant="ghost" onClick={() => setModalOpen(false)}>
              Cancelar
            </PillButton>
            <PillButton type="submit" variant="filled">
              Guardar receta
            </PillButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
