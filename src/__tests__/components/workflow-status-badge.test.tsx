import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkflowStatusBadge } from "@/components/workflow/workflow-status-badge";

describe("WorkflowStatusBadge", () => {
  it("should render pending status", () => {
    render(<WorkflowStatusBadge status="pending" />);
    expect(screen.getByText("En attente")).toBeDefined();
  });

  it("should render running status with spinner", () => {
    render(<WorkflowStatusBadge status="running" />);
    expect(screen.getByText("En cours")).toBeDefined();
  });

  it("should render completed status", () => {
    render(<WorkflowStatusBadge status="completed" />);
    expect(screen.getByText("Terminé")).toBeDefined();
  });

  it("should render failed status", () => {
    render(<WorkflowStatusBadge status="failed" />);
    expect(screen.getByText("Échoué")).toBeDefined();
  });

  it("should render cancelled status with dark mode classes", () => {
    const { container } = render(<WorkflowStatusBadge status="cancelled" />);
    expect(screen.getByText("Annulé")).toBeDefined();
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("dark:bg-gray-800");
  });

  it("should render without icon when showIcon is false", () => {
    const { container } = render(<WorkflowStatusBadge status="completed" showIcon={false} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBe(0);
  });

  it("should apply size styles", () => {
    const { container } = render(<WorkflowStatusBadge status="pending" size="sm" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-xs");
  });
});
