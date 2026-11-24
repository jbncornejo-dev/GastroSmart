"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PillButton, NeutralCard, CategoryTag } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@elsolar.bo");
  const [password, setPassword] = useState("••••••••");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("No se pudo iniciar sesión. Verifica tu correo.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error de red. Puedes continuar en modo local.");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoRole(role: "ADMIN" | "KITCHEN") {
    setLoading(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      router.push(role === "KITCHEN" ? "/mermas" : "/dashboard");
      router.refresh();
    } catch {
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col justify-between px-6 py-8">
      <div className="max-w-[1200px] w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-[#17191c] text-[#ffffff] text-[13px] font-medium inline-flex items-center justify-center">
            G
          </span>
          <span className="text-[17px] font-medium text-[#17191c]">
            GastroSmart
          </span>
        </Link>
        <Link
          href="/"
          className="text-[14px] text-[#777b86] hover:text-[#17191c]"
        >
          Volver al inicio
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto my-12">
        <CategoryTag>El Solar Cochabambino · Acceso operativo</CategoryTag>
        <h1 className="heading-md text-[#17191c] mt-2">
          Ingresa a tu cocina
        </h1>
        <p className="text-[15px] text-[#777b86] mt-2">
          Accede con tu cuenta o evalúa al instante los dos perfiles del
          restaurante.
        </p>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="block text-[14px] text-[#777b86] mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@elsolar.bo"
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[#17191c] placeholder:text-[#a3a6af] border border-transparent focus:border-[#17191c]/30 focus:bg-[#ffffff] focus:outline-none text-[15px]"
            />
          </div>

          <div>
            <label className="block text-[14px] text-[#777b86] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-[16px] bg-[#f2f2f3] text-[#17191c] placeholder:text-[#a3a6af] border border-transparent focus:border-[#17191c]/30 focus:bg-[#ffffff] focus:outline-none text-[15px]"
            />
          </div>

          {error && <p className="text-[14px] text-[#5d2a1a]">{error}</p>}

          <PillButton
            type="submit"
            variant="filled"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </PillButton>
        </form>

        <NeutralCard className="mt-8 p-6">
          <CategoryTag>Acceso Demo en 1 clic</CategoryTag>
          <p className="text-[14px] text-[#777b86] mt-1 mb-4">
            Evalúa la plataforma sin escribir contraseñas:
          </p>
          <div className="flex flex-col gap-2.5">
            <PillButton
              variant="filled"
              onClick={() => handleDemoRole("ADMIN")}
              disabled={loading}
              className="w-full"
            >
              Entrar como Dueño / Admin (admin@elsolar.bo)
            </PillButton>
            <PillButton
              variant="ghost"
              onClick={() => handleDemoRole("KITCHEN")}
              disabled={loading}
              className="w-full"
            >
              Entrar como Encargado de Cocina (cocina@elsolar.bo)
            </PillButton>
          </div>
        </NeutralCard>
      </div>

      <div className="text-center text-[13px] text-[#777b86]">
        Cochabamba, Bolivia · Operación Offline-First lista para cocina
      </div>
    </div>
  );
}
