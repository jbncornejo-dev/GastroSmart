import { NextRequest, NextResponse } from "next/server";
import {
  getFullBootstrapState,
  recordQuickPurchaseTransactional,
  upsertIngredientTransactional,
} from "@/lib/services/inventory-engine";
import {
  ingredientCreateSchema,
  quickPurchaseSchema,
} from "@/lib/validators";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    return NextResponse.json({
      ingredients: state.ingredients,
      suppliers: state.suppliers,
      storageMode: state.storageMode,
    });
  } catch (error) {
    console.error("GET /api/ingredients error:", error);
    return NextResponse.json(
      { error: "No se pudo cargar el inventario" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if ("quantityAdded" in body) {
      const parsed = quickPurchaseSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Datos inválidos", details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const res = await recordQuickPurchaseTransactional(parsed.data);
      return NextResponse.json({ ok: true, ...res });
    }

    const parsed = ingredientCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de insumo inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const saved = await upsertIngredientTransactional(parsed.data);
    return NextResponse.json({ ok: true, ingredient: saved }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ingredients error:", error);
    return NextResponse.json(
      { error: "Error guardando insumo" },
      { status: 500 }
    );
  }
}
