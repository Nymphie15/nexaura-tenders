"use client";

/**
 * @file use-dashboard-config.ts
 * @description Hook for managing dashboard widget configuration and layout
 * @module hooks
 *
 * Provides state management for:
 * - Widget visibility
 * - Widget order/layout
 * - User preferences for dashboard
 *
 * @example
 * const { widgets, toggleWidget, reorderWidgets } = useDashboardConfig();
 */

import { useCallback, useEffect, useState } from "react";

export interface WidgetConfig {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  size: "sm" | "md" | "lg" | "xl";
}

export interface DashboardConfig {
  widgets: WidgetConfig[];
  refreshInterval: number; // in milliseconds
  compactMode: boolean;
}

const DEFAULT_CONFIG: DashboardConfig = {
  widgets: [
    { id: "kpi-pipeline", title: "Pipeline Estime", enabled: true, order: 0, size: "sm" },
    { id: "kpi-success", title: "Taux de Succes", enabled: true, order: 1, size: "sm" },
    { id: "kpi-active", title: "AO Actifs", enabled: true, order: 2, size: "sm" },
    { id: "kpi-decisions", title: "Décisions", enabled: true, order: 3, size: "sm" },
    { id: "chart-activity", title: "Activite", enabled: true, order: 4, size: "lg" },
    { id: "chart-sources", title: "Sources", enabled: true, order: 5, size: "md" },
    { id: "pending-decisions", title: "Décisions en attente", enabled: true, order: 6, size: "md" },
    { id: "recent-tenders", title: "Opportunités récentes", enabled: true, order: 7, size: "md" },
  ],
  refreshInterval: 60000,
  compactMode: false,
};

const STORAGE_KEY = "dashboard-config";

/**
 * Hook for managing dashboard configuration
 */
export function useDashboardConfig() {
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardConfig;
        // Merge with defaults to handle new widgets
        const mergedWidgets = DEFAULT_CONFIG.widgets.map((defaultWidget) => {
          const stored = parsed.widgets.find((w) => w.id === defaultWidget.id);
          return stored || defaultWidget;
        });
        setConfig({
          ...DEFAULT_CONFIG,
          ...parsed,
          widgets: mergedWidgets,
        });
      }
    } catch (error) {
      console.warn("Failed to load dashboard config:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save config to localStorage when it changes
  useEffect(() => {
    if (!isLoaded || typeof window === "undefined") return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn("Failed to save dashboard config:", error);
    }
  }, [config, isLoaded]);

  /**
   * Toggle widget visibility
   */
  const toggleWidget = useCallback((widgetId: string) => {
    setConfig((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      ),
    }));
  }, []);

  /**
   * Reorder widgets
   */
  const reorderWidgets = useCallback((fromIndex: number, toIndex: number) => {
    setConfig((prev) => {
      const widgets = [...prev.widgets];
      const [removed] = widgets.splice(fromIndex, 1);
      widgets.splice(toIndex, 0, removed);
      // Update order values
      const reordered = widgets.map((w, i) => ({ ...w, order: i }));
      return { ...prev, widgets: reordered };
    });
  }, []);

  /**
   * Update widget size
   */
  const updateWidgetSize = useCallback(
    (widgetId: string, size: WidgetConfig["size"]) => {
      setConfig((prev) => ({
        ...prev,
        widgets: prev.widgets.map((w) =>
          w.id === widgetId ? { ...w, size } : w
        ),
      }));
    },
    []
  );

  /**
   * Set refresh interval
   */
  const setRefreshInterval = useCallback((interval: number) => {
    setConfig((prev) => ({ ...prev, refreshInterval: interval }));
  }, []);

  /**
   * Toggle compact mode
   */
  const toggleCompactMode = useCallback(() => {
    setConfig((prev) => ({ ...prev, compactMode: !prev.compactMode }));
  }, []);

  /**
   * Reset to default config
   */
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /**
   * Get enabled widgets sorted by order
   */
  const enabledWidgets = config.widgets
    .filter((w) => w.enabled)
    .sort((a, b) => a.order - b.order);

  return {
    config,
    enabledWidgets,
    isLoaded,
    toggleWidget,
    reorderWidgets,
    updateWidgetSize,
    setRefreshInterval,
    toggleCompactMode,
    resetConfig,
  };
}

export default useDashboardConfig;
