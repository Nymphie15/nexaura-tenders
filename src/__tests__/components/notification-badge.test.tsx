import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/badge";

describe("NotificationBadge", () => {
  it("should render Badge component with count", () => {
    render(<Badge variant="destructive">5</Badge>);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should render with different variants", () => {
    render(<Badge variant="secondary">New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("should render with custom className", () => {
    render(<Badge className="custom-class">3</Badge>);
    const el = screen.getByText("3");
    expect(el.className).toContain("custom-class");
  });
});
