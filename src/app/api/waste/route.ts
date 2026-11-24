import { NextRequest, NextResponse } from "next/server";
import {
  getFullBootstrapState,
  recordWasteTransactional,
} from "@/lib/services/inventory-engine";
import { wasteCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    return NextResponse.json({ wastes: state.wastes });
  } catch (error) {
    console.error("GET /api/waste error:", error);
    return NextResponse.json(
      { error: "Error obteniendo mermas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = wasteCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de merma inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await recordWasteTransactional(parsed.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/waste error:", error);
    return NextResponse.json(
      { error: "Error registrando merma" },
      { status: 500 }
    );
  }
}
