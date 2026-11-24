import React from "react";
import Link from "next/link";
import {
  PillButton,
  NeutralCard,
  PeachCard,
  CategoryTag,
  TextArrowLink,
} from "@/components/ui";
import { HeroCollage } from "@/components/landing/HeroCollage";
import { PricingSection } from "@/components/landing/PricingSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#17191c]">
      {/* Barra de navegacion transparente (sin fondo, sin sombra, sin borde) */}
      <header className="max-w-[1200px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-[#17191c] text-[#ffffff] text-[13px] font-medium inline-flex items-center justify-center">
            G
          </span>
          <span className="text-[17px] font-medium tracking-[-0.01em] text-[#17191c]">
            GastroSmart
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-[15px] text-[#777b86]">
          <a href="#producto" className="hover:text-[#17191c] transition-colors">
            Producto
          </a>
          <a
            href="#como-funciona"
            className="hover:text-[#17191c] transition-colors"
          >
            Cómo funciona
          </a>
          <a href="#planes" className="hover:text-[#17191c] transition-colors">
            Planes
          </a>
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-[15px] text-[#17191c] hover:underline underline-offset-4"
          >
            Iniciar sesión
          </Link>
          <PillButton href="/dashboard" variant="filled" size="md">
            Probar gratis
          </PillButton>
        </div>
      </header>

      {/* Hero Editorial Collage */}
      <main>
        <section id="producto" className="pt-12 pb-20">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-4xl">
              <CategoryTag>
                Cochabamba, Bolivia · Del cuaderno al control
              </CategoryTag>
              <h1 className="display-hero text-[#17191c] mt-4">
                Controla tu cocina,{" "}
                <em className="italic">reduce mermas cada día</em>
              </h1>
              <p className="text-[20px] leading-[1.4] text-[#777b86] mt-6 max-w-2xl">
                Inventario perecedero en tiempo real, descuento automático por
                receta y órdenes de compra listas para WhatsApp. Opera en cocina
                incluso sin conexión a internet.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <PillButton href="/dashboard" variant="filled" size="lg">
                  Explorar demo en vivo
                </PillButton>
                <PillButton href="#planes" variant="ghost" size="lg">
                  Ver planes
                </PillButton>
              </div>
            </div>

            <HeroCollage />
          </div>
        </section>

        {/* Seccion de Capacidades sobre #fafafb */}
        <section id="como-funciona" className="py-20 bg-[#fafafb]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <CategoryTag>Menos mermas, más ganancia</CategoryTag>
              <h2 className="heading-md text-[#17191c] mt-2">
                Tres pilares pensados para el ritmo real de la cocina
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <NeutralCard className="p-8 flex flex-col justify-between min-h-[260px]">
                <div>
                  <CategoryTag>Inventario</CategoryTag>
                  <h3 className="text-[22px] font-medium text-[#17191c] mt-3">
                    Perecederos bajo control en menos de 10 segundos
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-[#777b86] mt-3">
                    Separa Cámara Frío, Almacén Seco y Cocina. Registra entradas
                    rápidas y mermas en Bolivianos con 2 clics aunque falle el
                    Wi-Fi.
                  </p>
                </div>
                <div className="mt-6">
                  <TextArrowLink href="/inventario">
                    Ver inventario
                  </TextArrowLink>
                </div>
              </NeutralCard>

              <NeutralCard className="p-8 flex flex-col justify-between min-h-[260px]">
                <div>
                  <CategoryTag>Recetas</CategoryTag>
                  <h3 className="text-[22px] font-medium text-[#17191c] mt-3">
                    Descuento exacto por cada plato vendido
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-[#777b86] mt-3">
                    Cada Pique Macho o Silpancho descuenta automáticamente los
                    gramos y mililitros de tu stock y calcula el margen bruto en
                    tiempo real.
                  </p>
                </div>
                <div className="mt-6">
                  <TextArrowLink href="/recetas">
                    Probar simulador POS
                  </TextArrowLink>
                </div>
              </NeutralCard>

              <NeutralCard className="p-8 flex flex-col justify-between min-h-[260px]">
                <div>
                  <CategoryTag>Compras</CategoryTag>
                  <h3 className="text-[22px] font-medium text-[#17191c] mt-3">
                    Pedidos por WhatsApp agrupados por casera
                  </h3>
                  <p className="text-[15px] leading-[1.55] text-[#777b86] mt-3">
                    Detecta insumos bajo mínimo y arma el mensaje exacto por
                    proveedor de Calatayud o La Cancha para enviar en 1 clic.
                  </p>
                </div>
                <div className="mt-6">
                  <TextArrowLink href="/compras">
                    Abrir despachador
                  </TextArrowLink>
                </div>
              </NeutralCard>
            </div>
          </div>
        </section>

        {/* Bloque Editorial Destacado (Unica Accent Peach Card de la vista sobre #ffffff) */}
        <section className="py-20 bg-[#ffffff]">
          <div className="max-w-[1200px] mx-auto px-6">
            <PeachCard className="p-8 md:p-12">
              <div className="max-w-3xl">
                <p className="text-[14px] text-[#5d2a1a]/80 mb-3">
                  Realidad del sector gastronómico cochabambino
                </p>
                <blockquote className="font-serif-editorial text-[26px] md:text-[34px] leading-[1.35] text-[#5d2a1a]">
                  “El 64% de los restaurantes se quedó sin un insumo clave en el
                  último mes. Prevenir desperdicios rinde hasta 6:1 en ahorro
                  directo.”
                </blockquote>
                <div className="mt-6 flex flex-wrap items-center gap-6 text-[14px] text-[#5d2a1a]/85">
                  <span>Márgenes netos promedio: 2.8% – 6%</span>
                  <span>·</span>
                  <span>Mermas invisibles: 15% – 30% de las compras</span>
                </div>
              </div>
            </PeachCard>
          </div>
        </section>

        <PricingSection />
      </main>

      <footer className="border-t border-[#f2f2f3] py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-[#777b86]">
          <div>
            GastroSmart · Cochabamba, Bolivia — “Menos mermas, más ganancia.”
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-[#17191c]">
              Demo operativa
            </Link>
            <Link href="/suscripcion" className="hover:text-[#17191c]">
              Planes y QR Demo
            </Link>
            <Link href="/login" className="hover:text-[#17191c]">
              Acceso
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
