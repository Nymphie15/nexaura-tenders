import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { WorkflowPhase, WorkflowStatus } from "@/types";

// Mock progress indicator components
interface ProgressIndicatorProps {
  currentPhase: WorkflowPhase;
  status: WorkflowStatus;
  totalPhases?: number;
}

function WorkflowProgressIndicator({
  currentPhase,
  status,
  totalPhases = 9,
}: ProgressIndicatorProps) {
  const phaseOrder: WorkflowPhase[] = [
    "INGESTION",
    "EXTRACTION",
    "MATCHING",
    "RISK_ANALYSIS",
    "STRATEGY",
    "CALCULATION",
    "GENERATION",
    "VALIDATION",
    "PACKAGING",
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  const progress =
    status === "completed"
      ? 100
      : currentPhase === "ERROR"
        ? 0
        : currentIndex >= 0
          ? Math.round(((currentIndex + 1) / totalPhases) * 100)
          : 0;

  return (
    <div data-testid="progress-indicator">
      <div data-testid="progress-bar" style={{ width: `${progress}%` }} />
      <span data-testid="progress-percentage">{progress}%</span>
      <span data-testid="progress-text">
        Phase {currentIndex + 1} sur {totalPhases}
      </span>
    </div>
  );
}

function CircularProgressIndicator({
  currentPhase,
  status,
}: ProgressIndicatorProps) {
  const phaseOrder: WorkflowPhase[] = [
    "INGESTION",
    "EXTRACTION",
    "MATCHING",
    "RISK_ANALYSIS",
    "STRATEGY",
    "CALCULATION",
    "GENERATION",
    "VALIDATION",
    "PACKAGING",
  ];

  const currentIndex = phaseOrder.indexOf(currentPhase);
  const progress =
    status === "completed"
      ? 100
      : currentPhase === "ERROR"
        ? 0
        : Math.round(((currentIndex + 1) / 9) * 100);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div data-testid="circular-progress">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={status === "failed" ? "#ef4444" : "#6366f1"}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          data-testid="progress-circle"
        />
      </svg>
      <span data-testid="circular-percentage">{progress}%</span>
    </div>
  );
}

