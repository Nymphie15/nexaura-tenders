/**
 * @file index.ts
 * @description Barrel file - Export centralisé de tous les composants dashboard
 * @module components/dashboard
 *
 * Ce fichier permet d'importer tous les composants du dashboard
 * depuis un seul point d'entrée.
 *
 * @example
 * import {
 *   StatsWidget,
 *   ActivityWidget,
 *   InteractiveLineChart,
 *   PeriodFilter,
 *   NotificationCenter,
 *   ExportDialog,
 * } from "@/components/dashboard";
 */

// ============================================
// WIDGETS
// ============================================

export { StatsWidget } from "./widgets/stats-widget";
export type { StatsWidgetProps } from "./widgets/stats-widget";

export { ActivityWidget } from "./widgets/activity-widget";
export type {
  ActivityWidgetProps,
  ActivityItem,
  ActivityType,
} from "./widgets/activity-widget";

export { HITLNotificationsWidget } from "./widgets/hitl-notifications-widget";
export type {
  HITLNotificationsWidgetProps,
  HITLNotification,
  HITLAction,
  HITLPriority,
  HITLTaskType,
} from "./widgets/hitl-notifications-widget";

// ============================================
// CHARTS
// ============================================

export { InteractiveLineChart } from "./charts/interactive-line-chart";
export type {
  InteractiveLineChartProps,
  ChartDataPoint,
  SeriesConfig,
} from "./charts/interactive-line-chart";

export { InteractiveBarChart } from "./charts/interactive-bar-chart";
export type {
  InteractiveBarChartProps,
  BarChartDataPoint,
  BarSeriesConfig,
} from "./charts/interactive-bar-chart";

// ============================================
// FILTERS
// ============================================

export { PeriodFilter } from "./filters/period-filter";
export type {
  PeriodFilterProps,
  PeriodValue,
  PeriodPreset,
} from "./filters/period-filter";

// ============================================
// NOTIFICATIONS
// ============================================

export { NotificationCenter } from "./notifications/notification-center";
export type {
  NotificationCenterProps,
  Notification,
  NotificationType,
} from "./notifications/notification-center";

// ============================================
// EXPORT
// ============================================

export { ExportDialog } from "./export/export-dialog";
export type {
  ExportDialogProps,
  ExportOptions,
  ExportFormat,
  ExportColumn,
} from "./export/export-dialog";

// ============================================
// LAYOUT
// ============================================

export { DashboardGrid, useGridContext } from "./dashboard-grid";
export type {
  DashboardGridProps,
  DashboardGridItemProps,
} from "./dashboard-grid";
