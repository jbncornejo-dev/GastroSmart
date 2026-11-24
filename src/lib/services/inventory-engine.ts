import { Prisma } from "@prisma/client";
import { prisma, isDatabaseAvailable } from "../prisma";
import {
  RESTAURANT_ID,
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
  type WasteReasonCode,
} from "../seed-data";
import { roundBs, roundQty } from "../utils/currency";
import type { WhatsAppOrderItem } from "./whatsapp-formatter";

export interface PurchaseOrderRecord {
  id: string;
  restaurantId: string;
  supplierId: string;
  status: "DRAFT_OFFLINE" | "SENT_WHATSAPP" | "RECEIVED";
  whatsappMessage: string;
  estimatedTotalBs: number;
  items: WhatsAppOrderItem[];
  clientMutationId?: string;
  createdAt: string;
}

interface MemoryStore {
  restaurant: SeedRestaurant;
  suppliers: SeedSupplier[];
  ingredients: SeedIngredient[];
  recipes: SeedRecipe[];
  sales: SeedSaleRecord[];
  wastes: SeedWasteRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  processedMutationIds: Set<string>;
}

const globalStore = globalThis as unknown as {
  __gastrosmartMemStore?: MemoryStore;
};

function getMemoryStore(): MemoryStore {
  if (!globalStore.__gastrosmartMemStore) {
    globalStore.__gastrosmartMemStore = {
      restaurant: structuredClone(SEED_RESTAURANT),
      suppliers: structuredClone(SEED_SUPPLIERS),
      ingredients: structuredClone(SEED_INGREDIENTS),
      recipes: structuredClone(SEED_RECIPES),
      sales: structuredClone(SEED_SALES),
      wastes: structuredClone(SEED_WASTES),
      purchaseOrders: [],
      processedMutationIds: new Set<string>(),
    };
  }
  return globalStore.__gastrosmartMemStore;
}

