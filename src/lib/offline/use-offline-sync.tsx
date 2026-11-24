"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { offlineDb, ensureOfflineSeeded } from "./db";
import { flushSyncQueueIfOnline } from "./sync-engine";

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  ready: boolean;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  ready: false,
  syncNow: async () => {},
});

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const pendingCount =
    useLiveQuery(
      () => offlineDb.syncQueue.where("status").equals("PENDING").count(),
      [],
      0
    ) ?? 0;

  const syncNow = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      return;
    }
    setIsSyncing(true);
    try {
      const res = await flushSyncQueueIfOnline();
      if (res.syncedCount > 0 || res.pendingCount === 0) {
        setLastSyncedAt(new Date().toISOString());
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    ensureOfflineSeeded().then(() => {
      if (mounted) setReady(true);
    });

    const updateOnline = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        void syncNow();
      }
    };

    setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      mounted = false;
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, [syncNow]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncedAt,
        ready,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineSync() {
  return useContext(OfflineContext);
}
