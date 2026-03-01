import { useEffect, useCallback, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { debounce } from "lodash-es";
import { set, get, del } from "idb-keyval";

export interface AutoSaveOptions<T> {
  key: string; // Clé unique pour le formulaire
  data: T; // Données à sauvegarder
  onSave?: (data: T) => Promise<void>; // Callback API optionnel
  debounceMs?: number; // Délai avant sauvegarde (défaut: 2000ms)
  cloudSync?: boolean; // Sync avec API (défaut: false)
  enabled?: boolean; // Activer/désactiver auto-save (défaut: true)
}

export interface DraftData<T> {
  data: T;
  timestamp: string;
  version: string;
}

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutoSave<T>({
  key,
  data,
  onSave,
  debounceMs = 2000,
  cloudSync = false,
  enabled = true,
}: AutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Sauvegarde locale (IndexedDB)
  const saveLocal = useCallback(
    async (value: T) => {
      try {
        await set(key, {
          data: value,
          timestamp: new Date().toISOString(),
          version: crypto.randomUUID(),
        } as DraftData<T>);
        return true;
      } catch (err) {
        console.error("Local save failed:", err);
        setError(err as Error);
        return false;
      }
    },
    [key]
  );

  // Sauvegarde cloud (API)
  const saveCloudMutation = useMutation({
    mutationFn: async (value: T) => {
      if (onSave) await onSave(value);
    },
    onSuccess: () => {
      setStatus("saved");
      setLastSaved(new Date());
      setError(null);
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus("idle"), 2000);
    },
    onError: (err: Error) => {
      setStatus("error");
      setError(err);
    },
  });

  // Debounced save (local + cloud)
  const debouncedSave = useCallback(
    debounce(async (value: T) => {
      if (!enabled) return;

      setStatus("saving");

      // Local first (instantané)
      const localSuccess = await saveLocal(value);

      if (!localSuccess) {
        setStatus("error");
        return;
      }

      // Cloud si activé
      if (cloudSync && onSave) {
        saveCloudMutation.mutate(value);
      } else {
        setStatus("saved");
        setLastSaved(new Date());
        setTimeout(() => setStatus("idle"), 2000);
      }
    }, debounceMs),
    [saveLocal, cloudSync, onSave, debounceMs, enabled]
  );

  // Trigger save quand data change
  useEffect(() => {
    if (data && enabled) {
      debouncedSave(data);
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [data, debouncedSave, enabled]);

  // Récupération draft au mount
  const { data: draft } = useQuery({
    queryKey: ["draft", key],
    queryFn: async () => {
      const stored = await get<DraftData<T>>(key);
      return stored;
    },
    staleTime: Infinity,
  });

  // Force save (bouton manuel)
  const forceSave = useCallback(async () => {
    if (!enabled) return;

    setStatus("saving");
    const localSuccess = await saveLocal(data);

    if (!localSuccess) {
      setStatus("error");
      return;
    }

    if (cloudSync && onSave) {
      try {
        await onSave(data);
        setStatus("saved");
        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        setStatus("error");
        setError(err as Error);
      }
    } else {
      setStatus("saved");
      setLastSaved(new Date());
    }

    setTimeout(() => setStatus("idle"), 2000);
  }, [data, saveLocal, cloudSync, onSave, enabled]);

  // Clear draft
  const clearDraft = useCallback(async () => {
    try {
      await del(key);
    } catch (err) {
      console.error("Clear draft failed:", err);
    }
  }, [key]);

  return {
    status,
    lastSaved,
    draft: draft?.data,
    draftTimestamp: draft?.timestamp ? new Date(draft.timestamp) : null,
    draftVersion: draft?.version,
    error,
    forceSave,
    clearDraft,
    isRestored: !!draft,
  };
}
