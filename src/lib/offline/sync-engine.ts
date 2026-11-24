"use client";

import {
  offlineDb,
  ensureOfflineSeeded,
  type SyncMutationType,
  type LocalPurchaseOrder,
} from "./db";
import {
  RESTAURANT_ID,
  type SeedIngredient,
  type SeedRecipe,
  type SeedRestaurant,
  type WasteReasonCode,
} from "../seed-data";
import { roundBs, roundQty } from "../utils/currency";
import type { WhatsAppOrderItem } from "../services/whatsapp-formatter";

function newMutationId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function enqueueMutation(
  type: SyncMutationType,
  clientMutationId: string,
  payload: Record<string, unknown>
) {
  await offlineDb.syncQueue.add({
    clientMutationId,
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: "PENDING",
    retries: 0,
  });
}

export async function executeOfflineFirstSale(params: {
  recipeId: string;
  quantitySold?: number;
  source?: "MANUAL_POS" | "EXTERNAL_POS";
}) {
  await ensureOfflineSeeded();
  const quantitySold = params.quantitySold ?? 1;
  const source = params.source ?? "MANUAL_POS";
  const clientMutationId = newMutationId("sale");

  await offlineDb.transaction(
    "rw",
    [
      offlineDb.recipes,
      offlineDb.ingredients,
      offlineDb.sales,
      offlineDb.syncQueue,
    ],
    async () => {
      const recipe = await offlineDb.recipes.get(params.recipeId);
      if (!recipe) throw new Error("Receta no encontrada en base local");

      let totalCost = 0;
      for (const ri of recipe.ingredients) {
        const ing = await offlineDb.ingredients.get(ri.ingredientId);
        if (!ing) continue;
        const deduct = roundQty(ri.quantityRequired * quantitySold);
        totalCost += roundBs(deduct * ing.unitCostBs);
        await offlineDb.ingredients.update(ing.id, {
          currentStock: Math.max(0, roundQty(ing.currentStock - deduct)),
          updatedAt: new Date().toISOString(),
        });
      }

      await offlineDb.sales.put({
        id: `sale-${clientMutationId}`,
        restaurantId: RESTAURANT_ID,
        recipeId: recipe.id,
        quantitySold,
        totalRevenueBs: roundBs(recipe.salePriceBs * quantitySold),
        totalIngredientCostBs: roundBs(totalCost),
        source,
        createdAt: new Date().toISOString(),
      });

      await enqueueMutation("SALE_POS", clientMutationId, {
        recipeId: recipe.id,
        quantitySold,
        source,
        clientMutationId,
      });
    }
  );

  void flushSyncQueueIfOnline();
  return clientMutationId;
}

export async function executeOfflineFirstWaste(params: {
  ingredientId: string;
  quantityLost: number;
  reason: WasteReasonCode;
  notes?: string;
}) {
  await ensureOfflineSeeded();
  const clientMutationId = newMutationId("waste");

  let monetaryLossBs = 0;

  await offlineDb.transaction(
    "rw",
    [offlineDb.ingredients, offlineDb.wastes, offlineDb.syncQueue],
    async () => {
      const ing = await offlineDb.ingredients.get(params.ingredientId);
      if (!ing) throw new Error("Insumo no encontrado");

      monetaryLossBs = roundBs(params.quantityLost * ing.unitCostBs);
      await offlineDb.ingredients.update(ing.id, {
        currentStock: Math.max(0, roundQty(ing.currentStock - params.quantityLost)),
        updatedAt: new Date().toISOString(),
      });

      await offlineDb.wastes.put({
        id: `waste-${clientMutationId}`,
        restaurantId: RESTAURANT_ID,
        ingredientId: ing.id,
        quantityLost: params.quantityLost,
        reason: params.reason,
        monetaryLossBs,
        notes: params.notes ?? "",
        createdAt: new Date().toISOString(),
      });

      await enqueueMutation("WASTE_RECORD", clientMutationId, {
        ingredientId: ing.id,
        quantityLost: params.quantityLost,
        reason: params.reason,
        notes: params.notes ?? "",
        clientMutationId,
      });
    }
  );

  void flushSyncQueueIfOnline();
  return { clientMutationId, monetaryLossBs };
}

export async function executeOfflineFirstQuickPurchase(params: {
  ingredientId: string;
  quantityAdded: number;
  newUnitCostBs?: number;
}) {
  await ensureOfflineSeeded();
  const clientMutationId = newMutationId("buy");

  await offlineDb.transaction(
    "rw",
    [offlineDb.ingredients, offlineDb.syncQueue],
    async () => {
      const ing = await offlineDb.ingredients.get(params.ingredientId);
      if (!ing) throw new Error("Insumo no encontrado");

      await offlineDb.ingredients.update(ing.id, {
        currentStock: roundQty(ing.currentStock + params.quantityAdded),
        unitCostBs:
          params.newUnitCostBs !== undefined
            ? params.newUnitCostBs
            : ing.unitCostBs,
        updatedAt: new Date().toISOString(),
      });

      await enqueueMutation("QUICK_PURCHASE", clientMutationId, {
        ingredientId: ing.id,
        quantityAdded: params.quantityAdded,
        newUnitCostBs: params.newUnitCostBs,
        clientMutationId,
      });
    }
  );

  void flushSyncQueueIfOnline();
  return clientMutationId;
}