export async function getFullBootstrapState(
  restaurantId = RESTAURANT_ID
): Promise<{
  restaurant: SeedRestaurant;
  suppliers: SeedSupplier[];
  ingredients: SeedIngredient[];
  recipes: SeedRecipe[];
  sales: SeedSaleRecord[];
  wastes: SeedWasteRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  storageMode: "postgres" | "memory";
}> {
  if (await isDatabaseAvailable()) {
    const [restaurant, suppliers, ingredients, recipes, sales, wastes, pos] =
      await Promise.all([
        prisma.restaurant.findUnique({ where: { id: restaurantId } }),
        prisma.supplier.findMany({ where: { restaurantId } }),
        prisma.ingredient.findMany({
          where: { restaurantId },
          include: { supplierLinks: true },
          orderBy: { name: "asc" },
        }),
        prisma.recipe.findMany({
          where: { restaurantId },
          include: { ingredients: true },
          orderBy: { name: "asc" },
        }),
        prisma.saleRecord.findMany({
          where: { restaurantId },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.wasteRecord.findMany({
          where: { restaurantId },
          orderBy: { createdAt: "desc" },
          take: 100,
        }),
        prisma.purchaseOrder.findMany({
          where: { restaurantId },
          orderBy: { createdAt: "desc" },
          take: 50,
        }),
      ]);

    if (restaurant) {
      return {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          zone: restaurant.zone,
          plan: restaurant.plan,
          billingCycle: restaurant.billingCycle,
          subscriptionStatus: restaurant.subscriptionStatus,
          taxRegime: restaurant.taxRegime,
          isAseracMember: restaurant.isAseracMember,
        },
        suppliers: suppliers.map((s) => ({
          id: s.id,
          restaurantId: s.restaurantId,
          name: s.name,
          category: s.category as SeedSupplier["category"],
          whatsappPhone: s.whatsappPhone,
          notes: s.notes ?? undefined,
        })),
        ingredients: ingredients.map((i) => ({
          id: i.id,
          restaurantId: i.restaurantId,
          name: i.name,
          category: i.category as SeedIngredient["category"],
          location: i.location as SeedIngredient["location"],
          unit: i.unit as SeedIngredient["unit"],
          currentStock: Number(i.currentStock),
          minStock: Number(i.minStock),
          optimalStock: Number(i.optimalStock),
          unitCostBs: Number(i.unitCostBs),
          defaultSupplierId: i.defaultSupplierId,
          alternativeSupplierIds: i.supplierLinks
            .map((l) => l.supplierId)
            .filter((sid) => sid !== i.defaultSupplierId),
          updatedAt: i.updatedAt.toISOString(),
        })),
        recipes: recipes.map((r) => ({
          id: r.id,
          restaurantId: r.restaurantId,
          name: r.name,
          category: r.category,
          salePriceBs: Number(r.salePriceBs),
          isActive: r.isActive,
          ingredients: r.ingredients.map((ri) => ({
            id: ri.id,
            recipeId: ri.recipeId,
            ingredientId: ri.ingredientId,
            quantityRequired: Number(ri.quantityRequired),
          })),
        })),
        sales: sales.map((s) => ({
          id: s.id,
          restaurantId: s.restaurantId,
          recipeId: s.recipeId,
          quantitySold: s.quantitySold,
          totalRevenueBs: Number(s.totalRevenueBs),
          totalIngredientCostBs: Number(s.totalIngredientCostBs),
          source: s.source,
          createdAt: s.createdAt.toISOString(),
        })),
        wastes: wastes.map((w) => ({
          id: w.id,
          restaurantId: w.restaurantId,
          ingredientId: w.ingredientId,
          quantityLost: Number(w.quantityLost),
          reason: w.reason,
          monetaryLossBs: Number(w.monetaryLossBs),
          notes: w.notes ?? "",
          createdAt: w.createdAt.toISOString(),
        })),
        purchaseOrders: pos.map((po) => ({
          id: po.id,
          restaurantId: po.restaurantId,
          supplierId: po.supplierId,
          status: po.status,
          whatsappMessage: po.whatsappMessage,
          estimatedTotalBs: Number(po.estimatedTotalBs),
          items: Array.isArray(po.itemsJson)
            ? (po.itemsJson as unknown as WhatsAppOrderItem[])
            : [],
          clientMutationId: po.clientMutationId ?? undefined,
          createdAt: po.createdAt.toISOString(),
        })),
        storageMode: "postgres",
      };
    }
  }

  const mem = getMemoryStore();
  return {
    restaurant: mem.restaurant,
    suppliers: mem.suppliers,
    ingredients: mem.ingredients,
    recipes: mem.recipes,
    sales: mem.sales,
    wastes: mem.wastes,
    purchaseOrders: mem.purchaseOrders,
    storageMode: "memory",
  };
}

export async function recordSaleTransactional(params: {
  restaurantId?: string;
  recipeId: string;
  quantitySold: number;
  source: "MANUAL_POS" | "EXTERNAL_POS";
  clientMutationId: string;
}): Promise<{ idempotentDuplicate: boolean; saleId: string }> {
  const restaurantId = params.restaurantId ?? RESTAURANT_ID;

  if (await isDatabaseAvailable()) {
    const existing = await prisma.saleRecord.findUnique({
      where: { clientMutationId: params.clientMutationId },
    });
    if (existing) {
      return { idempotentDuplicate: true, saleId: existing.id };
    }

    const result = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findUnique({
        where: { id: params.recipeId },
        include: { ingredients: { include: { ingredient: true } } },
      });
      if (!recipe) {
        throw new Error("Receta no encontrada");
      }

      let totalCost = 0;
      const saleRecord = await tx.saleRecord.create({
        data: {
          restaurantId,
          recipeId: recipe.id,
          quantitySold: params.quantitySold,
          totalRevenueBs: roundBs(
            Number(recipe.salePriceBs) * params.quantitySold
          ),
          totalIngredientCostBs: 0,
          source: params.source,
          clientMutationId: params.clientMutationId,
        },
      });

      for (const ri of recipe.ingredients) {
        const deduct = roundQty(
          Number(ri.quantityRequired) * params.quantitySold
        );
        const unitCost = Number(ri.ingredient.unitCostBs);
        const costImpact = roundBs(deduct * unitCost);
        totalCost += costImpact;

        const nextStock = Math.max(
          0,
          roundQty(Number(ri.ingredient.currentStock) - deduct)
        );

        await tx.ingredient.update({
          where: { id: ri.ingredientId },
          data: { currentStock: nextStock },
        });

        await tx.inventoryMovement.create({
          data: {
            ingredientId: ri.ingredientId,
            type: "SALE_DEDUCTION",
            quantityDelta: -deduct,
            costImpactBs: costImpact,
            referenceId: saleRecord.id,
            clientMutationId: `${params.clientMutationId}:${ri.ingredientId}`,
          },
        });
      }

      await tx.saleRecord.update({
        where: { id: saleRecord.id },
        data: { totalIngredientCostBs: roundBs(totalCost) },
      });

      return saleRecord.id;
    });

    return { idempotentDuplicate: false, saleId: result };
  }

  const mem = getMemoryStore();
  if (mem.processedMutationIds.has(params.clientMutationId)) {
    return {
      idempotentDuplicate: true,
      saleId: `sale-${params.clientMutationId}`,
    };
  }
  mem.processedMutationIds.add(params.clientMutationId);

  const recipe = mem.recipes.find((r) => r.id === params.recipeId);
  if (!recipe) throw new Error("Receta no encontrada");

  let totalCost = 0;
  for (const ri of recipe.ingredients) {
    const ing = mem.ingredients.find((i) => i.id === ri.ingredientId);
    if (!ing) continue;
    const deduct = roundQty(ri.quantityRequired * params.quantitySold);
    totalCost += roundBs(deduct * ing.unitCostBs);
    ing.currentStock = Math.max(0, roundQty(ing.currentStock - deduct));
    ing.updatedAt = new Date().toISOString();
  }

  const saleId = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  mem.sales.unshift({
    id: saleId,
    restaurantId,
    recipeId: recipe.id,
    quantitySold: params.quantitySold,
    totalRevenueBs: roundBs(recipe.salePriceBs * params.quantitySold),
    totalIngredientCostBs: roundBs(totalCost),
    source: params.source,
    createdAt: new Date().toISOString(),
  });

  return { idempotentDuplicate: false, saleId };
}

