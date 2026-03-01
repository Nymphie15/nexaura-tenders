"use client";

/**
 * @file client-charts.tsx
 * @description SSR-safe wrappers for Tremor charts to prevent hydration errors
 * @module components/charts
 *
 * These components wrap Tremor charts with dynamic imports and
 * ensure they only render on the client side to avoid React error #185.
 */

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentProps } from "react";

// Chart loading skeleton
function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
  );
}

// Dynamically import Tremor charts with ssr: false to prevent hydration errors
const TremorAreaChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.AreaChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  }
);

const TremorBarChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.BarChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  }
);

const TremorLineChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.LineChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={300} />,
  }
);

const TremorDonutChart = dynamic(
  () => import("@tremor/react").then((mod) => mod.DonutChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={200} />,
  }
);

const TremorBarList = dynamic(
  () => import("@tremor/react").then((mod) => mod.BarList),
  {
    ssr: false,
    loading: () => <ChartSkeleton height={150} />,
  }
);

// Re-export with proper typing
export const AreaChart = TremorAreaChart as typeof import("@tremor/react").AreaChart;
export const BarChart = TremorBarChart as typeof import("@tremor/react").BarChart;
export const LineChart = TremorLineChart as typeof import("@tremor/react").LineChart;
export const DonutChart = TremorDonutChart as typeof import("@tremor/react").DonutChart;
export const BarList = TremorBarList as typeof import("@tremor/react").BarList;
