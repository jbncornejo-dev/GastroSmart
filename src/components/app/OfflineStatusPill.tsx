"use client";

import React from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useOfflineSync } from "@/lib/offline/use-offline-sync";

export function OfflineStatusPill() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#17191c]/10 bg-[#fafafb] text-[13px] text-[#777b86]">
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5 text-[#17191c]" strokeWidth={1.5} />
            <span className="text-[#17191c]">
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}`
                : "Sincronizado en la nube"}
            </span>
          </>
        ) : (
          <>
            <WifiOff
              className="w-3.5 h-3.5 text-[#5d2a1a]"
              strokeWidth={1.5}
            />
            <span className="text-[#17191c] font-medium">
              Modo local activo
              {pendingCount > 0 ? ` (${pendingCount})` : ""}
            </span>
          </>
        )}
      </span>

      <button
        type="button"
        onClick={() => void syncNow()}
        disabled={!isOnline || isSyncing}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#17191c]/15 text-[13px] text-[#17191c] hover:bg-[#fafafb] disabled:opacity-45 cursor-pointer disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
          strokeWidth={1.5}
        />
        <span className="hidden sm:inline">
          {isSyncing ? "Sincronizando..." : "Sincronizar nube"}
        </span>
      </button>
    </div>
  );
}