export async function executeOfflineFirstIngredientUpsert(
  input: Omit<SeedIngredient, "id" | "updatedAt" | "restaurantId"> & {
    id?: string;
  }
) {
  await ensureOfflineSeeded();
  const clientMutationId = newMutationId("ing");
  const id = input.id || `ing-${Date.now()}`;
  const item: SeedIngredient = {
    ...input,
    id,
    restaurantId: RESTAURANT_ID,
    updatedAt: new Date().toISOString(),
  };

  await offlineDb.transaction(
    "rw",
    [offlineDb.ingredients, offlineDb.syncQueue],
    async () => {
      await offlineDb.ingredients.put(item);
      await enqueueMutation("INGREDIENT_UPSERT", clientMutationId, {
        ...item,
      });
    }
  );

  void flushSyncQueueIfOnline();
  return item;
}

export async function executeOfflineFirstRecipeCreate(params: {
  name: string;
  category: string;
  salePriceBs: number;
  ingredients: Array<{ ingredientId: string; quantityRequired: number }>;
}) {
  await ensureOfflineSeeded();
  const clientMutationId = newMutationId("rec");
  const recipeId = `rec-${Date.now()}`;

  const newRecipe: SeedRecipe = {
    id: recipeId,
    restaurantId: RESTAURANT_ID,
    name: params.name,
    category: params.category,
    salePriceBs: params.salePriceBs,
    isActive: true,
    ingredients: params.ingredients.map((ri, idx) => ({
      id: `ri-${recipeId}-${idx}`,
      recipeId,
      ingredientId: ri.ingredientId,
      quantityRequired: ri.quantityRequired,
    })),
  };

  await offlineDb.transaction(
    "rw",
    [offlineDb.recipes, offlineDb.syncQueue],
    async () => {
      await offlineDb.recipes.put(newRecipe);
      await enqueueMutation("RECIPE_CREATE", clientMutationId, params);
    }
  );

  void flushSyncQueueIfOnline();
  return newRecipe;
}

export async function executeOfflineFirstPurchaseOrder(params: {
  id: string;
  supplierId: string;
  status: "SENT_WHATSAPP" | "RECEIVED";
  whatsappMessage: string;
  estimatedTotalBs: number;
  items: WhatsAppOrderItem[];
}) {
  await ensureOfflineSeeded();
  const clientMutationId = newMutationId("po");

  const order: LocalPurchaseOrder = {
    id: params.id,
    restaurantId: RESTAURANT_ID,
    supplierId: params.supplierId,
    status: params.status,
    whatsappMessage: params.whatsappMessage,
    estimatedTotalBs: params.estimatedTotalBs,
    items: params.items,
    createdAt: new Date().toISOString(),
  };

  await offlineDb.transaction(
    "rw",
    [offlineDb.purchaseOrders, offlineDb.ingredients, offlineDb.syncQueue],
    async () => {
      await offlineDb.purchaseOrders.put(order);

      if (params.status === "RECEIVED") {
        for (const item of params.items) {
          const ing = await offlineDb.ingredients.get(item.ingredientId);
          if (ing) {
            await offlineDb.ingredients.update(ing.id, {
              currentStock: roundQty(ing.currentStock + item.quantity),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      await enqueueMutation(
        params.status === "RECEIVED"
          ? "PURCHASE_ORDER_RECEIVED"
          : "PURCHASE_ORDER_SENT",
        clientMutationId,
        {
          ...order,
          clientMutationId,
        }
      );
    }
  );

  void flushSyncQueueIfOnline();
  return order;
}

export async function updateLocalRestaurantSubscription(
  next: Partial<SeedRestaurant>
) {
  await ensureOfflineSeeded();
  const current = await offlineDb.restaurant.get(RESTAURANT_ID);
  if (current) {
    await offlineDb.restaurant.put({ ...current, ...next });
  }
}

let isSyncing = false;

export async function flushSyncQueueIfOnline(): Promise<{
  syncedCount: number;
  pendingCount: number;
}> {
  if (typeof window === "undefined") {
    return { syncedCount: 0, pendingCount: 0 };
  }
  await ensureOfflineSeeded();

  const pending = await offlineDb.syncQueue
    .where("status")
    .equals("PENDING")
    .toArray();

  if (!navigator.onLine || pending.length === 0 || isSyncing) {
    return { syncedCount: 0, pendingCount: pending.length };
  }

  isSyncing = true;
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mutations: pending.map((m) => ({
          clientMutationId: m.clientMutationId,
          type: m.type,
          payload: m.payload,
          createdAt: m.createdAt,
        })),
      }),
    });

    if (!res.ok) {
      return { syncedCount: 0, pendingCount: pending.length };
    }

    const ids = pending.map((p) => p.id).filter((id): id is number => !!id);
    await offlineDb.syncQueue.where("id").anyOf(ids).modify({ status: "SYNCED" });

    return { syncedCount: pending.length, pendingCount: 0 };
  } catch {
    return { syncedCount: 0, pendingCount: pending.length };
  } finally {
    isSyncing = false;
  }
}
