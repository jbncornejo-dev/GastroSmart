import { NextRequest, NextResponse } from "next/server";
import {
  createRecipeTransactional,
  processPurchaseOrderTransactional,
  recordQuickPurchaseTransactional,
  recordSaleTransactional,
  recordWasteTransactional,
  upsertIngredientTransactional,
} from "@/lib/services/inventory-engine";
import {
  ingredientCreateSchema,
  purchaseOrderActionSchema,
  quickPurchaseSchema,
  recipeCreateSchema,
  saleCreateSchema,
  syncBatchSchema,
  wasteCreateSchema,
} from "@/lib/validators";

/**
 * Endpoint idempotente de sincronización Offline-First.
 * Procesa lotes de mutaciones en orden cronológico usando `clientMutationId`
 * para evitar duplicados ante reconexiones intermitentes en cocina.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = syncBatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Lote de sincronización inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const results: Array<{ clientMutationId: string; status: string }> = [];

    for (const mut of parsed.data.mutations) {
      if (mut.type === "SALE_POS") {
        const p = saleCreateSchema.parse({
          ...mut.payload,
          clientMutationId: mut.clientMutationId,
        });
        await recordSaleTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      } else if (mut.type === "WASTE_RECORD") {
        const p = wasteCreateSchema.parse({
          ...mut.payload,
          clientMutationId: mut.clientMutationId,
        });
        await recordWasteTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      } else if (mut.type === "QUICK_PURCHASE") {
        const p = quickPurchaseSchema.parse({
          ...mut.payload,
          clientMutationId: mut.clientMutationId,
        });
        await recordQuickPurchaseTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      } else if (mut.type === "INGREDIENT_UPSERT") {
        const p = ingredientCreateSchema.parse(mut.payload);
        await upsertIngredientTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      } else if (mut.type === "RECIPE_CREATE") {
        const p = recipeCreateSchema.parse(mut.payload);
        await createRecipeTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      } else if (
        mut.type === "PURCHASE_ORDER_SENT" ||
        mut.type === "PURCHASE_ORDER_RECEIVED"
      ) {
        const p = purchaseOrderActionSchema.parse({
          ...mut.payload,
          clientMutationId: mut.clientMutationId,
        });
        await processPurchaseOrderTransactional(p);
        results.push({ clientMutationId: mut.clientMutationId, status: "SYNCED" });
      }
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json(
      { error: "Error sincronizando mutaciones locales" },
      { status: 500 }
    );
  }
}
