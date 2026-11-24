import { PrismaClient } from "@prisma/client";
import {
  SEED_RESTAURANT,
  SEED_USERS,
  SEED_SUPPLIERS,
  SEED_INGREDIENTS,
  SEED_RECIPES,
  SEED_WASTES,
  SEED_SALES,
} from "../src/lib/seed-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.restaurant.upsert({
    where: { id: SEED_RESTAURANT.id },
    update: {
      name: SEED_RESTAURANT.name,
      zone: SEED_RESTAURANT.zone,
      plan: SEED_RESTAURANT.plan,
      billingCycle: SEED_RESTAURANT.billingCycle,
      subscriptionStatus: SEED_RESTAURANT.subscriptionStatus,
      taxRegime: SEED_RESTAURANT.taxRegime,
      isAseracMember: SEED_RESTAURANT.isAseracMember,
    },
    create: {
      id: SEED_RESTAURANT.id,
      name: SEED_RESTAURANT.name,
      zone: SEED_RESTAURANT.zone,
      plan: SEED_RESTAURANT.plan,
      billingCycle: SEED_RESTAURANT.billingCycle,
      subscriptionStatus: SEED_RESTAURANT.subscriptionStatus,
      taxRegime: SEED_RESTAURANT.taxRegime,
      isAseracMember: SEED_RESTAURANT.isAseracMember,
    },
  });

  for (const u of SEED_USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        id: u.id,
        restaurantId: u.restaurantId,
        name: u.name,
        email: u.email,
        passwordHash: "demo-gastrosmart-2026",
        role: u.role,
      },
    });
  }

  for (const s of SEED_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        category: s.category,
        whatsappPhone: s.whatsappPhone,
        notes: s.notes ?? null,
      },
      create: {
        id: s.id,
        restaurantId: s.restaurantId,
        name: s.name,
        category: s.category,
        whatsappPhone: s.whatsappPhone,
        notes: s.notes ?? null,
      },
    });
  }

  for (const ing of SEED_INGREDIENTS) {
    await prisma.ingredient.upsert({
      where: { id: ing.id },
      update: {
        name: ing.name,
        category: ing.category,
        location: ing.location,
        unit: ing.unit,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        optimalStock: ing.optimalStock,
        unitCostBs: ing.unitCostBs,
        defaultSupplierId: ing.defaultSupplierId,
      },
      create: {
        id: ing.id,
        restaurantId: ing.restaurantId,
        name: ing.name,
        category: ing.category,
        location: ing.location,
        unit: ing.unit,
        currentStock: ing.currentStock,
        minStock: ing.minStock,
        optimalStock: ing.optimalStock,
        unitCostBs: ing.unitCostBs,
        defaultSupplierId: ing.defaultSupplierId,
      },
    });

    const allSupplierIds = Array.from(
      new Set([ing.defaultSupplierId, ...ing.alternativeSupplierIds])
    );
    for (const supId of allSupplierIds) {
      await prisma.ingredientSupplier.upsert({
        where: {
          ingredientId_supplierId: {
            ingredientId: ing.id,
            supplierId: supId,
          },
        },
        update: {},
        create: {
          ingredientId: ing.id,
          supplierId: supId,
        },
      });
    }
  }

  for (const rec of SEED_RECIPES) {
    await prisma.recipe.upsert({
      where: { id: rec.id },
      update: {
        name: rec.name,
        category: rec.category,
        salePriceBs: rec.salePriceBs,
        isActive: rec.isActive,
      },
      create: {
        id: rec.id,
        restaurantId: rec.restaurantId,
        name: rec.name,
        category: rec.category,
        salePriceBs: rec.salePriceBs,
        isActive: rec.isActive,
      },
    });

    for (const ri of rec.ingredients) {
      await prisma.recipeIngredient.upsert({
        where: {
          recipeId_ingredientId: {
            recipeId: rec.id,
            ingredientId: ri.ingredientId,
          },
        },
        update: { quantityRequired: ri.quantityRequired },
        create: {
          id: ri.id,
          recipeId: rec.id,
          ingredientId: ri.ingredientId,
          quantityRequired: ri.quantityRequired,
        },
      });
    }
  }

  for (const w of SEED_WASTES) {
    await prisma.wasteRecord.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        restaurantId: w.restaurantId,
        ingredientId: w.ingredientId,
        quantityLost: w.quantityLost,
        reason: w.reason,
        monetaryLossBs: w.monetaryLossBs,
        notes: w.notes,
        clientMutationId: `seed-${w.id}`,
      },
    });
  }

  for (const sale of SEED_SALES) {
    await prisma.saleRecord.upsert({
      where: { id: sale.id },
      update: {},
      create: {
        id: sale.id,
        restaurantId: sale.restaurantId,
        recipeId: sale.recipeId,
        quantitySold: sale.quantitySold,
        totalRevenueBs: sale.totalRevenueBs,
        totalIngredientCostBs: sale.totalIngredientCostBs,
        source: sale.source,
        clientMutationId: `seed-${sale.id}`,
      },
    });
  }

  console.log("Seed de GastroSmart (El Solar Cochabambino) completado.");
}

main()
  .catch((e) => {
    console.error("Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
