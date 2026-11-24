import { NextRequest, NextResponse } from "next/server";
import {
  getFullBootstrapState,
  processPurchaseOrderTransactional,
} from "@/lib/services/inventory-engine";
import { purchaseOrderActionSchema } from "@/lib/validators";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    return NextResponse.json({
      purchaseOrders: state.purchaseOrders,
      suppliers: state.suppliers,
    });
  } catch (error) {
    console.error("GET /api/purchase-orders error:", error);
    return NextResponse.json(
      { error: "Error cargando órdenes de compra" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = purchaseOrderActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos de orden inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await processPurchaseOrderTransactional(parsed.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("POST /api/purchase-orders error:", error);
    return NextResponse.json(
      { error: "Error procesando orden de compra" },
      { status: 500 }
    );
  }
}
