import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCopilotContext } from "@/hooks/use-copilot-context";

// Mock next/navigation - override the global mock for specific tests
const mockPathname = vi.fn(() => "/");
const mockParams = vi.fn(() => ({}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useParams: () => mockParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("useCopilotContext", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    mockParams.mockReturnValue({});
  });

  it("returns tender-detail context for /opportunities/[id]", () => {
    mockPathname.mockReturnValue("/opportunities/tender-123");
    mockParams.mockReturnValue({ id: "tender-123" });
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({
      page: "tender-detail",
      tender_id: "tender-123",
    });
  });

  it("returns workflow context for /workflows/[id]", () => {
    mockPathname.mockReturnValue("/workflows/wf-456");
    mockParams.mockReturnValue({ id: "wf-456" });
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({
      page: "workflow",
      case_id: "wf-456",
    });
  });

  it("returns project context for /projects/[id]", () => {
    mockPathname.mockReturnValue("/projects/proj-789");
    mockParams.mockReturnValue({ id: "proj-789" });
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({
      page: "project",
      case_id: "proj-789",
    });
  });

  it("returns decision context for /decisions/[id]", () => {
    mockPathname.mockReturnValue("/decisions/dec-000");
    mockParams.mockReturnValue({ id: "dec-000" });
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({
      page: "decision",
      case_id: "dec-000",
    });
  });

  it("returns generic page context for unmatched routes", () => {
    mockPathname.mockReturnValue("/settings");
    mockParams.mockReturnValue({});
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({ page: "/settings" });
  });

  it("returns root context for /", () => {
    mockPathname.mockReturnValue("/");
    mockParams.mockReturnValue({});
    const { result } = renderHook(() => useCopilotContext());
    expect(result.current).toEqual({ page: "/" });
  });
});
