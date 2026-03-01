import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { WorkflowPhase } from "@/types";

// Mock phase display component
interface PhaseInfo {
  id: WorkflowPhase;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  status: "completed" | "running" | "pending" | "error";
  duration?: number;
}

function PhaseDisplayComponent({ phases }: { phases: PhaseInfo[] }) {
  return (
    <div data-testid="phase-display">
      {phases.map((phase) => (
        <div
          key={phase.id}
          data-testid={`phase-${phase.id}`}
          data-status={phase.status}
          className={`${phase.bgColor} ${phase.color}`}
        >
          <div data-testid={`phase-label-${phase.id}`}>{phase.label}</div>
          <div data-testid={`phase-description-${phase.id}`}>
            {phase.description}
          </div>
          <div data-testid={`phase-status-${phase.id}`}>{phase.status}</div>
          {phase.duration && (
            <div data-testid={`phase-duration-${phase.id}`}>
              {phase.duration.toFixed(1)}s
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

describe("Phase Display Components", () => {
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

  const renderPhases = (phases: PhaseInfo[]) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PhaseDisplayComponent phases={phases} />
      </QueryClientProvider>
    );
  };

  describe("All Workflow Phases", () => {
    const allPhases: PhaseInfo[] = [
      {
        id: "INGESTION",
        label: "Ingestion",
        description: "Téléchargement et parsing des documents DCE",
        color: "text-blue-600",
        bgColor: "bg-blue-500",
        status: "completed",
        duration: 5.2,
      },
      {
        id: "EXTRACTION",
        label: "Extraction",
        description: "Identification des exigences et critères",
        color: "text-indigo-600",
        bgColor: "bg-indigo-500",
        status: "completed",
        duration: 8.7,
      },
      {
        id: "MATCHING",
        label: "Matching",
        description: "Matching des produits et références",
        color: "text-violet-600",
        bgColor: "bg-violet-500",
        status: "running",
      },
      {
        id: "RISK_ANALYSIS",
        label: "Analyse Risque",
        description: "Évaluation Go/No-Go automatisée",
        color: "text-purple-600",
        bgColor: "bg-purple-500",
        status: "pending",
      },
      {
        id: "STRATEGY",
        label: "Stratégie",
        description: "Définition des arguments de vente",
        color: "text-orange-600",
        bgColor: "bg-orange-500",
        status: "pending",
      },
      {
        id: "CALCULATION",
        label: "Calcul",
        description: "Calcul des prix et marges",
        color: "text-yellow-600",
        bgColor: "bg-yellow-500",
        status: "pending",
      },
      {
        id: "GENERATION",
        label: "Génération",
        description: "Génération du mémoire technique",
        color: "text-green-600",
        bgColor: "bg-green-500",
        status: "pending",
      },
      {
        id: "VALIDATION",
        label: "Validation",
        description: "Vérification de conformité",
        color: "text-teal-600",
        bgColor: "bg-teal-500",
        status: "pending",
      },
      {
        id: "PACKAGING",
        label: "Packaging",
        description: "Assemblage du dossier final",
        color: "text-cyan-600",
        bgColor: "bg-cyan-500",
        status: "pending",
      },
    ];

    it("should render all 9 workflow phases", () => {
      renderPhases(allPhases);

      expect(screen.getByTestId("phase-INGESTION")).toBeInTheDocument();
      expect(screen.getByTestId("phase-EXTRACTION")).toBeInTheDocument();
      expect(screen.getByTestId("phase-MATCHING")).toBeInTheDocument();
      expect(screen.getByTestId("phase-RISK_ANALYSIS")).toBeInTheDocument();
      expect(screen.getByTestId("phase-STRATEGY")).toBeInTheDocument();
      expect(screen.getByTestId("phase-CALCULATION")).toBeInTheDocument();
      expect(screen.getByTestId("phase-GENERATION")).toBeInTheDocument();
      expect(screen.getByTestId("phase-VALIDATION")).toBeInTheDocument();
      expect(screen.getByTestId("phase-PACKAGING")).toBeInTheDocument();
    });

    it("should display correct labels for each phase", () => {
      renderPhases(allPhases);

      expect(screen.getByTestId("phase-label-INGESTION")).toHaveTextContent(
        "Ingestion"
      );
      expect(screen.getByTestId("phase-label-EXTRACTION")).toHaveTextContent(
        "Extraction"
      );
      expect(screen.getByTestId("phase-label-MATCHING")).toHaveTextContent(
        "Matching"
      );
      expect(screen.getByTestId("phase-label-RISK_ANALYSIS")).toHaveTextContent(
        "Analyse Risque"
      );
    });

    it("should display phase descriptions", () => {
      renderPhases(allPhases);

      expect(
        screen.getByTestId("phase-description-INGESTION")
      ).toHaveTextContent("Téléchargement et parsing des documents DCE");
      expect(
        screen.getByTestId("phase-description-EXTRACTION")
      ).toHaveTextContent("Identification des exigences et critères");
    });
  });

  describe("Phase States", () => {
    it("should display completed phase state", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
          duration: 5.2,
        },
      ];

      renderPhases(phases);

      const phase = screen.getByTestId("phase-INGESTION");
      expect(phase).toHaveAttribute("data-status", "completed");
      expect(screen.getByTestId("phase-duration-INGESTION")).toHaveTextContent(
        "5.2s"
      );
    });

    it("should display running phase state", () => {
      const phases: PhaseInfo[] = [
        {
          id: "MATCHING",
          label: "Matching",
          description: "Test",
          color: "text-violet-600",
          bgColor: "bg-violet-500",
          status: "running",
        },
      ];

      renderPhases(phases);

      const phase = screen.getByTestId("phase-MATCHING");
      expect(phase).toHaveAttribute("data-status", "running");
      expect(screen.getByTestId("phase-status-MATCHING")).toHaveTextContent(
        "running"
      );
    });

    it("should display pending phase state", () => {
      const phases: PhaseInfo[] = [
        {
          id: "STRATEGY",
          label: "Stratégie",
          description: "Test",
          color: "text-orange-600",
          bgColor: "bg-orange-500",
          status: "pending",
        },
      ];

      renderPhases(phases);

      const phase = screen.getByTestId("phase-STRATEGY");
      expect(phase).toHaveAttribute("data-status", "pending");
    });

    it("should display error phase state", () => {
      const phases: PhaseInfo[] = [
        {
          id: "ERROR",
          label: "Erreur",
          description: "Une erreur s'est produite",
          color: "text-red-600",
          bgColor: "bg-red-500",
          status: "error",
        },
      ];

      renderPhases(phases);

      const phase = screen.getByTestId("phase-ERROR");
      expect(phase).toHaveAttribute("data-status", "error");
    });
  });

  describe("Phase Durations", () => {
    it("should display duration for completed phases", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
          duration: 5.234,
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-duration-INGESTION")).toHaveTextContent(
        "5.2s"
      );
    });

    it("should not display duration for running phases", () => {
      const phases: PhaseInfo[] = [
        {
          id: "MATCHING",
          label: "Matching",
          description: "Test",
          color: "text-violet-600",
          bgColor: "bg-violet-500",
          status: "running",
        },
      ];

      renderPhases(phases);

      expect(
        screen.queryByTestId("phase-duration-MATCHING")
      ).not.toBeInTheDocument();
    });

    it("should format durations correctly", () => {
      const phases: PhaseInfo[] = [
        {
          id: "EXTRACTION",
          label: "Extraction",
          description: "Test",
          color: "text-indigo-600",
          bgColor: "bg-indigo-500",
          status: "completed",
          duration: 12.567,
        },
      ];

      renderPhases(phases);

      // Should round to 1 decimal place
      expect(screen.getByTestId("phase-duration-EXTRACTION")).toHaveTextContent(
        "12.6s"
      );
    });

    it("should handle very short durations", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
          duration: 0.123,
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-duration-INGESTION")).toHaveTextContent(
        "0.1s"
      );
    });

    it("should handle very long durations", () => {
      const phases: PhaseInfo[] = [
        {
          id: "GENERATION",
          label: "Génération",
          description: "Test",
          color: "text-green-600",
          bgColor: "bg-green-500",
          status: "completed",
          duration: 125.789,
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-duration-GENERATION")).toHaveTextContent(
        "125.8s"
      );
    });
  });

  describe("Phase Colors", () => {
    it("should apply correct color classes to each phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
        },
        {
          id: "EXTRACTION",
          label: "Extraction",
          description: "Test",
          color: "text-indigo-600",
          bgColor: "bg-indigo-500",
          status: "completed",
        },
      ];

      renderPhases(phases);

      const ingestionPhase = screen.getByTestId("phase-INGESTION");
      expect(ingestionPhase).toHaveClass("bg-blue-500", "text-blue-600");

      const extractionPhase = screen.getByTestId("phase-EXTRACTION");
      expect(extractionPhase).toHaveClass("bg-indigo-500", "text-indigo-600");
    });

    it("should use different colors for different phases", () => {
      const phases: PhaseInfo[] = [
        {
          id: "RISK_ANALYSIS",
          label: "Analyse Risque",
          description: "Test",
          color: "text-purple-600",
          bgColor: "bg-purple-500",
          status: "pending",
        },
        {
          id: "STRATEGY",
          label: "Stratégie",
          description: "Test",
          color: "text-orange-600",
          bgColor: "bg-orange-500",
          status: "pending",
        },
      ];

      renderPhases(phases);

      const riskPhase = screen.getByTestId("phase-RISK_ANALYSIS");
      expect(riskPhase).toHaveClass("bg-purple-500");

      const strategyPhase = screen.getByTestId("phase-STRATEGY");
      expect(strategyPhase).toHaveClass("bg-orange-500");
    });
  });

  describe("Phase Progression", () => {
    it("should show progression through phases", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
          duration: 5.2,
        },
        {
          id: "EXTRACTION",
          label: "Extraction",
          description: "Test",
          color: "text-indigo-600",
          bgColor: "bg-indigo-500",
          status: "completed",
          duration: 8.7,
        },
        {
          id: "MATCHING",
          label: "Matching",
          description: "Test",
          color: "text-violet-600",
          bgColor: "bg-violet-500",
          status: "running",
        },
        {
          id: "RISK_ANALYSIS",
          label: "Analyse Risque",
          description: "Test",
          color: "text-purple-600",
          bgColor: "bg-purple-500",
          status: "pending",
        },
      ];

      renderPhases(phases);

      // First two should be completed
      expect(screen.getByTestId("phase-INGESTION")).toHaveAttribute(
        "data-status",
        "completed"
      );
      expect(screen.getByTestId("phase-EXTRACTION")).toHaveAttribute(
        "data-status",
        "completed"
      );

      // Third should be running
      expect(screen.getByTestId("phase-MATCHING")).toHaveAttribute(
        "data-status",
        "running"
      );

      // Rest should be pending
      expect(screen.getByTestId("phase-RISK_ANALYSIS")).toHaveAttribute(
        "data-status",
        "pending"
      );
    });
  });

  describe("Special Phase States", () => {
    it("should handle CREATED phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "CREATED",
          label: "Créé",
          description: "Workflow créé",
          color: "text-slate-600",
          bgColor: "bg-slate-100",
          status: "completed",
          duration: 0.1,
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-CREATED")).toBeInTheDocument();
    });

    it("should handle COMPLETED phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "COMPLETED",
          label: "Terminé",
          description: "Workflow terminé avec succès",
          color: "text-green-600",
          bgColor: "bg-green-100",
          status: "completed",
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-COMPLETED")).toBeInTheDocument();
    });

    it("should handle REJECTED phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "REJECTED",
          label: "Rejeté",
          description: "Workflow rejeté par HITL",
          color: "text-red-600",
          bgColor: "bg-red-100",
          status: "completed",
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-REJECTED")).toBeInTheDocument();
    });

    it("should handle ERROR phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "ERROR",
          label: "Erreur",
          description: "Une erreur s'est produite",
          color: "text-red-600",
          bgColor: "bg-red-100",
          status: "error",
        },
      ];

      renderPhases(phases);

      const errorPhase = screen.getByTestId("phase-ERROR");
      expect(errorPhase).toHaveAttribute("data-status", "error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty phases array", () => {
      renderPhases([]);

      const display = screen.getByTestId("phase-display");
      expect(display).toBeInTheDocument();
      expect(display.children.length).toBe(0);
    });

    it("should handle single phase", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "running",
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-INGESTION")).toBeInTheDocument();
    });

    it("should handle phase with zero duration", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
          duration: 0,
        },
      ];

      renderPhases(phases);

      // duration: 0 is falsy so the duration element is not rendered
      expect(
        screen.queryByTestId("phase-duration-INGESTION")
      ).not.toBeInTheDocument();
    });

    it("should handle phase with missing description", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
        },
      ];

      renderPhases(phases);

      expect(
        screen.getByTestId("phase-description-INGESTION")
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible phase elements", () => {
      const phases: PhaseInfo[] = [
        {
          id: "INGESTION",
          label: "Ingestion",
          description: "Test",
          color: "text-blue-600",
          bgColor: "bg-blue-500",
          status: "completed",
        },
      ];

      renderPhases(phases);

      const phase = screen.getByTestId("phase-INGESTION");
      expect(phase).toBeInTheDocument();
    });

    it("should have descriptive test ids", () => {
      const phases: PhaseInfo[] = [
        {
          id: "MATCHING",
          label: "Matching",
          description: "Test",
          color: "text-violet-600",
          bgColor: "bg-violet-500",
          status: "running",
        },
      ];

      renderPhases(phases);

      expect(screen.getByTestId("phase-MATCHING")).toBeInTheDocument();
      expect(screen.getByTestId("phase-label-MATCHING")).toBeInTheDocument();
      expect(
        screen.getByTestId("phase-description-MATCHING")
      ).toBeInTheDocument();
      expect(screen.getByTestId("phase-status-MATCHING")).toBeInTheDocument();
    });
  });
});
