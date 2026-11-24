"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Printer } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb } from "@/lib/offline/db";
import { updateLocalRestaurantSubscription } from "@/lib/offline/sync-engine";
import {
  CategoryTag,
  Modal,
  NeutralCard,
  PeachCard,
  PillButton,
} from "@/components/ui";
import { formatBs } from "@/lib/utils/currency";

export default function SuscripcionPage() {
  const restaurant = useLiveQuery(() =>
    offlineDb.restaurant.toArray().then((r) => r[0])
  );

  const [selectedPlan, setSelectedPlan] = useState<"BASE" | "PRO">("PRO");
  const [annual, setAnnual] = useState(false);
  const [aserac, setAserac] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const basePrice = selectedPlan === "BASE" ? 100 : 140;
  const cycleMultiplier = annual ? 10 : 1;
  const rawTotal = basePrice * cycleMultiplier;
  const finalAmountBs = aserac ? Math.round(rawTotal * 0.8) : rawTotal;

  useEffect(() => {
    if (!qrModalOpen) return;
    const payload = `GASTROSMART|DEMO-QR-SIMPLE|PLAN:${selectedPlan}|CICLO:${
      annual ? "ANUAL_10X12" : "MENSUAL"
    }|MONTO:BOB_${finalAmountBs}|SIN_COBRO_REAL`;

    QRCode.toString(payload, {
      type: "svg",
      margin: 1,
      width: 220,
      color: { dark: "#17191c", light: "#ffffff" },
    })
      .then((svg) => setQrSvg(svg))
      .catch(() => setQrSvg(""));
  }, [qrModalOpen, selectedPlan, annual, finalAmountBs]);

  async function openQrPreview(plan: "BASE" | "PRO") {
    setSelectedPlan(plan);
    setReceiptId(null);
    setQrModalOpen(true);
  }

  async function handleSimulatePayment() {
    setConfirming(true);
    const billingCycle = annual ? "ANNUAL_10X12" : "MONTHLY";
    const generatedReceipt = `DEMO-CBBA-${Date.now().toString().slice(-6)}`;

    try {
      await updateLocalRestaurantSubscription({
        plan: selectedPlan,
        billingCycle,
        isAseracMember: aserac,
        subscriptionStatus: "ACTIVE_DEMO",
      });

      const res = await fetch("/api/subscription/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle,
          isAseracMember: aserac,
          action: "SIMULATE_PAYMENT",
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { receiptId?: string };
        setReceiptId(data.receiptId ?? generatedReceipt);
      } else {
        setReceiptId(generatedReceipt);
      }
    } catch {
      setReceiptId(generatedReceipt);
    } finally {
      setConfirming(false);
    }
  }

  const isDemoActive = restaurant?.subscriptionStatus === "ACTIVE_DEMO";

  return (
    <div className="space-y-8">
      <div>
        <CategoryTag>Módulo 7 · Suscripción y QR Simple (Vista de prueba)</CategoryTag>
        <h1 className="heading-md text-[#17191c] mt-1">
          Planes GastroSmart en Bolivianos
        </h1>
        <p className="text-[16px] text-[#777b86] mt-1">
          Módulo demostrativo de facturación por QR Simple. Entorno de prueba —
          sin cobro real.
        </p>
      </div>

      {/* Unica PeachCard de la vista */}
      <PeachCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[14px] text-[#5d2a1a]/80">
            Estado actual de {restaurant?.name ?? "El Solar Cochabambino"}
          </p>
          <p className="font-serif-editorial text-[26px] text-[#5d2a1a] mt-0.5">
            {isDemoActive
              ? `Suscripción Activa (Demo) · Plan ${restaurant?.plan ?? selectedPlan}`
              : `Prueba piloto "Cero Riesgo" (30 días sin cobro)`}
          </p>
        </div>
        <span className="text-[13px] text-[#5d2a1a]/80">
          Entorno de prueba — sin cobro real
        </span>
      </PeachCard>

      {/* Controles de ciclo anual 10x12 y alianza ASERAC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f2f2f3]">
        <div className="inline-flex items-center gap-1 bg-[#f2f2f3] p-1 rounded-full self-start">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-4 py-2 rounded-full text-[14px] font-medium cursor-pointer transition-colors ${
              !annual
                ? "bg-[#17191c] text-[#ffffff]"
                : "text-[#777b86] hover:text-[#17191c]"
            }`}
          >
            Pago mensual
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-4 py-2 rounded-full text-[14px] font-medium cursor-pointer transition-colors ${
              annual
                ? "bg-[#17191c] text-[#ffffff]"
                : "text-[#777b86] hover:text-[#17191c]"
            }`}
          >
            Plan Anual 10×12 (2 meses gratis)
          </button>
        </div>

        <label className="inline-flex items-center gap-3 cursor-pointer text-[14px] text-[#17191c]">
          <input
            type="checkbox"
            checked={aserac}
            onChange={(e) => setAserac(e.target.checked)}
            className="w-4 h-4 accent-[#17191c] rounded"
          />
          <span>
            Afiliado gremial ASERAC (20% dto. los primeros 3 meses + carga de 15
            recetas)
          </span>
        </label>
      </div>

      {/* Selector de Planes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(
          [
            {
              key: "BASE" as const,
              title: "Plan Base",
              tag: "Cafeterías, pensiones y cocinas pequeñas",
              price: 100,
              features: [
                "Inventario perecedero en tiempo real (offline-first)",
                "Recetas estándar con descuento automático",
                "Registro táctil de mermas en Bs",
                "Órdenes agrupadas por proveedor para WhatsApp",
              ],
            },
            {
              key: "PRO" as const,
              title: "Plan Pro",
              tag: "Restaurantes medianos con mayor rotación",
              price: 140,
              features: [
                "Todo lo incluido en el Plan Base",
                "Sincronización en la nube y acceso multi-dispositivo",
                "Reportes históricos de costos y exportación CSV",
                "Integración POS vía webhook",
              ],
            },
          ] as const
        ).map((plan) => {
          const totalForPlan =
            (aserac ? Math.round(plan.price * 0.8) : plan.price) *
            (annual ? 10 : 1);
          return (
            <NeutralCard
              key={plan.key}
              className="p-7 flex flex-col justify-between"
            >
              <div>
                <CategoryTag>{plan.tag}</CategoryTag>
                <div className="flex items-baseline justify-between mt-2">
                  <h2 className="text-[24px] font-medium text-[#17191c]">
                    {plan.title}
                  </h2>
                  <div className="text-right tabular-nums">
                    <span className="text-[30px] font-medium text-[#17191c]">
                      Bs {totalForPlan}
                    </span>
                    <span className="text-[14px] text-[#777b86]">
                      {annual ? " / año" : " / mes"}
                    </span>
                  </div>
                </div>

                <ul className="mt-6 space-y-2.5 text-[15px] text-[#17191c]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check
                        className="w-4 h-4 text-[#17191c] shrink-0 mt-1"
                        strokeWidth={1.5}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-5 border-t border-[#17191c]/10 flex items-center justify-between">
                <span className="text-[13px] text-[#777b86]">
                  QR Simple (Vista de prueba)
                </span>
                <PillButton
                  variant={plan.key === "PRO" ? "filled" : "ghost"}
                  onClick={() => void openQrPreview(plan.key)}
                >
                  Generar QR Simple (Demo)
                </PillButton>
              </div>
            </NeutralCard>
          );
        })}
      </div>

      {/* Modal de Pago por QR Simple (Modo Prueba) */}
      <Modal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Pago mediante QR Simple (Vista de prueba)"
        subtitle="Entorno de prueba — sin cobro real."
      >
        {!receiptId ? (
          <div className="space-y-5">
            <div className="bg-[#fafafb] border border-[#f2f2f3] rounded-[20px] p-6 flex flex-col items-center text-center">
              {qrSvg ? (
                <div
                  className="w-52 h-52 bg-[#ffffff] p-3 rounded-[16px] border border-[#f2f2f3]"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="w-52 h-52 bg-[#f2f2f3] rounded-[16px]" />
              )}

              <div className="mt-4 text-[26px] font-medium text-[#17191c] tabular-nums">
                {formatBs(finalAmountBs)}
              </div>
              <div className="text-[14px] text-[#777b86] mt-1">
                Concepto: GastroSmart Plan {selectedPlan}{" "}
                {annual ? "(Anual 10×12)" : "(Mensual)"}
                {aserac ? " · Dto. ASERAC 20%" : ""}
              </div>
              <div className="text-[12px] text-[#979799] mt-2">
                Vigencia simulada: 24 horas · Entorno de prueba — sin cobro real
              </div>
            </div>

            <p className="text-[13px] text-[#777b86] text-center">
              Vista de demostración. Esta pasarela QR Simple no realiza cobros
              reales ni conecta con entidades bancarias.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <PillButton
                variant="ghost"
                onClick={() => setQrModalOpen(false)}
              >
                Cerrar
              </PillButton>
              <PillButton
                variant="filled"
                onClick={() => void handleSimulatePayment()}
                disabled={confirming}
              >
                {confirming
                  ? "Actualizando..."
                  : "Simular confirmación de pago"}
              </PillButton>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-[#fafafb] border border-[#f2f2f3] rounded-[20px] p-6 space-y-3">
              <CategoryTag>Comprobante de prueba · Sin validez fiscal</CategoryTag>
              <h4 className="text-[20px] font-medium text-[#17191c]">
                Suscripción actualizada a Activa (Demo)
              </h4>
              <div className="text-[14px] text-[#777b86] space-y-1 tabular-nums">
                <p>Comprobante N.º: {receiptId}</p>
                <p>Restaurante: {restaurant?.name ?? "El Solar Cochabambino"}</p>
                <p>
                  Plan seleccionado: {selectedPlan} (
                  {annual ? "Anual 10×12" : "Mensual"})
                </p>
                <p>Monto simulado: {formatBs(finalAmountBs)}</p>
                <p>Estado: Activa (Demo) — Entorno de prueba sin cobro real</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 no-print">
              <PillButton variant="ghost" onClick={() => window.print()}>
                <Printer className="w-4 h-4" strokeWidth={1.5} />
                Imprimir comprobante
              </PillButton>
              <PillButton
                variant="filled"
                onClick={() => setQrModalOpen(false)}
              >
                Finalizar
              </PillButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
