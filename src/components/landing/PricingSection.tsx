"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { NeutralCard, PillButton, CategoryTag } from "@/components/ui";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  const baseMonthly = 100;
  const proMonthly = 140;

  const baseDisplay = annual ? Math.round((baseMonthly * 10) / 12) : baseMonthly;
  const proDisplay = annual ? Math.round((proMonthly * 10) / 12) : proMonthly;

  return (
    <section id="planes" className="py-20 border-t border-[#f2f2f3]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <CategoryTag>Planes transparentes en Bolivianos</CategoryTag>
            <h2 className="heading-md text-[#17191c] mt-2">
              Control operativo sin contratos complejos
            </h2>
            <p className="text-[17px] text-[#777b86] mt-3 max-w-xl">
              Incluye prueba piloto gratuita “Cero Riesgo” de 30 días sin cobro
              y descuento gremial ASERAC (20% los primeros 3 meses + carga
              asistida de 15 recetas).
            </p>
          </div>

          <div className="inline-flex items-center gap-1 bg-[#f2f2f3] p-1 rounded-full self-start">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors cursor-pointer ${
                !annual
                  ? "bg-[#17191c] text-[#ffffff]"
                  : "text-[#777b86] hover:text-[#17191c]"
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`px-4 py-2 rounded-full text-[14px] font-medium transition-colors cursor-pointer ${
                annual
                  ? "bg-[#17191c] text-[#ffffff]"
                  : "text-[#777b86] hover:text-[#17191c]"
              }`}
            >
              Anual 10×12 (2 meses gratis)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NeutralCard className="p-8 flex flex-col justify-between">
            <div>
              <CategoryTag>Cafeterías, pensiones y cocinas pequeñas</CategoryTag>
              <div className="flex items-baseline justify-between mt-3">
                <h3 className="text-[26px] font-medium text-[#17191c]">
                  Plan Base
                </h3>
                <div className="text-right tabular-nums">
                  <span className="text-[32px] font-medium text-[#17191c]">
                    Bs {baseDisplay}
                  </span>
                  <span className="text-[15px] text-[#777b86]"> / mes</span>
                  {annual && (
                    <div className="text-[13px] text-[#777b86]">
                      Facturado Bs {baseMonthly * 10} / año
                    </div>
                  )}
                </div>
              </div>

              <ul className="mt-8 space-y-3 text-[15px] text-[#17191c]">
                {[
                  "Núcleo completo offline-first sin depender de internet",
                  "Inventario perecedero en tiempo real con alertas de stock mínimo",
                  "Fichas técnicas de recetas con descuento automático por gramaje",
                  "Registro táctil de mermas en Bs (<10 segundos)",
                  "Órdenes de compra agrupadas por proveedor listas para WhatsApp",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="w-4 h-4 text-[#17191c] shrink-0 mt-1"
                      strokeWidth={1.5}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#17191c]/10 flex items-center justify-between gap-4">
              <span className="text-[13px] text-[#777b86]">
                Piloto 30 días sin cobro
              </span>
              <PillButton href="/suscripcion" variant="ghost">
                Abrir vista demo QR
              </PillButton>
            </div>
          </NeutralCard>

          <NeutralCard className="p-8 flex flex-col justify-between border border-[#17191c]/12">
            <div>
              <CategoryTag>Restaurantes medianos de mayor rotación</CategoryTag>
              <div className="flex items-baseline justify-between mt-3">
                <h3 className="text-[26px] font-medium text-[#17191c]">
                  Plan Pro
                </h3>
                <div className="text-right tabular-nums">
                  <span className="text-[32px] font-medium text-[#17191c]">
                    Bs {proDisplay}
                  </span>
                  <span className="text-[15px] text-[#777b86]"> / mes</span>
                  {annual && (
                    <div className="text-[13px] text-[#777b86]">
                      Facturado Bs {proMonthly * 10} / año
                    </div>
                  )}
                </div>
              </div>

              <ul className="mt-8 space-y-3 text-[15px] text-[#17191c]">
                {[
                  "Todo lo incluido en el Plan Base",
                  "Sincronización automática en la nube y acceso remoto para dueños",
                  "Reportes históricos comparativos de costos y rentabilidad",
                  "Integración POS vía webhook para descuento de platos en vivo",
                  "Exportación CSV para control interno bajo Régimen General o RTS",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="w-4 h-4 text-[#17191c] shrink-0 mt-1"
                      strokeWidth={1.5}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#17191c]/10 flex items-center justify-between gap-4">
              <span className="text-[13px] text-[#777b86]">
                Aplica 20% dto. alianza ASERAC
              </span>
              <PillButton href="/suscripcion" variant="filled">
                Probar Plan Pro
              </PillButton>
            </div>
          </NeutralCard>
        </div>
      </div>
    </section>
  );
}
