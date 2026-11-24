import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { OfflineProvider } from "@/lib/offline/use-offline-sync";

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GastroSmart — Menos mermas, más ganancia",
  description:
    "Control de inventario perecedero, mermas, recetas estándar y órdenes de compra por WhatsApp para restaurantes y cafeterías de Cochabamba, Bolivia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${sourceSerif.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#ffffff] text-[#17191c] antialiased">
        <OfflineProvider>{children}</OfflineProvider>
      </body>
    </html>
  );
}
