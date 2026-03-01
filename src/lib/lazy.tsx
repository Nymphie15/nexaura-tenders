/**
 * Centralized dynamic imports for code splitting.
 *
 * Heavy components are loaded lazily to reduce initial bundle size.
 * Uses next/dynamic with SSR disabled for client-only components.
 */

import dynamic from "next/dynamic";

// Analytics charts (Tremor is heavy)
export const LazyBarChart = dynamic(
  () =>
    import("@/components/charts/client-charts").then((mod) => ({
      default: mod.BarChart,
    })),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  }
);

export const LazyDonutChart = dynamic(
  () =>
    import("@/components/charts/client-charts").then((mod) => ({
      default: mod.DonutChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-48 animate-pulse bg-muted rounded-full mx-auto" />
    ),
  }
);

// PDF Viewer (very heavy - PDF.js)
export const LazyPDFViewer = dynamic(
  () =>
    import("@/components/documents/pdf-viewer").then((mod) => ({
      default: mod.PDFViewer || mod.default,
    })),
  {
    ssr: false,
    loading: () => <div className="h-96 animate-pulse bg-muted rounded-lg" />,
  }
);

// Document Editor (rich text editing)
export const LazyDocumentEditor = dynamic(
  () =>
    import("@/components/document-editor").then((mod) => ({
      default: mod.DocumentEditor,
    })),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-lg" />,
  }
);

// Comments Sidebar (loaded on demand)
export const LazyCommentsSidebar = dynamic(
  () =>
    import("@/components/comments/comments-sidebar").then((mod) => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-80 h-full animate-pulse bg-muted rounded-lg" />
    ),
  }
);