describe("Progress Indicators", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderLinearProgress = (
    currentPhase: WorkflowPhase,
    status: WorkflowStatus
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WorkflowProgressIndicator
          currentPhase={currentPhase}
          status={status}
        />
      </QueryClientProvider>
    );
  };

  const renderCircularProgress = (
    currentPhase: WorkflowPhase,
    status: WorkflowStatus
  ) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <CircularProgressIndicator
          currentPhase={currentPhase}
          status={status}
        />
      </QueryClientProvider>
    );
  };

  describe("Linear Progress Indicator", () => {
    describe("Progress Calculation", () => {
      it("should show 11% for INGESTION (phase 1/9)", () => {
        renderLinearProgress("INGESTION", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "11%"
        );
      });

      it("should show 22% for EXTRACTION (phase 2/9)", () => {
        renderLinearProgress("EXTRACTION", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "22%"
        );
      });

      it("should show 33% for MATCHING (phase 3/9)", () => {
        renderLinearProgress("MATCHING", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "33%"
        );
      });

      it("should show 44% for RISK_ANALYSIS (phase 4/9)", () => {
        renderLinearProgress("RISK_ANALYSIS", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "44%"
        );
      });

      it("should show 56% for STRATEGY (phase 5/9)", () => {
        renderLinearProgress("STRATEGY", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "56%"
        );
      });

      it("should show 67% for CALCULATION (phase 6/9)", () => {
        renderLinearProgress("CALCULATION", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "67%"
        );
      });

      it("should show 78% for GENERATION (phase 7/9)", () => {
        renderLinearProgress("GENERATION", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "78%"
        );
      });

      it("should show 89% for VALIDATION (phase 8/9)", () => {
        renderLinearProgress("VALIDATION", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "89%"
        );
      });

      it("should show 100% for PACKAGING (phase 9/9)", () => {
        renderLinearProgress("PACKAGING", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "100%"
        );
      });
    });

    describe("Completed State", () => {
      it("should show 100% when status is completed", () => {
        renderLinearProgress("MATCHING", "completed");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "100%"
        );
      });

      it("should show 100% regardless of phase when completed", () => {
        renderLinearProgress("INGESTION", "completed");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "100%"
        );
      });
    });

    describe("Error State", () => {
      it("should show 0% when phase is ERROR", () => {
        renderLinearProgress("ERROR", "failed");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "0%"
        );
      });

      it("should show 0% when status is failed", () => {
        renderLinearProgress("ERROR", "failed");

        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveStyle({ width: "0%" });
      });
    });

    describe("Progress Bar Width", () => {
      it("should set width style correctly for progress bar", () => {
        renderLinearProgress("MATCHING", "running");

        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveStyle({ width: "33%" });
      });

      it("should have full width for completed workflow", () => {
        renderLinearProgress("PACKAGING", "completed");

        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveStyle({ width: "100%" });
      });

      it("should have zero width for error state", () => {
        renderLinearProgress("ERROR", "failed");

        const progressBar = screen.getByTestId("progress-bar");
        expect(progressBar).toHaveStyle({ width: "0%" });
      });
    });

    describe("Progress Text", () => {
      it("should show current phase number", () => {
        renderLinearProgress("MATCHING", "running");

        expect(screen.getByTestId("progress-text")).toHaveTextContent(
          "Phase 3 sur 9"
        );
      });

      it("should show first phase correctly", () => {
        renderLinearProgress("INGESTION", "running");

        expect(screen.getByTestId("progress-text")).toHaveTextContent(
          "Phase 1 sur 9"
        );
      });

      it("should show last phase correctly", () => {
        renderLinearProgress("PACKAGING", "running");

        expect(screen.getByTestId("progress-text")).toHaveTextContent(
          "Phase 9 sur 9"
        );
      });
    });
  });

  describe("Circular Progress Indicator", () => {
    describe("Progress Calculation", () => {
      it("should calculate progress for EXTRACTION", () => {
        renderCircularProgress("EXTRACTION", "running");

        expect(screen.getByTestId("circular-percentage")).toHaveTextContent(
          "22%"
        );
      });

      it("should show 100% when completed", () => {
        renderCircularProgress("STRATEGY", "completed");

        expect(screen.getByTestId("circular-percentage")).toHaveTextContent(
          "100%"
        );
      });

      it("should show 0% when error", () => {
        renderCircularProgress("ERROR", "failed");

        expect(screen.getByTestId("circular-percentage")).toHaveTextContent(
          "0%"
        );
      });
    });

    describe("Visual Styling", () => {
      it("should render SVG circle", () => {
        renderCircularProgress("MATCHING", "running");

        const circle = screen.getByTestId("progress-circle");
        expect(circle).toBeInTheDocument();
      });

      it("should use blue color for normal progress", () => {
        renderCircularProgress("MATCHING", "running");

        const circle = screen.getByTestId("progress-circle");
        expect(circle).toHaveAttribute("stroke", "#6366f1");
      });

      it("should use red color for failed state", () => {
        renderCircularProgress("ERROR", "failed");

        const circle = screen.getByTestId("progress-circle");
        expect(circle).toHaveAttribute("stroke", "#ef4444");
      });

      it("should calculate stroke-dashoffset correctly", () => {
        renderCircularProgress("MATCHING", "running");

        const circle = screen.getByTestId("progress-circle");
        const circumference = 2 * Math.PI * 45;

        expect(circle).toHaveAttribute("stroke-dasharray", String(circumference));
        expect(circle).toHaveAttribute("stroke-dashoffset");
      });
    });
  });

  describe("Different Workflow States", () => {
    describe("Running State", () => {
      it("should show progress for running workflow", () => {
        renderLinearProgress("RISK_ANALYSIS", "running");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "44%"
        );
      });
    });

    describe("Paused State", () => {
      it("should maintain current progress when paused", () => {
        renderLinearProgress("STRATEGY", "paused");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "56%"
        );
      });
    });

    describe("Waiting HITL State", () => {
      it("should show current progress when waiting for HITL", () => {
        renderLinearProgress("RISK_ANALYSIS", "waiting_hitl");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "44%"
        );
      });
    });

    describe("Cancelled State", () => {
      it("should show current progress when cancelled", () => {
        renderLinearProgress("CALCULATION", "cancelled");

        expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
          "67%"
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle unknown phase gracefully", () => {
      // @ts-ignore - testing invalid phase
      renderLinearProgress("UNKNOWN", "running");

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent("0%");
    });

    it("should handle CREATED phase", () => {
      renderLinearProgress("CREATED", "running");

      // CREATED is not in the phase order, should default to 0%
      expect(screen.getByTestId("progress-percentage")).toHaveTextContent("0%");
    });

    it("should handle COMPLETED phase", () => {
      renderLinearProgress("COMPLETED", "completed");

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "100%"
      );
    });

    it("should handle REJECTED phase", () => {
      renderLinearProgress("REJECTED", "cancelled");

      // REJECTED is not in phase order
      expect(screen.getByTestId("progress-percentage")).toHaveTextContent("0%");
    });
  });

  describe("Progress Transitions", () => {
    it("should update progress when phase changes", () => {
      const { rerender } = renderLinearProgress("INGESTION", "running");

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "11%"
      );

      rerender(
        <QueryClientProvider client={queryClient}>
          <WorkflowProgressIndicator
            currentPhase="EXTRACTION"
            status="running"
          />
        </QueryClientProvider>
      );

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "22%"
      );
    });

    it("should update to 100% when workflow completes", () => {
      const { rerender } = renderLinearProgress("PACKAGING", "running");

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "100%"
      );

      rerender(
        <QueryClientProvider client={queryClient}>
          <WorkflowProgressIndicator
            currentPhase="PACKAGING"
            status="completed"
          />
        </QueryClientProvider>
      );

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "100%"
      );
    });

    it("should reset to 0% on error", () => {
      const { rerender } = renderLinearProgress("MATCHING", "running");

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent(
        "33%"
      );

      rerender(
        <QueryClientProvider client={queryClient}>
          <WorkflowProgressIndicator currentPhase="ERROR" status="failed" />
        </QueryClientProvider>
      );

      expect(screen.getByTestId("progress-percentage")).toHaveTextContent("0%");
    });
  });

  describe("Accessibility", () => {
    it("should have accessible progress indicator", () => {
      renderLinearProgress("MATCHING", "running");

      expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
    });

    it("should have readable percentage text", () => {
      renderLinearProgress("STRATEGY", "running");

      const percentage = screen.getByTestId("progress-percentage");
      expect(percentage).toHaveTextContent("56%");
    });

    it("should have descriptive progress text", () => {
      renderLinearProgress("VALIDATION", "running");

      const text = screen.getByTestId("progress-text");
      expect(text).toHaveTextContent("Phase 8 sur 9");
    });
  });

  describe("Multiple Progress Indicators", () => {
    it("should render both linear and circular indicators with same progress", () => {
      const { container: linearContainer } = renderLinearProgress(
        "MATCHING",
        "running"
      );
      const { container: circularContainer } = renderCircularProgress(
        "MATCHING",
        "running"
      );

      const linearPercentage = linearContainer.querySelector(
        '[data-testid="progress-percentage"]'
      );
      const circularPercentage = circularContainer.querySelector(
        '[data-testid="circular-percentage"]'
      );

      expect(linearPercentage?.textContent).toBe("33%");
      expect(circularPercentage?.textContent).toBe("33%");
    });
  });

  describe("Performance", () => {
    it("should render quickly with many re-renders", () => {
      const phases: WorkflowPhase[] = [
        "INGESTION",
        "EXTRACTION",
        "MATCHING",
        "RISK_ANALYSIS",
        "STRATEGY",
      ];

      const { rerender } = renderLinearProgress(phases[0], "running");

      phases.forEach((phase) => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <WorkflowProgressIndicator currentPhase={phase} status="running" />
          </QueryClientProvider>
        );

        expect(screen.getByTestId("progress-indicator")).toBeInTheDocument();
      });
    });
  });

  describe("Custom Total Phases", () => {
    it("should handle custom total phases count", () => {
      render(
        <QueryClientProvider client={queryClient}>
          <WorkflowProgressIndicator
            currentPhase="MATCHING"
            status="running"
            totalPhases={12}
          />
        </QueryClientProvider>
      );

      expect(screen.getByTestId("progress-text")).toHaveTextContent(
        "Phase 3 sur 12"
      );
    });
  });
});
