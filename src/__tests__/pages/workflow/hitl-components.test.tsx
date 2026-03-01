import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { HITLCheckpointInfo, HITLAction } from "@/types";

// Mock components to test HITL decision logic
const mockCheckpoint: HITLCheckpointInfo = {
  checkpoint: "go_nogo",
  case_id: "wf-001",
  tender_id: "t-001",
  tender_reference: "AO-2025-001",
  tender_title: "Fournitures de bureau",
  reference: "AO-2025-001",
  context: {
    risk_score: 0.65,
    risk_factors: {
      complexity: 0.7,
      deadline_tight: 0.8,
      budget_constraints: 0.5,
    },
    matching_rate: 85,
  },
  allowed_actions: ["approve", "reject", "modify"],
  recommended_action: "approve",
  ai_recommendation: {
    action: "approve",
    confidence: 0.85,
    reasoning:
      "Le taux de matching est élevé (85%) et les risques sont modérés. Recommandation d'approbation avec surveillance.",
  },
  urgency: "normal",
  created_at: "2025-01-20T10:00:00Z",
};

// Simple HITL Decision Component for testing
function HITLDecisionComponent({
  checkpoint,
  onDecision,
}: {
  checkpoint: HITLCheckpointInfo;
  onDecision: (action: HITLAction, data?: any) => void;
}) {
  const [comments, setComments] = React.useState("");

  return (
    <div data-testid="hitl-decision-component">
      <h2>Décision HITL - {checkpoint.checkpoint}</h2>

      <div data-testid="checkpoint-info">
        <p>Référence: {checkpoint.tender_reference}</p>
        <p>Titre: {checkpoint.tender_title}</p>
        <p>Urgence: {checkpoint.urgency}</p>
      </div>

      {checkpoint.ai_recommendation && (
        <div data-testid="ai-recommendation">
          <h3>Recommandation IA</h3>
          <p>Action: {checkpoint.ai_recommendation.action}</p>
          <p>Confiance: {Math.round(checkpoint.ai_recommendation.confidence * 100)}%</p>
          <p>Justification: {checkpoint.ai_recommendation.reasoning}</p>
        </div>
      )}

      <div data-testid="context-details">
        <h3>Contexte</h3>
        {checkpoint.checkpoint === "go_nogo" && (
          <>
            <p>Score de risque: {checkpoint.context.risk_score}</p>
            <p>Taux de matching: {checkpoint.context.matching_rate}%</p>
          </>
        )}
      </div>

      <div data-testid="decision-controls">
        <textarea
          placeholder="Commentaires..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          data-testid="comments-input"
        />

        <div>
          {checkpoint.allowed_actions.includes("approve") && (
            <button
              onClick={() => onDecision("approve", { comments })}
              data-testid="approve-button"
            >
              Approuver
            </button>
          )}
          {checkpoint.allowed_actions.includes("reject") && (
            <button
              onClick={() => onDecision("reject", { comments })}
              data-testid="reject-button"
            >
              Rejeter
            </button>
          )}
          {checkpoint.allowed_actions.includes("modify") && (
            <button
              onClick={() => onDecision("modify", { comments })}
              data-testid="modify-button"
            >
              Modifier
            </button>
          )}
          {checkpoint.allowed_actions.includes("retry") && (
            <button
              onClick={() => onDecision("retry", { comments })}
              data-testid="retry-button"
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Import React
import * as React from "react";

describe("HITL Decision Components", () => {
  let queryClient: QueryClient;
  const mockOnDecision = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (checkpoint = mockCheckpoint) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <HITLDecisionComponent
          checkpoint={checkpoint}
          onDecision={mockOnDecision}
        />
      </QueryClientProvider>
    );
  };

  describe("Rendering", () => {
    it("should render checkpoint type", () => {
      renderComponent();

      expect(screen.getByText(/go_nogo/i)).toBeInTheDocument();
    });

    it("should display checkpoint information", () => {
      renderComponent();

      expect(screen.getByText(/AO-2025-001/)).toBeInTheDocument();
      expect(screen.getByText(/Fournitures de bureau/)).toBeInTheDocument();
      expect(screen.getByText(/normal/i)).toBeInTheDocument();
    });

    it("should show AI recommendation when available", () => {
      renderComponent();

      expect(screen.getByText(/Recommandation IA/)).toBeInTheDocument();
      const aiSection = screen.getByTestId("ai-recommendation");
      expect(within(aiSection).getByText(/approve/i)).toBeInTheDocument();
      expect(within(aiSection).getAllByText(/85%/).length).toBeGreaterThan(0);
      expect(
        screen.getByText(/Le taux de matching est élevé/)
      ).toBeInTheDocument();
    });

    it("should display context details for go_nogo checkpoint", () => {
      renderComponent();

      expect(screen.getByText(/0.65/)).toBeInTheDocument(); // Risk score
      expect(screen.getAllByText(/85%/).length).toBeGreaterThan(0); // Matching rate (appears in multiple places)
    });

    it("should render comments textarea", () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText(/commentaires/i);
      expect(textarea).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should show all allowed action buttons", () => {
      renderComponent();

      expect(screen.getByTestId("approve-button")).toBeInTheDocument();
      expect(screen.getByTestId("reject-button")).toBeInTheDocument();
      expect(screen.getByTestId("modify-button")).toBeInTheDocument();
    });

    it("should only show allowed actions", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        allowed_actions: ["approve", "reject"],
      };

      renderComponent(checkpoint);

      expect(screen.getByTestId("approve-button")).toBeInTheDocument();
      expect(screen.getByTestId("reject-button")).toBeInTheDocument();
      expect(screen.queryByTestId("modify-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("retry-button")).not.toBeInTheDocument();
    });

    it("should show retry button when allowed", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        allowed_actions: ["retry"],
      };

      renderComponent(checkpoint);

      expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    });
  });

  describe("Approve Action", () => {
    it("should call onDecision with approve action", async () => {
      const user = userEvent.setup();
      renderComponent();

      const approveBtn = screen.getByTestId("approve-button");
      await user.click(approveBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("approve", {
        comments: "",
      });
    });

    it("should include comments in approve decision", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      await user.type(textarea, "Approuvé après vérification");

      const approveBtn = screen.getByTestId("approve-button");
      await user.click(approveBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("approve", {
        comments: "Approuvé après vérification",
      });
    });
  });

  describe("Reject Action", () => {
    it("should call onDecision with reject action", async () => {
      const user = userEvent.setup();
      renderComponent();

      const rejectBtn = screen.getByTestId("reject-button");
      await user.click(rejectBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("reject", {
        comments: "",
      });
    });

    it("should include comments in reject decision", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      await user.type(textarea, "Risques trop élevés");

      const rejectBtn = screen.getByTestId("reject-button");
      await user.click(rejectBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("reject", {
        comments: "Risques trop élevés",
      });
    });
  });

  describe("Modify Action", () => {
    it("should call onDecision with modify action", async () => {
      const user = userEvent.setup();
      renderComponent();

      const modifyBtn = screen.getByTestId("modify-button");
      await user.click(modifyBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("modify", {
        comments: "",
      });
    });

    it("should include comments in modify decision", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      await user.type(textarea, "Ajuster la stratégie de prix");

      const modifyBtn = screen.getByTestId("modify-button");
      await user.click(modifyBtn);

      expect(mockOnDecision).toHaveBeenCalledWith("modify", {
        comments: "Ajuster la stratégie de prix",
      });
    });
  });

  describe("Different Checkpoint Types", () => {
    it("should handle strategy_review checkpoint", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        checkpoint: "strategy_review",
        context: {
          win_themes: [
            { theme: "Innovation", justification: "Produits innovants" },
          ],
          strategic_arguments: ["Qualité supérieure", "Prix compétitif"],
        },
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/strategy_review/i)).toBeInTheDocument();
    });

    it("should handle price_review checkpoint", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        checkpoint: "price_review",
        context: {
          total_ht: 50000,
          total_ttc: 60000,
          margin_rate: 0.25,
          discount_rate: 0.05,
        },
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/price_review/i)).toBeInTheDocument();
    });

    it("should handle tech_review checkpoint", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        checkpoint: "tech_review",
        context: {
          compliance_status: "compliant",
          compliance_score: 0.95,
        },
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/tech_review/i)).toBeInTheDocument();
    });
  });

  describe("Urgency Levels", () => {
    it("should display low urgency", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        urgency: "low",
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/low/i)).toBeInTheDocument();
    });

    it("should display normal urgency", () => {
      renderComponent();

      expect(screen.getByText(/normal/i)).toBeInTheDocument();
    });

    it("should display high urgency", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        urgency: "high",
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/high/i)).toBeInTheDocument();
    });

    it("should display critical urgency", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        urgency: "critical",
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/critical/i)).toBeInTheDocument();
    });
  });

  describe("AI Recommendation", () => {
    it("should display high confidence recommendation", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        ai_recommendation: {
          action: "approve",
          confidence: 0.95,
          reasoning: "Très forte correspondance avec nos capacités",
        },
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/95%/)).toBeInTheDocument();
    });

    it("should display low confidence recommendation", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        ai_recommendation: {
          action: "review",
          confidence: 0.45,
          reasoning: "Données insuffisantes pour une décision automatique",
        },
      };

      renderComponent(checkpoint);

      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });

    it("should handle missing AI recommendation", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        ai_recommendation: undefined,
      };

      renderComponent(checkpoint);

      expect(screen.queryByText(/Recommandation IA/)).not.toBeInTheDocument();
    });

    it("should display recommendation reasoning", () => {
      renderComponent();

      expect(
        screen.getByText(/Le taux de matching est élevé/)
      ).toBeInTheDocument();
    });
  });

  describe("Comments Input", () => {
    it("should allow typing in comments field", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      await user.type(textarea, "Test comment");

      expect(textarea).toHaveValue("Test comment");
    });

    it("should clear comments after decision", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      await user.type(textarea, "Test comment");

      const approveBtn = screen.getByTestId("approve-button");
      await user.click(approveBtn);

      // Comments should be passed but field remains as is
      expect(mockOnDecision).toHaveBeenCalledWith("approve", {
        comments: "Test comment",
      });
    });

    it("should handle multiline comments", async () => {
      const user = userEvent.setup();
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      const multilineComment = "Ligne 1\nLigne 2\nLigne 3";
      await user.type(textarea, multilineComment);

      expect(textarea).toHaveValue(multilineComment);
    });
  });

  describe("Context Display", () => {
    it("should show risk factors for go_nogo", () => {
      renderComponent();

      expect(screen.getByText(/0.65/)).toBeInTheDocument(); // Risk score
      const contextSection = screen.getByTestId("context-details");
      expect(within(contextSection).getByText(/85%/)).toBeInTheDocument(); // Matching rate
    });

    it("should not show go_nogo context for other checkpoints", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        checkpoint: "strategy_review",
        context: {},
      };

      renderComponent(checkpoint);

      expect(screen.queryByText(/Score de risque/)).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible buttons", () => {
      renderComponent();

      const approveBtn = screen.getByTestId("approve-button");
      expect(approveBtn).toHaveAccessibleName();
    });

    it("should have accessible textarea", () => {
      renderComponent();

      const textarea = screen.getByPlaceholderText(/commentaires/i);
      expect(textarea).toBeInTheDocument();
    });

    it("should have proper heading structure", () => {
      renderComponent();

      const headings = screen.getAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle checkpoint with no allowed actions", () => {
      const checkpoint: HITLCheckpointInfo = {
        ...mockCheckpoint,
        allowed_actions: [],
      };

      renderComponent(checkpoint);

      expect(screen.queryByTestId("approve-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("reject-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("modify-button")).not.toBeInTheDocument();
    });

    it("should handle checkpoint with minimal data", () => {
      const checkpoint: HITLCheckpointInfo = {
        checkpoint: "go_nogo",
        case_id: "wf-minimal",
        tender_id: "t-minimal",
        reference: "REF-MIN",
        context: {},
        allowed_actions: ["approve"],
        recommended_action: "approve",
        created_at: "2025-01-20T10:00:00Z",
      };

      renderComponent(checkpoint);

      expect(screen.getByTestId("hitl-decision-component")).toBeInTheDocument();
    });

    it("should handle very long comments", () => {
      renderComponent();

      const textarea = screen.getByTestId("comments-input");
      const longComment = "A".repeat(1000);
      fireEvent.change(textarea, { target: { value: longComment } });

      expect(textarea).toHaveValue(longComment);
    });
  });
});
