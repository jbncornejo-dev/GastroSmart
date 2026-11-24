"use client";

import Dexie, { type Table } from "dexie";
import {
  SEED_INGREDIENTS,
  SEED_RECIPES,
  SEED_RESTAURANT,
  SEED_SALES,
  SEED_SUPPLIERS,
  SEED_WASTES,
  type SeedIngredient,
  type SeedRecipe,
  type SeedRestaurant,
  type SeedSaleRecord,
  type SeedSupplier,
  type SeedWasteRecord,
} from "../seed-data";
import type { WhatsAppOrderItem } from "../services/whatsapp-formatter";

export interface LocalPurchaseOrder {
  id: string;
  restaurantId: string;
  supplierId: string;
  status: "DRAFT_OFFLINE" | "SENT_WHATSAPP" | "RECEIVED";
  whatsappMessage: string;
  estimatedTotalBs: number;
  items: WhatsAppOrderItem[];
  createdAt: string;
}

export type SyncMutationType =
  | "SALE_POS"
  | "WASTE_RECORD"
  | "QUICK_PURCHASE"
  | "PURCHASE_ORDER_SENT"
  | "PURCHASE_ORDER_RECEIVED"
  | "INGREDIENT_UPSERT"
  | "RECIPE_CREATE";

export interface SyncQueueItem {
  id?: number;
  clientMutationId: string;
  type: SyncMutationType;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "PENDING" | "SYNCED" | "ERROR";
  retries: number;
}

class GastroSmartOfflineDB extends Dexie {
  restaurant!: Table<SeedRestaurant, string>;
  suppliers!: Table<SeedSupplier, string>;
  ingredients!: Table<SeedIngredient, string>;
  recipes!: Table<SeedRecipe, string>;
  sales!: Table<SeedSaleRecord, string>;
  wastes!: Table<SeedWasteRecord, string>;
  purchaseOrders!: Table<LocalPurchaseOrder, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("gastrosmart_cbba_v1");
    this.version(1).stores({
      restaurant: "id",
      suppliers: "id, restaurantId, category",
      ingredients: "id, restaurantId, category, location, defaultSupplierId",
      recipes: "id, restaurantId, category",
      sales: "id, restaurantId, recipeId, createdAt",
      wastes: "id, restaurantId, ingredientId, reason, createdAt",
      purchaseOrders: "id, restaurantId, supplierId, status, createdAt",
      syncQueue: "++id, clientMutationId, type, status, createdAt",
    });
  }
}

export const offlineDb = new GastroSmartOfflineDB();

let seedPromise: Promise<void> | null = null;

export async function ensureOfflineSeeded(): Promise<void> {
  if (typeof window === "undefined") return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const count = await offlineDb.ingredients.count();
    if (count > 0) return;

    await offlineDb.transaction(
      "rw",
      [
        offlineDb.restaurant,
        offlineDb.suppliers,
        offlineDb.ingredients,
        offlineDb.recipes,
        offlineDb.wastes,
        offlineDb.sales,
      ],
      async () => {
        await offlineDb.restaurant.put(SEED_RESTAURANT);
        await offlineDb.suppliers.bulkPut(SEED_SUPPLIERS);
        await offlineDb.ingredients.bulkPut(SEED_INGREDIENTS);
        await offlineDb.recipes.bulkPut(SEED_RECIPES);
        await offlineDb.wastes.bulkPut(SEED_WASTES);
        await offlineDb.sales.bulkPut(SEED_SALES);
      }
    );
  })();

  return seedPromise;
}
