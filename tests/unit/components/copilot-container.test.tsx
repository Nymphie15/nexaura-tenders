import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock copilot-store
const mockClose = vi.fn();
const mockSetContext = vi.fn();
let mockIsOpen = true;

vi.mock("@/stores/copilot-store", () => ({
  useCopilotStore: vi.fn((selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      isOpen: mockIsOpen,
      close: mockClose,
      setContext: mockSetContext,
      currentContext: null,
    };
    return selector ? selector(state) : state;
  }),
}));

// Mock copilot-context
vi.mock("@/hooks/use-copilot-context", () => ({
  useCopilotContext: () => ({ page: "/dashboard" }),
}));

// Mock copilot-chat
const mockSendMessage = vi.fn().mockResolvedValue(undefined);
const mockReconnect = vi.fn();
const mockClearMessages = vi.fn();

vi.mock("@/hooks/use-copilot-chat", () => ({
  useCopilotChat: () => ({
    messages: [],
    isTyping: false,
    isConnected: true,
    connectionError: false,
    sendMessage: mockSendMessage,
    reconnect: mockReconnect,
    clearMessages: mockClearMessages,
  }),
}));

// Mock ChatInterface
vi.mock("@/components/ai-copilot/chat-interface", () => ({
  ChatInterface: ({ onSendMessage, placeholder }: { onSendMessage: (msg: string) => void; placeholder?: string }) => (
    React.createElement("div", { "data-testid": "chat-interface" },
      React.createElement("input", {
        "data-testid": "chat-input",
        placeholder: placeholder,
        onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === "Enter") onSendMessage((e.target as HTMLInputElement).value);
        },
      })
    )
  ),
}));

// Mock QuickActions
vi.mock("@/components/ai-copilot/quick-actions", () => ({
  QuickActions: ({ onActionClick }: { onActionClick: (action: { prompt: string }) => void }) => (
    React.createElement("div", { "data-testid": "quick-actions" },
      React.createElement("button", {
        "data-testid": "quick-action-btn",
        onClick: () => onActionClick({ prompt: "test action" }),
      }, "Action")
    )
  ),
}));

// Mock Sheet components
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? React.createElement("div", { "data-testid": "sheet" }, children) : null,
  SheetContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "sheet-content" }, children),
  SheetHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  SheetTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", null, children),
}));

import { CopilotContainer } from "@/components/ai-copilot/copilot-container";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("CopilotContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOpen = true;
  });

  it("renders when isOpen is true", () => {
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(screen.getByTestId("sheet")).toBeTruthy();
  });

  it("does not render when isOpen is false", () => {
    mockIsOpen = false;
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(screen.queryByTestId("sheet")).toBeNull();
  });

  it("renders ChatInterface", () => {
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(screen.getByTestId("chat-interface")).toBeTruthy();
  });

  it("renders QuickActions when no messages", () => {
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(screen.getByTestId("quick-actions")).toBeTruthy();
  });

  it("renders Assistant IA title", () => {
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(screen.getByText("Assistant IA")).toBeTruthy();
  });

  it("syncs context on mount", () => {
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    expect(mockSetContext).toHaveBeenCalledWith({ page: "/dashboard" });
  });

  it("sends message when quick action is clicked", async () => {
    const user = userEvent.setup();
    render(React.createElement(CopilotContainer), { wrapper: createWrapper() });
    await user.click(screen.getByTestId("quick-action-btn"));
    expect(mockSendMessage).toHaveBeenCalledWith("test action");
  });
});
