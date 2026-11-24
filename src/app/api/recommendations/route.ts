/**
 * Route Handler: /api/recommendations
 *
 * Orquesta en el servidor la obtención de sugerencias operativas de reposición
 * basadas en señales de demanda y clima local de Cochabamba vía `demand-signals.ts`
 * (consulta temporal a Google normalizada en backend).
 *
 * La respuesta enviada al cliente contiene exclusivamente factores numéricos y
 * textos operativos neutros; nunca expone menciones a IA, Gemini ni Google.
 */

import { NextResponse } from "next/server";
import { getFullBootstrapState } from "@/lib/services/inventory-engine";
import { getReplenishmentDemandSignals } from "@/lib/services/demand-signals";

export async function GET() {
  try {
    const state = await getFullBootstrapState();
    const result = await getReplenishmentDemandSignals(
      state.ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        currentStock: i.currentStock,
        minStock: i.minStock,
        optimalStock: i.optimalStock,
        unit: i.unit,
      }))
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/recommendations error:", error);
    return NextResponse.json(
      { error: "No se pudieron calcular las sugerencias de reposición" },
      { status: 500 }
    );
  }
}
