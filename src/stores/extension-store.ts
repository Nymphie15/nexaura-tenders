import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// SSR-safe storage that handles server-side rendering
const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(name);
    }
  },
};

// Declare chrome global type for extension communication
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (message: unknown, callback: (response: unknown) => void) => void;
        lastError?: { message: string };
      };
    };
  }
}

interface PendingImport {
  id: string;
  url: string;
  title: string;
  platform: string;
  extractedAt: Date;
  data: Record<string, unknown>;
}

interface ExtensionState {
  // State
  isExtensionConnected: boolean;
  lastSync: Date | null;
  pendingImports: PendingImport[];
  extensionVersion: string | null;
  
  // Actions
  setConnected: (connected: boolean, version?: string) => void;
  addPendingImport: (importData: Omit<PendingImport, 'id'>) => void;
  removePendingImport: (id: string) => void;
  clearPendingImports: () => void;
  syncWithExtension: () => Promise<void>;
  updateLastSync: () => void;
}

export const useExtensionStore = create<ExtensionState>()(
  persist(
    (set, get) => ({
      // Initial state
      isExtensionConnected: false,
      lastSync: null,
      pendingImports: [],
      extensionVersion: null,

      // Actions
      setConnected: (connected: boolean, version?: string) => {
        set({
          isExtensionConnected: connected,
          extensionVersion: version ?? get().extensionVersion,
        });
      },

      addPendingImport: (importData: Omit<PendingImport, 'id'>) => {
        const newImport: PendingImport = {
          ...importData,
          id: crypto.randomUUID(),
        };
        set((state) => ({
          pendingImports: [...state.pendingImports, newImport],
        }));
      },

      removePendingImport: (id: string) => {
        set((state) => ({
          pendingImports: state.pendingImports.filter((item) => item.id !== id),
        }));
      },

      clearPendingImports: () => {
        set({ pendingImports: [] });
      },

      syncWithExtension: async () => {
        const state = get();
        
        // Check if running in browser with extension
        if (typeof window === 'undefined') {
          set({ isExtensionConnected: false });
          return;
        }

        const chromeRuntime = window.chrome?.runtime;
        
        if (chromeRuntime) {
          try {
            // Send message to extension to get pending data
            const response = await new Promise<{
              connected: boolean;
              version: string;
              pendingData: Omit<PendingImport, 'id'>[];
            }>((resolve, reject) => {
              chromeRuntime.sendMessage(
                { type: 'SYNC_REQUEST' },
                (response) => {
                  if (chromeRuntime.lastError) {
                    reject(new Error(chromeRuntime.lastError.message));
                  } else {
                    resolve(response as any);
                  }
                }
              );
            });

            // Update store with extension data
            set({
              isExtensionConnected: response.connected,
              extensionVersion: response.version,
              lastSync: new Date(),
            });

            // Add any pending imports from extension
            response.pendingData?.forEach((data) => {
              state.addPendingImport(data);
            });
          } catch (error) {
            console.warn('Extension sync failed:', error);
            set({ isExtensionConnected: false });
          }
        } else {
          set({ isExtensionConnected: false });
        }
      },

      updateLastSync: () => {
        set({ lastSync: new Date() });
      },
    }),
    {
      name: 'extension-store',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        pendingImports: state.pendingImports,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Selector hooks for optimized re-renders
export const useIsExtensionConnected = () =>
  useExtensionStore((state) => state.isExtensionConnected);

export const usePendingImports = () =>
  useExtensionStore((state) => state.pendingImports);

export const usePendingImportsCount = () =>
  useExtensionStore((state) => state.pendingImports.length);
