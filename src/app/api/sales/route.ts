import { NextRequest, NextResponse } from "next/server";
import {
  getFullBootstrapState,
  recordSaleTransactional,
} from "@/lib/services/inventory-engine";
import { saleCreateSchema } from "@/lib/validators";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    return NextResponse.json({ sales: state.sales });
  } catch (error) {
    console.error("GET /api/sales error:", error);
    return NextResponse.json(
      { error: "Error obteniendo historial de ventas" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = saleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de venta inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await recordSaleTransactional(parsed.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales error:", error);
    return NextResponse.json(
      { error: "Error registrando venta" },
      { status: 500 }
    );
  }
}
