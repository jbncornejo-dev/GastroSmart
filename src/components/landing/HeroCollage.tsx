import React from "react";
import {
  FloatingArtifact,
  MinimalChart,
  CategoryTag,
  StockProgressBar,
} from "@/components/ui";

export function HeroCollage() {
  const criticalPreview = [
    { name: "Tomate Perita", current: 2.0, min: 5.0, opt: 10.0, unit: "kg" },
    { name: "Pollo Entero", current: 3.5, min: 8.0, opt: 15.0, unit: "kg" },
    { name: "Carne de Res", current: 2.5, min: 6.0, opt: 12.0, unit: "kg" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start mt-14">
      {/* Artefacto 1: Mini tabla de stock critico */}
      <FloatingArtifact className="md:col-span-5 p-6">
        <div className="flex items-center justify-between mb-4">
          <CategoryTag>Stock crítico · Cámara Frío</CategoryTag>
          <span className="text-[13px] text-[#777b86] tabular-nums">
            3 alertas
          </span>
        </div>
        <div className="divide-y divide-[#f2f2f3]">
          {criticalPreview.map((item) => (
            <div key={item.name} className="py-3 first:pt-1 last:pb-1">
              <div className="flex items-center justify-between text-[14px] mb-1.5">
                <span className="font-medium text-[#17191c]">{item.name}</span>
                <span className="text-[#777b86] tabular-nums">
                  {item.current} / {item.min} {item.unit}
                </span>
              </div>
              <StockProgressBar
                currentStock={item.current}
                minStock={item.min}
                optimalStock={item.opt}
              />
            </div>
          ))}
        </div>
      </FloatingArtifact>

      {/* Artefacto 2: Tarjeta de metrica de merma con linea gestural */}
      <FloatingArtifact className="md:col-span-3 p-6">
        <CategoryTag>Merma del turno</CategoryTag>
        <div className="mt-2 text-[28px] font-medium text-[#17191c] tracking-[-0.02em] tabular-nums">
          Bs. 45,00
        </div>
        <div className="text-[13px] text-[#777b86] mt-0.5 mb-4">
          -34% respecto al mes anterior
        </div>
        <MinimalChart
          data={[92, 84, 78, 69, 64, 52, 45]}
          width={200}
          height={54}
        />
      </FloatingArtifact>

      {/* Artefacto 3: Vista previa de orden lista para WhatsApp */}
      <FloatingArtifact className="md:col-span-4 p-6">
        <div className="flex items-center justify-between mb-3">
          <CategoryTag>Pedido listo · WhatsApp</CategoryTag>
          <span className="text-[13px] text-[#777b86]">1 clic</span>
        </div>
        <div className="bg-[#fafafb] rounded-[16px] p-4 border border-[#f2f2f3] text-[13px] leading-[1.55] text-[#17191c]">
          <p className="text-[#777b86] mb-2">
            Hola Doña Martha (Mercado Calatayud), te envío el pedido de El Solar:
          </p>
          <p>• Tomate Perita: 8 kg</p>
          <p>• Papa Imilla Seleccionada: 13 kg</p>
          <p className="mt-2 font-medium tabular-nums">
            Total estimado: Bs. 180,50
          </p>
        </div>
      </FloatingArtifact>
    </div>
  );
}
