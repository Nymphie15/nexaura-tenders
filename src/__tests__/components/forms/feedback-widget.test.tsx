/**
 * @file feedback-widget.test.tsx
 * @description Tests unitaires pour le composant FeedbackWidget
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FeedbackWidget } from '@/components/feedback/feedback-widget';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

// Mock the hooks
vi.mock('@/hooks/use-feedback', () => ({
  useFeedback: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useInlineFeedback: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useCorrectionHistory: vi.fn(() => ({
    data: [],
  })),
  useElementFeedback: vi.fn(() => ({
    data: null,
  })),
}));

// Mock the InlineEditor component
vi.mock('@/components/feedback/inline-editor', () => ({
  InlineEditor: ({ onSubmit, onCancel, label }: {
    onSubmit: (value: string) => void;
    onCancel: () => void;
    label?: string;
  }) => (
    <div data-testid="inline-editor">
      <span>{label}</span>
      <button onClick={() => onSubmit('corrected text')}>Soumettre</button>
      <button onClick={onCancel}>Annuler</button>
    </div>
  ),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useFeedback, useInlineFeedback, useCorrectionHistory } from '@/hooks/use-feedback';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const defaultProps = {
  elementId: 'test-element',
  originalValue: 'Test content to provide feedback on',
  phase: 'extraction',
  caseId: 'case-123',
};

describe('FeedbackWidget', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockSubmitLegacy: ReturnType<typeof vi.fn>;
  let mockSubmitInline: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    mockSubmitLegacy = vi.fn();
    mockSubmitInline = vi.fn();

    vi.mocked(useFeedback).mockReturnValue({
      mutate: mockSubmitLegacy,
      isPending: false,
    } as ReturnType<typeof useFeedback>);

    vi.mocked(useInlineFeedback).mockReturnValue({
      mutate: mockSubmitInline,
      isPending: false,
    } as ReturnType<typeof useInlineFeedback>);

    vi.mocked(useCorrectionHistory).mockReturnValue({
      data: [],
    } as ReturnType<typeof useCorrectionHistory>);
  });

  describe('Rendu initial', () => {
    it('affiche le bouton Pouce en haut', () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /J'aime cette suggestion/i })).toBeInTheDocument();
    });

    it('affiche le bouton Pouce en bas', () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Cette suggestion peut/i })).toBeInTheDocument();
    });

    it('affiche le bouton Modifier', () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Modifier cette suggestion/i })).toBeInTheDocument();
    });

    it('affiche le bouton Historique', () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /Historique des corrections/i })).toBeInTheDocument();
    });

    it('applique le role group et un aria-label', () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label');
    });

    it('applique le label personnalise', () => {
      render(<FeedbackWidget {...defaultProps} label="Mon feedback" />, { wrapper: createWrapper() });

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-label', 'Mon feedback');
    });

    it('cache le bouton historique si showHistory=false', () => {
      render(<FeedbackWidget {...defaultProps} showHistory={false} />, { wrapper: createWrapper() });

      expect(screen.queryByRole('button', { name: /Historique des corrections/i })).not.toBeInTheDocument();
    });
  });

  describe('Feedback rapide - mode legacy', () => {
    it('appelle submitLegacyFeedback avec thumbs_up', async () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const thumbsUpButton = screen.getByRole('button', { name: /J'aime cette suggestion/i });
      await user.click(thumbsUpButton);

      expect(mockSubmitLegacy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'thumbs_up',
          elementId: 'test-element',
          phase: 'extraction',
        }),
        expect.any(Object)
      );
    });

    it('appelle submitLegacyFeedback avec thumbs_down', async () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const thumbsDownButton = screen.getByRole('button', { name: /Cette suggestion peut/i });
      await user.click(thumbsDownButton);

      expect(mockSubmitLegacy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'thumbs_down',
          elementId: 'test-element',
        }),
        expect.any(Object)
      );
    });

    it('desactive les boutons pendant la soumission', () => {
      vi.mocked(useFeedback).mockReturnValue({
        mutate: mockSubmitLegacy,
        isPending: true,
      } as ReturnType<typeof useFeedback>);

      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      expect(screen.getByRole('button', { name: /J'aime cette suggestion/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Cette suggestion peut/i })).toBeDisabled();
    });
  });

  describe('Feedback inline - mode realtime', () => {
    it('utilise submitInlineFeedback quand useRealtimeFeedback=true', async () => {
      render(
        <FeedbackWidget {...defaultProps} useRealtimeFeedback={true} workflowId="workflow-456" />,
        { wrapper: createWrapper() }
      );

      const thumbsUpButton = screen.getByRole('button', { name: /J'aime cette suggestion/i });
      await user.click(thumbsUpButton);

      expect(mockSubmitInline).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: 'workflow-456',
          feedback_type: 'thumbs_up',
          element_id: 'test-element',
        }),
        expect.any(Object)
      );
    });

    it('inclut le workflowId dans la requete inline', async () => {
      render(
        <FeedbackWidget {...defaultProps} useRealtimeFeedback={true} workflowId="wf-789" />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByRole('button', { name: /Cette suggestion peut/i }));

      expect(mockSubmitInline).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: 'wf-789',
          feedback_type: 'thumbs_down',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Editeur inline', () => {
    it('affiche l\'editeur au clic sur Modifier', async () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /Modifier cette suggestion/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-editor')).toBeInTheDocument();
      });
    });

    it('cache l\'editeur au clic sur Annuler', async () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /Modifier cette suggestion/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-editor')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Annuler/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('inline-editor')).not.toBeInTheDocument();
      });
    });

    it('soumet la correction au clic sur Soumettre', async () => {
      render(<FeedbackWidget {...defaultProps} />, { wrapper: createWrapper() });

      const editButton = screen.getByRole('button', { name: /Modifier cette suggestion/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-editor')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Soumettre/i });
      await user.click(submitButton);

      expect(mockSubmitLegacy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'edit',
          original: 'Test content to provide feedback on',
          corrected: 'corrected text',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Orientation', () => {
    it('applique flex-row pour l\'orientation horizontale (defaut)', () => {
      render(<FeedbackWidget {...defaultProps} orientation="horizontal" />, { wrapper: createWrapper() });

      const quickActions = document.querySelector('.quick-actions');
      expect(quickActions).toBeTruthy();
      expect(quickActions?.className).not.toContain('flex-col');
    });

    it('applique flex-col pour l\'orientation verticale', () => {
      render(<FeedbackWidget {...defaultProps} orientation="vertical" />, { wrapper: createWrapper() });

      const quickActions = document.querySelector('.quick-actions');
      expect(quickActions).toBeTruthy();
      expect(quickActions?.className).toContain('flex-col');
    });
  });

  describe('Classes CSS', () => {
    it('applique le className a l\'element feedback-widget', () => {
      render(
        <FeedbackWidget {...defaultProps} className="my-custom-class" />,
        { wrapper: createWrapper() }
      );

      const widget = document.querySelector('.feedback-widget');
      expect(widget).toBeTruthy();
      expect(widget?.className).toContain('my-custom-class');
    });
  });

  describe('Tailles', () => {
    it('rend en taille sm sans erreur', () => {
      expect(() => {
        render(<FeedbackWidget {...defaultProps} size="sm" />, { wrapper: createWrapper() });
      }).not.toThrow();
    });

    it('rend en taille lg sans erreur', () => {
      expect(() => {
        render(<FeedbackWidget {...defaultProps} size="lg" />, { wrapper: createWrapper() });
      }).not.toThrow();
    });
  });

  describe('Callback onFeedbackSubmit', () => {
    it('appelle onFeedbackSubmit apres feedback positif', async () => {
      const onFeedbackSubmit = vi.fn();

      // Simulate successful mutation
      vi.mocked(useFeedback).mockReturnValue({
        mutate: (data: unknown, options: { onSuccess?: () => void }) => {
          options?.onSuccess?.();
        },
        isPending: false,
      } as ReturnType<typeof useFeedback>);

      render(
        <FeedbackWidget {...defaultProps} onFeedbackSubmit={onFeedbackSubmit} />,
        { wrapper: createWrapper() }
      );

      await user.click(screen.getByRole('button', { name: /J'aime cette suggestion/i }));

      expect(onFeedbackSubmit).toHaveBeenCalledWith('thumbs_up');
    });
  });
});
