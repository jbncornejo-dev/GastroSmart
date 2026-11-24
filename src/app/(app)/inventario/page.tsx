"use client";

import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Plus } from "lucide-react";
import { offlineDb } from "@/lib/offline/db";
import {
  executeOfflineFirstIngredientUpsert,
  executeOfflineFirstQuickPurchase,
} from "@/lib/offline/sync-engine";
import {
  CategoryTag,
  Modal,
  PeachCard,
  PillButton,
  StockProgressBar,
  StockStatusIndicator,
  getStockStatus,
} from "@/components/ui";
import { formatBs, formatQuantity } from "@/lib/utils/currency";
import type { SeedIngredient } from "@/lib/seed-data";

const LOCATIONS = ["Todos", "Cámara Frío", "Almacén Seco", "Cocina"] as const;
const STATUS_FILTERS = ["Todos", "Crítico", "Por agotarse", "Óptimo"] as const;

export default function InventarioPage() {
  const ingredients =
    useLiveQuery(() => offlineDb.ingredients.toArray(), [], []) ?? [];
  const suppliers =
    useLiveQuery(() => offlineDb.suppliers.toArray(), [], []) ?? [];

  const [locationFilter, setLocationFilter] = useState<string>("Todos");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  // Modal de compra rapida (entrada + precio actualizado)
  const [purchaseTarget, setPurchaseTarget] = useState<SeedIngredient | null>(
    null
  );
  const [purchaseQty, setPurchaseQty] = useState("5");
  const [purchaseCost, setPurchaseCost] = useState("");

  // Modal de crear / editar insumo con multiples proveedores
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] =
    useState<SeedIngredient["category"]>("Verduras");
  const [formLocation, setFormLocation] =
    useState<SeedIngredient["location"]>("Cámara Frío");
  const [formUnit, setFormUnit] = useState<SeedIngredient["unit"]>("kg");
  const [formStock, setFormStock] = useState("5");
  const [formMin, setFormMin] = useState("3");
  const [formOptimal, setFormOptimal] = useState("10");
  const [formCost, setFormCost] = useState("10");
  const [formDefaultSupplier, setFormDefaultSupplier] = useState("");
  const [formAltSuppliers, setFormAltSuppliers] = useState<string[]>([]);

  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

  const filtered = ingredients.filter((ing) => {
    if (locationFilter !== "Todos" && ing.location !== locationFilter) {
      return false;
    }
    const st = getStockStatus(ing.currentStock, ing.minStock);
    if (statusFilter === "Crítico" && st !== "CRITICAL") return false;
    if (statusFilter === "Por agotarse" && st !== "LOW") return false;
    if (statusFilter === "Óptimo" && st !== "OPTIMAL") return false;
    return true;
  });

  const criticalCount = ingredients.filter(
    (i) => getStockStatus(i.currentStock, i.minStock) === "CRITICAL"
  ).length;

  function openQuickPurchase(ing: SeedIngredient) {
    setPurchaseTarget(ing);
    setPurchaseQty("5");
    setPurchaseCost(String(ing.unitCostBs));
  }

  async function submitQuickPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!purchaseTarget) return;
    const qty = parseFloat(purchaseQty);
    const cost = parseFloat(purchaseCost);
    if (!Number.isFinite(qty) || qty <= 0) return;

    await executeOfflineFirstQuickPurchase({
      ingredientId: purchaseTarget.id,
      quantityAdded: qty,
      newUnitCostBs: Number.isFinite(cost) && cost >= 0 ? cost : undefined,
    });
    setPurchaseTarget(null);
  }

  async function addFastFive(ing: SeedIngredient) {
    await executeOfflineFirstQuickPurchase({
      ingredientId: ing.id,
      quantityAdded: 5,
    });
  }

  function openNewIngredientModal() {
    setEditingId(undefined);
    setFormName("");
    setFormCategory("Verduras");
    setFormLocation("Cámara Frío");
    setFormUnit("kg");
    setFormStock("5");
    setFormMin("4");
    setFormOptimal("10");
    setFormCost("12");
    setFormDefaultSupplier(suppliers[0]?.id ?? "sup-calatayud");
    setFormAltSuppliers([]);
    setEditorOpen(true);
  }

  function openEditIngredientModal(ing: SeedIngredient) {
    setEditingId(ing.id);
    setFormName(ing.name);
    setFormCategory(ing.category);
    setFormLocation(ing.location);
    setFormUnit(ing.unit);
    setFormStock(String(ing.currentStock));
    setFormMin(String(ing.minStock));
    setFormOptimal(String(ing.optimalStock));
    setFormCost(String(ing.unitCostBs));
    setFormDefaultSupplier(ing.defaultSupplierId);
    setFormAltSuppliers(ing.alternativeSupplierIds ?? []);
    setEditorOpen(true);
  }

  function toggleAltSupplier(supId: string) {
    if (supId === formDefaultSupplier) return;
    setFormAltSuppliers((prev) =>
      prev.includes(supId) ? prev.filter((id) => id !== supId) : [...prev, supId]
    );
  }

  async function handleSaveIngredient(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;
    await executeOfflineFirstIngredientUpsert({
      id: editingId,
      name: formName.trim(),
      category: formCategory,
      location: formLocation,
      unit: formUnit,
      currentStock: Math.max(0, parseFloat(formStock) || 0),
      minStock: Math.max(0, parseFloat(formMin) || 0),
      optimalStock: Math.max(1, parseFloat(formOptimal) || 10),
      unitCostBs: Math.max(0, parseFloat(formCost) || 0),
      defaultSupplierId:
        formDefaultSupplier || suppliers[0]?.id || "sup-calatayud",
      alternativeSupplierIds: formAltSuppliers,
    });
    setEditorOpen(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <CategoryTag>Módulo 2 · Inventario de perecederos</CategoryTag>
          <h1 className="heading-md text-[#17191c] mt-1">
            Control de insumos y entradas rápidas
          </h1>
          <p className="text-[16px] text-[#777b86] mt-1">
            Actualiza compras al instante ante variación de precios en La Cancha
            o Mercado Calatayud.
          </p>
        </div>

        <PillButton variant="filled" onClick={openNewIngredientModal}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
          Nuevo insumo
        </PillButton>
      </div>

      {/* Unica PeachCard de la vista cuando hay criticos */}
      {criticalCount > 0 && (
        <PeachCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14px] text-[#5d2a1a]/80">
              Alerta de reposición inmediata
            </p>
            <p className="text-[18px] font-medium text-[#5d2a1a] mt-0.5">
              Tienes {criticalCount} insumos por debajo del stock mínimo.
            </p>
          </div>
          <PillButton href="/compras" variant="filled">
            Preparar pedido por WhatsApp
          </PillButton>
        </PeachCard>
      )}

      {/* Filtros sobrios */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#f2f2f3]">
        <div className="flex flex-wrap items-center gap-1.5">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocationFilter(loc)}
              className={`px-4 py-1.5 rounded-full text-[14px] transition-colors cursor-pointer ${
                locationFilter === loc
                  ? "bg-[#17191c] text-[#ffffff]"
                  : "text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] border transition-colors cursor-pointer ${
                statusFilter === st
                  ? "border-[#17191c] text-[#17191c] font-medium"
                  : "border-transparent text-[#777b86] hover:text-[#17191c]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla editorial clara */}
      <div className="border border-[#f2f2f3] rounded-[24px] overflow-hidden bg-[#ffffff]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f2f2f3] text-[13px] text-[#979799] font-normal">
                <th className="py-3.5 px-5 font-normal">Insumo / Costo</th>
                <th className="py-3.5 px-5 font-normal">Categoría</th>
                <th className="py-3.5 px-5 font-normal">Ubicación</th>
                <th className="py-3.5 px-5 font-normal">Stock actual vs mínimo</th>
                <th className="py-3.5 px-5 font-normal">Proveedor principal</th>
                <th className="py-3.5 px-5 font-normal text-right">
                  Entrada rápida
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f2f3] text-[15px]">
              {filtered.map((ing) => {
                const status = getStockStatus(ing.currentStock, ing.minStock);
                const sup = supplierMap.get(ing.defaultSupplierId);
                return (
                  <tr
                    key={ing.id}
                    className="hover:bg-[#fafafb] transition-colors"
                  >
                    <td className="py-4 px-5">
                      <button
                        type="button"
                        onClick={() => openEditIngredientModal(ing)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-medium text-[#17191c] group-hover:underline underline-offset-4">
                          {ing.name}
                        </div>
                        <div className="text-[13px] text-[#777b86] tabular-nums">
                          {formatBs(ing.unitCostBs)} / {ing.unit}
                        </div>
                      </button>
                    </td>
                    <td className="py-4 px-5">
                      <CategoryTag>{ing.category}</CategoryTag>
                    </td>
                    <td className="py-4 px-5 text-[14px] text-[#777b86]">
                      {ing.location}
                    </td>
                    <td className="py-4 px-5 min-w-[220px]">
                      <div className="flex items-center justify-between mb-1.5">
                        <StockStatusIndicator status={status} />
                        <span className="text-[13px] text-[#17191c] tabular-nums">
                          {formatQuantity(ing.currentStock, ing.unit)}{" "}
                          <span className="text-[#979799]">
                            / mín {ing.minStock}
                          </span>
                        </span>
                      </div>
                      <StockProgressBar
                        currentStock={ing.currentStock}
                        minStock={ing.minStock}
                        optimalStock={ing.optimalStock}
                      />
                    </td>
                    <td className="py-4 px-5 text-[14px] text-[#777b86]">
                      <div>{sup?.name ?? "Sin proveedor"}</div>
                      {ing.alternativeSupplierIds &&
                        ing.alternativeSupplierIds.length > 0 && (
                          <div className="text-[12px] text-[#979799]">
                            +{ing.alternativeSupplierIds.length} alterno(s)
                          </div>
                        )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <PillButton
                          variant="ghost"
                          size="sm"
                          onClick={() => void addFastFive(ing)}
                          title="Sumar +5 unidades al instante"
                        >
                          +5 {ing.unit}
                        </PillButton>
                        <PillButton
                          variant="filled"
                          size="sm"
                          onClick={() => openQuickPurchase(ing)}
                        >
                          + Compra rápida
                        </PillButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Compra Rapida */}
      <Modal
        open={!!purchaseTarget}
        onClose={() => setPurchaseTarget(null)}
        title={`Compra rápida · ${purchaseTarget?.name ?? ""}`}
        subtitle="Registra ingreso de stock y actualiza el costo unitario si hubo variación en el mercado."
      >
        <form onSubmit={submitQuickPurchase} className="space-y-4">
          <div>
            <label className="block text-[14px] text-[#777b86] mb-1.5">
              Cantidad ingresada ({purchaseTarget?.unit})
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={purchaseQty}
              onChange={(e) => setPurchaseQty(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[#17191c] text-[15px] focus:outline-none focus:bg-[#ffffff] border border-transparent focus:border-[#17191c]/25"
            />
          </div>
          <div>
            <label className="block text-[14px] text-[#777b86] mb-1.5">
              Precio unitario actual (Bs / {purchaseTarget?.unit})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              required
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[#17191c] text-[15px] focus:outline-none focus:bg-[#ffffff] border border-transparent focus:border-[#17191c]/25"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4">
            <PillButton
              variant="ghost"
              onClick={() => setPurchaseTarget(null)}
            >
              Cancelar
            </PillButton>
            <PillButton type="submit" variant="filled">
              Confirmar ingreso
            </PillButton>
          </div>
        </form>
      </Modal>

      {/* Modal de Crear / Editar Insumo */}
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? "Editar insumo" : "Nuevo insumo perecedero"}
        subtitle="Configura stock mínimo, ubicación y proveedores asociados."
      >
        <form onSubmit={handleSaveIngredient} className="space-y-4">
          <div>
            <label className="block text-[14px] text-[#777b86] mb-1.5">
              Nombre del insumo
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej. Locoto Verde"
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[#17191c] text-[15px] focus:outline-none focus:bg-[#ffffff] border border-transparent focus:border-[#17191c]/25"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Categoría
              </label>
              <select
                value={formCategory}
                onChange={(e) =>
                  setFormCategory(e.target.value as SeedIngredient["category"])
                }
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px] text-[#17191c]"
              >
                <option value="Carnes">Carnes</option>
                <option value="Verduras">Verduras</option>
                <option value="Tubérculos">Tubérculos</option>
                <option value="Lácteos">Lácteos</option>
                <option value="Abarrotes">Abarrotes</option>
                <option value="Aceites">Aceites</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Ubicación
              </label>
              <select
                value={formLocation}
                onChange={(e) =>
                  setFormLocation(e.target.value as SeedIngredient["location"])
                }
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px] text-[#17191c]"
              >
                <option value="Cámara Frío">Cámara Frío</option>
                <option value="Almacén Seco">Almacén Seco</option>
                <option value="Cocina">Cocina</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Unidad
              </label>
              <select
                value={formUnit}
                onChange={(e) =>
                  setFormUnit(e.target.value as SeedIngredient["unit"])
                }
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px] text-[#17191c]"
              >
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="u">u</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Stock actual
              </label>
              <input
                type="number"
                step="0.1"
                value={formStock}
                onChange={(e) => setFormStock(e.target.value)}
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                step="0.1"
                value={formMin}
                onChange={(e) => setFormMin(e.target.value)}
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Stock óptimo
              </label>
              <input
                type="number"
                step="0.1"
                value={formOptimal}
                onChange={(e) => setFormOptimal(e.target.value)}
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#777b86] mb-1">
                Costo (Bs)
              </label>
              <input
                type="number"
                step="0.1"
                value={formCost}
                onChange={(e) => setFormCost(e.target.value)}
                className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] mb-1">
              Proveedor principal
            </label>
            <select
              value={formDefaultSupplier}
              onChange={(e) => setFormDefaultSupplier(e.target.value)}
              className="w-full h-11 px-3 rounded-[16px] bg-[#f2f2f3] text-[14px]"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[13px] text-[#777b86] mb-1.5">
              Proveedores alternos asociados
            </label>
            <div className="flex flex-wrap gap-2">
              {suppliers
                .filter((s) => s.id !== formDefaultSupplier)
                .map((s) => {
                  const selected = formAltSuppliers.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleAltSupplier(s.id)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border cursor-pointer transition-colors ${
                        selected
                          ? "bg-[#17191c] text-[#ffffff] border-[#17191c]"
                          : "bg-[#ffffff] text-[#777b86] border-[#f2f2f3] hover:border-[#17191c]/30"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <PillButton variant="ghost" onClick={() => setEditorOpen(false)}>
              Cancelar
            </PillButton>
            <PillButton type="submit" variant="filled">
              Guardar insumo
            </PillButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
