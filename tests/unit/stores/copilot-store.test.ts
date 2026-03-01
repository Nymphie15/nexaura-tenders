import { describe, it, expect, beforeEach } from "vitest";
import { useCopilotStore } from "@/stores/copilot-store";

describe("copilot-store", () => {
  beforeEach(() => {
    // Reset store between tests
    useCopilotStore.setState({
      isOpen: false,
      currentContext: null,
    });
  });

  it("starts closed", () => {
    expect(useCopilotStore.getState().isOpen).toBe(false);
  });

  it("toggle opens when closed", () => {
    useCopilotStore.getState().toggle();
    expect(useCopilotStore.getState().isOpen).toBe(true);
  });

  it("toggle closes when open", () => {
    useCopilotStore.getState().open();
    useCopilotStore.getState().toggle();
    expect(useCopilotStore.getState().isOpen).toBe(false);
  });

  it("open sets isOpen to true", () => {
    useCopilotStore.getState().open();
    expect(useCopilotStore.getState().isOpen).toBe(true);
  });

  it("close sets isOpen to false", () => {
    useCopilotStore.getState().open();
    useCopilotStore.getState().close();
    expect(useCopilotStore.getState().isOpen).toBe(false);
  });

  it("setContext updates currentContext", () => {
    const ctx = { page: "project", case_id: "abc-123" };
    useCopilotStore.getState().setContext(ctx);
    expect(useCopilotStore.getState().currentContext).toEqual(ctx);
  });

  it("starts with null context", () => {
    expect(useCopilotStore.getState().currentContext).toBeNull();
  });

  it("persists isOpen to sessionStorage", () => {
    useCopilotStore.getState().open();
    // Zustand persist writes to storage synchronously
    const stored = sessionStorage.getItem("copilot-storage");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.isOpen).toBe(true);
  });
});
