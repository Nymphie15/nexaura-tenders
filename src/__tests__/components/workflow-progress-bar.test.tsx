import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowProgressBar, WorkflowPhaseDetail } from "@/components/workflow/workflow-progress-bar";

const mockPhases: WorkflowPhaseDetail[] = [
  { id: "ingestion", name: "Ingestion", status: "completed" },
  { id: "extraction", name: "Extraction", status: "completed" },
  { id: "matching", name: "Matching", status: "running" },
  { id: "risk", name: "Analyse risques", status: "pending" },
  { id: "strategy", name: "Stratégie", status: "pending" },
];

describe("WorkflowProgressBar", () => {
  it("should render phase labels", () => {
    render(<WorkflowProgressBar phases={mockPhases} />);
    expect(screen.getByText("Ingestion")).toBeDefined();
    expect(screen.getByText("Extraction")).toBeDefined();
    expect(screen.getByText("Matching")).toBeDefined();
  });

  it("should show correct progress count", () => {
    render(<WorkflowProgressBar phases={mockPhases} />);
    expect(screen.getByText("2 / 5 phases")).toBeDefined();
  });

  it("should hide labels when showLabels is false", () => {
    render(<WorkflowProgressBar phases={mockPhases} showLabels={false} />);
    expect(screen.queryByText("Ingestion")).toBeNull();
  });

  it("should handle empty phases", () => {
    render(<WorkflowProgressBar phases={[]} />);
    expect(screen.getByText("0 / 0 phases")).toBeDefined();
  });

  it("should use muted-foreground for pending/skipped phases (dark mode safe)", () => {
    const { container } = render(<WorkflowProgressBar phases={mockPhases} />);
    // Check that pending phases use text-muted-foreground instead of hardcoded gray
    const pendingPhases = container.querySelectorAll(".text-muted-foreground");
    expect(pendingPhases.length).toBeGreaterThan(0);
  });
});