export async function recordWasteTransactional(params: {
  restaurantId?: string;
  ingredientId: string;
  quantityLost: number;
  reason: WasteReasonCode;
  notes?: string;
  clientMutationId: string;
}): Promise<{ idempotentDuplicate: boolean; wasteId: string; monetaryLossBs: number }> {
  const restaurantId = params.restaurantId ?? RESTAURANT_ID;

  if (await isDatabaseAvailable()) {
    const existing = await prisma.wasteRecord.findUnique({
      where: { clientMutationId: params.clientMutationId },
    });
    if (existing) {
      return {
        idempotentDuplicate: true,
        wasteId: existing.id,
        monetaryLossBs: Number(existing.monetaryLossBs),
      };
    }

    const res = await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({
        where: { id: params.ingredientId },
      });
      if (!ing) throw new Error("Insumo no encontrado");

      const lossBs = roundBs(params.quantityLost * Number(ing.unitCostBs));
      const nextStock = Math.max(
        0,
        roundQty(Number(ing.currentStock) - params.quantityLost)
      );

      await tx.ingredient.update({
        where: { id: ing.id },
        data: { currentStock: nextStock },
      });

      const waste = await tx.wasteRecord.create({
        data: {
          restaurantId,
          ingredientId: ing.id,
          quantityLost: params.quantityLost,
          reason: params.reason,
          monetaryLossBs: lossBs,
          notes: params.notes || null,
          clientMutationId: params.clientMutationId,
        },
      });

      await tx.inventoryMovement.create({
        data: {
          ingredientId: ing.id,
          type: "WASTE",
          quantityDelta: -params.quantityLost,
          costImpactBs: lossBs,
          referenceId: waste.id,
          clientMutationId: params.clientMutationId,
        },
      });

      return { wasteId: waste.id, monetaryLossBs: lossBs };
    });

    return { idempotentDuplicate: false, ...res };
  }

  const mem = getMemoryStore();
  if (mem.processedMutationIds.has(params.clientMutationId)) {
    return {
      idempotentDuplicate: true,
      wasteId: `waste-${params.clientMutationId}`,
      monetaryLossBs: 0,
    };
  }
  mem.processedMutationIds.add(params.clientMutationId);

  const ing = mem.ingredients.find((i) => i.id === params.ingredientId);
  if (!ing) throw new Error("Insumo no encontrado");

  const lossBs = roundBs(params.quantityLost * ing.unitCostBs);
  ing.currentStock = Math.max(0, roundQty(ing.currentStock - params.quantityLost));
  ing.updatedAt = new Date().toISOString();

  const wasteId = `waste-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  mem.wastes.unshift({
    id: wasteId,
    restaurantId,
    ingredientId: ing.id,
    quantityLost: params.quantityLost,
    reason: params.reason,
    monetaryLossBs: lossBs,
    notes: params.notes ?? "",
    createdAt: new Date().toISOString(),
  });

  return { idempotentDuplicate: false, wasteId, monetaryLossBs: lossBs };
}

export async function recordQuickPurchaseTransactional(params: {
  ingredientId: string;
  quantityAdded: number;
  newUnitCostBs?: number;
  clientMutationId: string;
}): Promise<{ idempotentDuplicate: boolean }> {
  if (await isDatabaseAvailable()) {
    const existing = await prisma.inventoryMovement.findUnique({
      where: { clientMutationId: params.clientMutationId },
    });
    if (existing) return { idempotentDuplicate: true };

    await prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({
        where: { id: params.ingredientId },
      });
      if (!ing) throw new Error("Insumo no encontrado");

      const nextCost =
        params.newUnitCostBs !== undefined
          ? params.newUnitCostBs
          : Number(ing.unitCostBs);
      const nextStock = roundQty(Number(ing.currentStock) + params.quantityAdded);

      await tx.ingredient.update({
        where: { id: ing.id },
        data: { currentStock: nextStock, unitCostBs: nextCost },
      });

      await tx.inventoryMovement.create({
        data: {
          ingredientId: ing.id,
          type: "PURCHASE",
          quantityDelta: params.quantityAdded,
          costImpactBs: roundBs(params.quantityAdded * nextCost),
          clientMutationId: params.clientMutationId,
        },
      });
    });

    return { idempotentDuplicate: false };
  }

  const mem = getMemoryStore();
  if (mem.processedMutationIds.has(params.clientMutationId)) {
    return { idempotentDuplicate: true };
  }
  mem.processedMutationIds.add(params.clientMutationId);

  const ing = mem.ingredients.find((i) => i.id === params.ingredientId);
  if (!ing) throw new Error("Insumo no encontrado");

  ing.currentStock = roundQty(ing.currentStock + params.quantityAdded);
  if (params.newUnitCostBs !== undefined) {
    ing.unitCostBs = params.newUnitCostBs;
  }
  ing.updatedAt = new Date().toISOString();

  return { idempotentDuplicate: false };
}

export async function upsertIngredientTransactional(
  input: Omit<SeedIngredient, "id" | "updatedAt" | "restaurantId"> & {
    id?: string;
    restaurantId?: string;
  }
): Promise<SeedIngredient> {
  const restaurantId = input.restaurantId ?? RESTAURANT_ID;
  const id =
    input.id || `ing-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (await isDatabaseAvailable()) {
    const saved = await prisma.$transaction(async (tx) => {
      const upserted = await tx.ingredient.upsert({
        where: { id },
        update: {
          name: input.name,
          category: input.category,
          location: input.location,
          unit: input.unit,
          currentStock: input.currentStock,
          minStock: input.minStock,
          optimalStock: input.optimalStock,
          unitCostBs: input.unitCostBs,
          defaultSupplierId: input.defaultSupplierId,
        },
        create: {
          id,
          restaurantId,
          name: input.name,
          category: input.category,
          location: input.location,
          unit: input.unit,
          currentStock: input.currentStock,
          minStock: input.minStock,
          optimalStock: input.optimalStock,
          unitCostBs: input.unitCostBs,
          defaultSupplierId: input.defaultSupplierId,
        },
      });

      const supplierIds = Array.from(
        new Set([input.defaultSupplierId, ...input.alternativeSupplierIds])
      );
      await tx.ingredientSupplier.deleteMany({
        where: { ingredientId: upserted.id },
      });
      for (const sid of supplierIds) {
        await tx.ingredientSupplier.create({
          data: { ingredientId: upserted.id, supplierId: sid },
        });
      }
      return upserted;
    });

    return {
      ...input,
      id: saved.id,
      restaurantId,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  const mem = getMemoryStore();
  const nextItem: SeedIngredient = {
    ...input,
    id,
    restaurantId,
    updatedAt: new Date().toISOString(),
  };
  const idx = mem.ingredients.findIndex((i) => i.id === id);
  if (idx >= 0) {
    mem.ingredients[idx] = nextItem;
  } else {
    mem.ingredients.push(nextItem);
  }
  return nextItem;
}

export async function createRecipeTransactional(params: {
  restaurantId?: string;
  name: string;
  category: string;
  salePriceBs: number;
  ingredients: Array<{ ingredientId: string; quantityRequired: number }>;
}): Promise<SeedRecipe> {
  const restaurantId = params.restaurantId ?? RESTAURANT_ID;
  const recipeId = `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (await isDatabaseAvailable()) {
    const created = await prisma.recipe.create({
      data: {
        id: recipeId,
        restaurantId,
        name: params.name,
        category: params.category,
        salePriceBs: params.salePriceBs,
        isActive: true,
        ingredients: {
          create: params.ingredients.map((ri) => ({
            ingredientId: ri.ingredientId,
            quantityRequired: ri.quantityRequired,
          })),
        },
      },
      include: { ingredients: true },
    });

    return {
      id: created.id,
      restaurantId: created.restaurantId,
      name: created.name,
      category: created.category,
      salePriceBs: Number(created.salePriceBs),
      isActive: created.isActive,
      ingredients: created.ingredients.map((ri) => ({
        id: ri.id,
        recipeId: ri.recipeId,
        ingredientId: ri.ingredientId,
        quantityRequired: Number(ri.quantityRequired),
      })),
    };
  }

  const mem = getMemoryStore();
  const newRecipe: SeedRecipe = {
    id: recipeId,
    restaurantId,
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
  mem.recipes.push(newRecipe);
  return newRecipe;
}

export async function processPurchaseOrderTransactional(params: {
  restaurantId?: string;
  id: string;
  supplierId: string;
  status: "DRAFT_OFFLINE" | "SENT_WHATSAPP" | "RECEIVED";
  whatsappMessage: string;
  estimatedTotalBs: number;
  items: WhatsAppOrderItem[];
  clientMutationId: string;
}): Promise<{ idempotentDuplicate: boolean; order: PurchaseOrderRecord }> {
  const restaurantId = params.restaurantId ?? RESTAURANT_ID;

  if (await isDatabaseAvailable()) {
    const existing = await prisma.purchaseOrder.findUnique({
      where: { clientMutationId: params.clientMutationId },
    });
    if (existing) {
      return {
        idempotentDuplicate: true,
        order: {
          id: existing.id,
          restaurantId: existing.restaurantId,
          supplierId: existing.supplierId,
          status: existing.status,
          whatsappMessage: existing.whatsappMessage,
          estimatedTotalBs: Number(existing.estimatedTotalBs),
          items: Array.isArray(existing.itemsJson)
            ? (existing.itemsJson as unknown as WhatsAppOrderItem[])
            : [],
          clientMutationId: existing.clientMutationId ?? undefined,
          createdAt: existing.createdAt.toISOString(),
        },
      };
    }

    const saved = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.upsert({
        where: { id: params.id },
        update: {
          status: params.status,
          whatsappMessage: params.whatsappMessage,
          estimatedTotalBs: params.estimatedTotalBs,
          itemsJson: params.items as unknown as Prisma.InputJsonValue,
          clientMutationId: params.clientMutationId,
        },
        create: {
          id: params.id,
          restaurantId,
          supplierId: params.supplierId,
          status: params.status,
          whatsappMessage: params.whatsappMessage,
          estimatedTotalBs: params.estimatedTotalBs,
          itemsJson: params.items as unknown as Prisma.InputJsonValue,
          clientMutationId: params.clientMutationId,
        },
      });

      if (params.status === "RECEIVED") {
        for (const item of params.items) {
          const ing = await tx.ingredient.findUnique({
            where: { id: item.ingredientId },
          });
          if (!ing) continue;
          const nextStock = roundQty(
            Number(ing.currentStock) + item.quantity
          );
          await tx.ingredient.update({
            where: { id: ing.id },
            data: { currentStock: nextStock },
          });
          await tx.inventoryMovement.create({
            data: {
              ingredientId: ing.id,
              type: "PURCHASE",
              quantityDelta: item.quantity,
              costImpactBs: item.subtotalBs,
              referenceId: po.id,
              clientMutationId: `${params.clientMutationId}:${ing.id}`,
            },
          });
        }
      }

      return po;
    });

    return {
      idempotentDuplicate: false,
      order: {
        id: saved.id,
        restaurantId: saved.restaurantId,
        supplierId: saved.supplierId,
        status: saved.status,
        whatsappMessage: saved.whatsappMessage,
        estimatedTotalBs: Number(saved.estimatedTotalBs),
        items: params.items,
        clientMutationId: params.clientMutationId,
        createdAt: saved.createdAt.toISOString(),
      },
    };
  }

  const mem = getMemoryStore();
  if (mem.processedMutationIds.has(params.clientMutationId)) {
    const found = mem.purchaseOrders.find((p) => p.id === params.id);
    if (found) return { idempotentDuplicate: true, order: found };
  }
  mem.processedMutationIds.add(params.clientMutationId);

  if (params.status === "RECEIVED") {
    for (const item of params.items) {
      const ing = mem.ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        ing.currentStock = roundQty(ing.currentStock + item.quantity);
        ing.updatedAt = new Date().toISOString();
      }
    }
  }

  const order: PurchaseOrderRecord = {
    id: params.id,
    restaurantId,
    supplierId: params.supplierId,
    status: params.status,
    whatsappMessage: params.whatsappMessage,
    estimatedTotalBs: params.estimatedTotalBs,
    items: params.items,
    clientMutationId: params.clientMutationId,
    createdAt: new Date().toISOString(),
  };

  const idx = mem.purchaseOrders.findIndex((p) => p.id === params.id);
  if (idx >= 0) {
    mem.purchaseOrders[idx] = order;
  } else {
    mem.purchaseOrders.unshift(order);
  }

  return { idempotentDuplicate: false, order };
}

export async function updateDemoSubscription(params: {
  restaurantId?: string;
  plan: "BASE" | "PRO";
  billingCycle: "MONTHLY" | "ANNUAL_10X12";
  isAseracMember: boolean;
  activateDemo: boolean;
}): Promise<SeedRestaurant> {
  const restaurantId = params.restaurantId ?? RESTAURANT_ID;

  if (await isDatabaseAvailable()) {
    const updated = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        plan: params.plan,
        billingCycle: params.billingCycle,
        isAseracMember: params.isAseracMember,
        subscriptionStatus: params.activateDemo ? "ACTIVE_DEMO" : "TRIAL",
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      zone: updated.zone,
      plan: updated.plan,
      billingCycle: updated.billingCycle,
      subscriptionStatus: updated.subscriptionStatus,
      taxRegime: updated.taxRegime,
      isAseracMember: updated.isAseracMember,
    };
  }

  const mem = getMemoryStore();
  mem.restaurant = {
    ...mem.restaurant,
    plan: params.plan,
    billingCycle: params.billingCycle,
    isAseracMember: params.isAseracMember,
    subscriptionStatus: params.activateDemo ? "ACTIVE_DEMO" : "TRIAL",
  };
  return mem.restaurant;
}
