import { NextRequest, NextResponse } from "next/server";
import {
  getFullBootstrapState,
  updateDemoSubscription,
} from "@/lib/services/inventory-engine";
import { subscriptionDemoSchema } from "@/lib/validators";

/**
 * Vista demostrativa de suscripción QR Simple (sin cobro real ni webhooks bancarios).
 */
export async function GET() {
  const state = await getFullBootstrapState();
  return NextResponse.json({
    restaurant: state.restaurant,
    demoNotice: "Entorno de prueba — sin cobro real.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = subscriptionDemoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateDemoSubscription({
      plan: parsed.data.plan,
      billingCycle: parsed.data.billingCycle,
      isAseracMember: parsed.data.isAseracMember,
      activateDemo: parsed.data.action === "SIMULATE_PAYMENT",
    });

    return NextResponse.json({
      ok: true,
      restaurant: updated,
      receiptId: `DEMO-CBBA-${Date.now().toString().slice(-6)}`,
      demoNotice: "Entorno de prueba — sin cobro real.",
    });
  } catch (error) {
    console.error("POST /api/subscription/demo error:", error);
    return NextResponse.json(
      { error: "Error actualizando vista de suscripción demo" },
      { status: 500 }
    );
  }
}
