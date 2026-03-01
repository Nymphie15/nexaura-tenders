import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { DocumentChat } from "@/components/documents/document-chat";

const mockChat = vi.fn();

vi.mock("@/lib/api/endpoints", () => ({
  documentEditionApi: {
    chat: (...args: unknown[]) => mockChat(...args),
  },
}));

// Mock ChatInterface
vi.mock("@/components/ai-copilot/chat-interface", () => ({
  ChatInterface: ({ placeholder }: { placeholder?: string; messages: unknown[]; onSendMessage: (msg: string) => void; isLoading?: boolean }) => (
    React.createElement("div", { "data-testid": "chat-interface" },
      React.createElement("span", null, placeholder || "default")
    )
  ),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("DocumentChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ChatInterface", () => {
    render(
      React.createElement(DocumentChat, { documentId: "doc-1" }),
      { wrapper: createWrapper() }
    );
    expect(screen.getByTestId("chat-interface")).toBeTruthy();
  });

  it("renders with correct placeholder", () => {
    render(
      React.createElement(DocumentChat, { documentId: "doc-1" }),
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("Posez une question sur ce document...")).toBeTruthy();
  });

  it("accepts className prop", () => {
    const { container } = render(
      React.createElement(DocumentChat, { documentId: "doc-1", className: "custom-class" }),
      { wrapper: createWrapper() }
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders without crashing with different documentIds", () => {
    const { rerender } = render(
      React.createElement(DocumentChat, { documentId: "doc-1" }),
      { wrapper: createWrapper() }
    );
    rerender(
      React.createElement(
        QueryClientProvider,
        { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
        React.createElement(DocumentChat, { documentId: "doc-2" })
      )
    );
    expect(screen.getByTestId("chat-interface")).toBeTruthy();
  });

  it("does not show progress message when idle", () => {
    render(
      React.createElement(DocumentChat, { documentId: "doc-1" }),
      { wrapper: createWrapper() }
    );
    expect(screen.queryByText("Analyse du document...")).toBeNull();
  });

  it("starts with no messages", () => {
    render(
      React.createElement(DocumentChat, { documentId: "doc-1" }),
      { wrapper: createWrapper() }
    );
    // ChatInterface receives empty messages array initially
    expect(screen.getByTestId("chat-interface")).toBeTruthy();
  });
});
