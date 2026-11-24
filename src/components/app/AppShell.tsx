"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Package,
  UtensilsCrossed,
  AlertCircle,
  MessageSquare,
  BarChart3,
  CreditCard,
  LogOut,
} from "lucide-react";
import { OfflineStatusPill } from "./OfflineStatusPill";
import type { SessionPayload } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutGrid },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/recetas", label: "Recetas / POS", icon: UtensilsCrossed },
  { href: "/mermas", label: "Mermas", icon: AlertCircle },
  { href: "/compras", label: "Compras", icon: MessageSquare },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/suscripcion", label: "Planes", icon: CreditCard },
];

export function AppShell({
  initialSession,
  children,
}: {
  initialSession: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"ADMIN" | "KITCHEN">(initialSession.role);
  const [switching, setSwitching] = useState(false);

  async function handleRoleSwitch(nextRole: "ADMIN" | "KITCHEN") {
    if (nextRole === role || switching) return;
    setSwitching(true);
    setRole(nextRole);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      router.refresh();
    } catch {
      // Mantiene cambio visual en modo offline
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#17191c] flex flex-col">
      {/* Barra superior editorial */}
      <header className="sticky top-0 z-30 bg-[#ffffff] border-b border-[#f2f2f3] no-print">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="w-7 h-7 rounded-full bg-[#17191c] text-[#ffffff] text-[13px] font-medium inline-flex items-center justify-center">
                G
              </span>
              <span className="text-[16px] font-medium tracking-[-0.01em] text-[#17191c]">
                GastroSmart
              </span>
            </Link>
            <span className="hidden md:inline text-[#979799] text-[14px]">
              ·
            </span>
            <span className="hidden md:inline text-[14px] text-[#777b86] truncate">
              El Solar Cochabambino
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch rapido de rol Demo (Dueño / Cocina) */}
            <div
              className="hidden sm:inline-flex items-center bg-[#f2f2f3] p-0.5 rounded-full text-[13px]"
              title="Cambiar perfil demo en 1 clic"
            >
              <button
                type="button"
                onClick={() => void handleRoleSwitch("ADMIN")}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  role === "ADMIN"
                    ? "bg-[#17191c] text-[#ffffff]"
                    : "text-[#777b86] hover:text-[#17191c]"
                }`}
              >
                Dueño
              </button>
              <button
                type="button"
                onClick={() => void handleRoleSwitch("KITCHEN")}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  role === "KITCHEN"
                    ? "bg-[#17191c] text-[#ffffff]"
                    : "text-[#777b86] hover:text-[#17191c]"
                }`}
              >
                Cocina
              </button>
            </div>

            <OfflineStatusPill />

            <Link
              href="/login"
              title="Cambiar usuario"
              className="p-2 rounded-full text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb] transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Navegacion horizontal limpia (maximo 1 clic hacia cualquier modulo) */}
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 border-t border-[#f2f2f3] overflow-x-auto">
          <nav className="flex items-center gap-1 py-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[14px] whitespace-nowrap transition-colors ${
                    active
                      ? "bg-[#17191c] text-[#ffffff] font-medium"
                      : "text-[#777b86] hover:text-[#17191c] hover:bg-[#fafafb]"
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 md:px-6 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
