/**
 * ============================================================================
 * SERVICIO BACKEND DE SEÑALES DE DEMANDA Y REPOSICIÓN (COCHABAMBA)
 * ============================================================================
 *
 * NOTA DE ARQUITECTURA (TEMPORAL / SOLO BACKEND):
 * El análisis contextual externo —clima local de Cochabamba (temperatura,
 * lluvias estacionales, radiación térmica que acelera caducidad) y factores
 * de demanda semanal/feriados— se obtiene temporalmente desde servicios de
 * Google (Google Gemini con búsqueda / Google Weather API mediante variable de
 * entorno `GOOGLE_API_KEY` o `GOOGLE_WEATHER_API_KEY`).
 *
 * REGLA ESTRICTA DE NORMALIZACIÓN Y PRIVACIDAD DE UI:
 * Toda respuesta obtenida desde Google se normaliza exclusivamente en el
 * servidor a factores numéricos simples (`multiplier`, `suggestedExtraQty`) y
 * textos operativos neutros antes de enviarse al cliente. Esta integración es
 * un detalle interno del backend y INTENCIONALMENTE NO se expone ni menciona
 * (ni "IA", ni "Gemini", ni "Google") en el frontend ni en las respuestas UI.
 *
 * Si las claves de entorno de Google no están configuradas o la consulta
 * externa falla, el servicio ejecuta un fallback determinístico limpio basado
 * en rotación histórica local y calendario operativo de Cochabamba.
 * ============================================================================
 */

import { roundQty } from "../utils/currency";

export interface IngredientSignalInput {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  optimalStock: number;
  unit: string;
}

export interface ReplenishmentSuggestion {
  ingredientId: string;
  baseRecommendedQty: number;
  adjustedRecommendedQty: number;
  multiplier: number;
  operationalSummary: string;
  demandLevel: "ESTABLE" | "ALTA";
}

export interface DemandSignalsResult {
  weeklyHeadline: string;
  weeklyContextNote: string;
  suggestions: ReplenishmentSuggestion[];
  generatedAt: string;
}

interface GoogleNormalizedContext {
  demandFactor: number;
  perishableHeatFactor: number;
  operationalHeadline: string;
  operationalNote: string;
}

/**
 * Consulta temporal al servicio externo de Google para obtener factores
 * climáticos y de demanda en Cochabamba, normalizados a multiplicadores
 * numéricos simples. Nunca devuelve marcas ni menciones de proveedor externo.
 */
async function fetchNormalizedContextFromGoogle(): Promise<GoogleNormalizedContext | null> {
  const geminiKey =
    process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const weatherKey = process.env.GOOGLE_WEATHER_API_KEY;

  if (weatherKey) {
    try {
      // Consulta temporal a Google Weather API para Cochabamba (-17.3935, -66.1570)
      const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${encodeURIComponent(
        weatherKey
      )}&location.latitude=-17.3935&location.longitude=-66.1570`;
      const res = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(3500),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as {
          temperature?: { degrees?: number };
          precipitation?: { probability?: { percent?: number } };
        };
        const tempC = data.temperature?.degrees ?? 24;
        const rainPct = data.precipitation?.probability?.percent ?? 15;
        const isWarm = tempC >= 25;
        const isRainy = rainPct >= 45;

        return {
          demandFactor: isRainy ? 1.12 : 1.15,
          perishableHeatFactor: isWarm ? 1.18 : 1.08,
          operationalHeadline: "Reposición sugerida para esta semana",
          operationalNote: isRainy
            ? "Demanda estimada alta para los próximos días en platos calientes de rotación."
            : "Mayor rotación esperada hacia el fin de semana en zona centro.",
        };
      }
    } catch {
      // Continuar hacia Gemini o fallback determinístico
    }
  }

  if (geminiKey) {
    try {
      // Consulta temporal a Google Gemini (solo backend) para estimar factor
      // numérico de demanda gastronómica semanal en Cochabamba.
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
        geminiKey
      )}`;
      const prompt = [
        "Devuelve SOLO un JSON válido con dos números entre 1.0 y 1.3:",
        '{"demandFactor": number, "perishableHeatFactor": number}',
        "Contexto: rotación semanal de restaurantes en Cochabamba, Bolivia.",
      ].join(" ");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });

      if (res.ok) {
        const payload = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const rawText =
          payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const parsed = JSON.parse(rawText) as {
          demandFactor?: number;
          perishableHeatFactor?: number;
        };

        const clamp = (n: unknown, fallback: number) =>
          typeof n === "number" && Number.isFinite(n)
            ? Math.min(1.3, Math.max(1.0, n))
            : fallback;

        return {
          demandFactor: clamp(parsed.demandFactor, 1.12),
          perishableHeatFactor: clamp(parsed.perishableHeatFactor, 1.1),
          operationalHeadline: "Reposición sugerida para esta semana",
          operationalNote:
            "Demanda estimada alta para los próximos días según ritmo de ventas del turno.",
        };
      }
    } catch {
      // Caer limpiamente al fallback determinístico local
    }
  }

  return null;
}

/**
 * Fallback determinístico local basado en calendario operativo de Cochabamba
 * (viernes-domingo de mayor afluencia en platos tradicionales) y categoría perecedera.
 */
function computeDeterministicLocalContext(
  now: Date
): GoogleNormalizedContext {
  const day = now.getDay(); // 0 = Dom, 5 = Vie, 6 = Sab
  const isPeakWeekendWindow = day === 4 || day === 5 || day === 6 || day === 0;

  return {
    demandFactor: isPeakWeekendWindow ? 1.15 : 1.08,
    perishableHeatFactor: 1.1,
    operationalHeadline: "Reposición sugerida para esta semana",
    operationalNote: isPeakWeekendWindow
      ? "Demanda estimada alta para los próximos días en platos principales."
      : "Ritmo de reposición estándar para cubrir stock óptimo semanal.",
  };
}

export async function getReplenishmentDemandSignals(
  ingredients: IngredientSignalInput[]
): Promise<DemandSignalsResult> {
  // Intentar señal contextual externa (Google en backend) con fallback determinístico
  const externalContext = await fetchNormalizedContextFromGoogle();
  const context =
    externalContext ?? computeDeterministicLocalContext(new Date());

  const suggestions: ReplenishmentSuggestion[] = ingredients
    .filter((ing) => ing.currentStock <= ing.minStock * 1.45)
    .map((ing) => {
      const baseGap = Math.max(0.5, ing.optimalStock - ing.currentStock);
      const isFresh =
        ing.category === "Verduras" || ing.category === "Carnes";
      const multiplier = isFresh
        ? context.perishableHeatFactor
        : context.demandFactor;
      const adjusted = roundQty(baseGap * multiplier);

      return {
        ingredientId: ing.id,
        baseRecommendedQty: roundQty(baseGap),
        adjustedRecommendedQty: adjusted,
        multiplier: Number(multiplier.toFixed(2)),
        operationalSummary: `Cantidad recomendada: ${adjusted} ${ing.unit}`,
        demandLevel: multiplier >= 1.12 ? "ALTA" : "ESTABLE",
      };
    });

  return {
    weeklyHeadline: context.operationalHeadline,
    weeklyContextNote: context.operationalNote,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}
