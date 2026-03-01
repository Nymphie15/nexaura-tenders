"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineToast(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Count pending sync items (if Service Worker sync is available)
  useEffect(() => {
    if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(async (registration) => {
        try {
          // @ts-ignore - sync API may not have types
          const tags = await registration.sync.getTags();
          const mutationTags = tags.filter((t: string) => t.includes("mutation"));
          setPendingSync(mutationTags.length);
        } catch (error) {
          console.error("Failed to get sync tags:", error);
        }
      });
    }
  }, [isOnline]);

  // Don't show if online and no pending sync
  if (isOnline && pendingSync === 0 && !showOnlineToast) return null;

  return (
    <>
      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span>
              Mode hors ligne - Vos données seront synchronisées automatiquement lorsque la
              connexion reviendra
            </span>
          </div>
        </div>
      )}

      {/* Syncing banner */}
      {isOnline && pendingSync > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 py-2 px-4 text-center text-sm font-medium animate-fade-in">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>
              Synchronisation en cours ({pendingSync} action{pendingSync > 1 ? "s" : ""} en
              attente)...
            </span>
          </div>
        </div>
      )}

      {/* Back online toast */}
      {showOnlineToast && pendingSync === 0 && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-white py-3 px-4 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span>Connexion rétablie</span>
          </div>
        </div>
      )}
    </>
  );
}
