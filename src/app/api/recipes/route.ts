import { NextRequest, NextResponse } from "next/server";
import {
  createRecipeTransactional,
  getFullBootstrapState,
} from "@/lib/services/inventory-engine";
import { recipeCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    return NextResponse.json({ recipes: state.recipes });
  } catch (error) {
    console.error("GET /api/recipes error:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las recetas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = recipeCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de receta inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createRecipeTransactional(parsed.data);
    return NextResponse.json({ ok: true, recipe: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recipes error:", error);
    return NextResponse.json(
      { error: "Error creando receta" },
      { status: 500 }
    );
  }
}
