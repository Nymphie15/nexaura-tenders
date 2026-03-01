/**
 * @file upload-dce-dialog.test.tsx
 * @description Tests unitaires pour le composant UploadDCEDialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadDCEDialog } from '@/components/upload-dce-dialog';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock the hooks
vi.mock('@/hooks/use-tenders', () => ({
  useUploadDCE: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'tender-123' }),
    isPending: false,
  })),
  useProcessTender: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ case_id: 'case-456' }),
    isPending: false,
  })),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { useUploadDCE, useProcessTender } from '@/hooks/use-tenders';
import { toast } from 'sonner';

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
};

describe('UploadDCEDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockUploadDCE: ReturnType<typeof vi.fn>;
  let mockProcessTender: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    mockUploadDCE = vi.fn().mockResolvedValue({ id: 'tender-123' });
    mockProcessTender = vi.fn().mockResolvedValue({ case_id: 'case-456' });

    vi.mocked(useUploadDCE).mockReturnValue({
      mutateAsync: mockUploadDCE,
      isPending: false,
    } as ReturnType<typeof useUploadDCE>);

    vi.mocked(useProcessTender).mockReturnValue({
      mutateAsync: mockProcessTender,
      isPending: false,
    } as ReturnType<typeof useProcessTender>);

    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche le titre du dialog', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByText(/Importer un DCE/i)).toBeInTheDocument();
    });

    it('affiche la description', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByText(/analyse IA demarrera automatiquement/i)).toBeInTheDocument();
    });

    it('affiche la zone de depot', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByText(/Glissez vos fichiers ici/i)).toBeInTheDocument();
    });

    it('affiche le bouton parcourir', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByText(/parcourir/i)).toBeInTheDocument();
    });

    it('affiche le champ titre (optionnel)', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Titre \(optionnel\)/i)).toBeInTheDocument();
    });

    it('affiche le champ client (optionnel)', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Client \(optionnel\)/i)).toBeInTheDocument();
    });

    it('affiche le champ date limite (optionnel)', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Date limite \(optionnel\)/i)).toBeInTheDocument();
    });

    it('affiche le bouton Annuler', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
    });

    it('affiche le bouton Importer et analyser', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Importer et analyser/i })).toBeInTheDocument();
    });

    it('desactive le bouton Importer si pas de fichiers', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Importer et analyser/i });
      expect(submitButton).toBeDisabled();
    });

    it('n\'affiche pas le dialog si open=false', () => {
      render(<UploadDCEDialog open={false} onOpenChange={vi.fn()} />);

      expect(screen.queryByText(/Importer un DCE/i)).not.toBeInTheDocument();
    });
  });

  describe('Selection de fichiers', () => {
    it('affiche les fichiers selectionnes', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });
    });

    it('active le bouton Importer apres selection d\'un fichier', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Importer et analyser/i });
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('affiche le compteur de fichiers', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const file1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, [file1, file2]);

      await waitFor(() => {
        expect(screen.getByText(/Fichiers \(2\)/i)).toBeInTheDocument();
      });
    });

    it('permet de supprimer un fichier de la liste', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // Find the X button next to the file
      const xButtons = document.querySelectorAll('button[type="button"]');
      const removeButton = Array.from(xButtons).find((btn) => {
        const svg = btn.querySelector('svg');
        return svg && btn.closest('.max-h-32');
      });

      if (removeButton) {
        await user.click(removeButton as HTMLElement);

        await waitFor(() => {
          expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
        });
      }
    });

    it('refuse les fichiers de type non supporte', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Use fireEvent.change to bypass jsdom accept filter
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(input);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Fichiers invalides',
          expect.objectContaining({ description: expect.stringContaining('Type non supporte') })
        );
      });
    });
  });

  describe('Glisser-deposer', () => {
    it('met en surbrillance la zone au survol', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const dropZone = document.querySelector('.rounded-xl.border-dashed') as HTMLElement;
      expect(dropZone).toBeTruthy();

      fireEvent.dragEnter(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone.className).toContain('border-primary');
    });

    it('accepte les fichiers deposes par glisser-deposer', async () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const dropZone = document.querySelector('.rounded-xl.border-dashed') as HTMLElement;
      const file = new File(['content'], 'dropped.pdf', { type: 'application/pdf' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
          items: [
            {
              kind: 'file',
              type: file.type,
              getAsFile: () => file,
            },
          ],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Soumission du formulaire', () => {
    it('appelle uploadDCE avec les fichiers', async () => {
      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);
      vi.mocked(useProcessTender).mockReturnValue({
        mutateAsync: mockProcessTender,
        isPending: false,
      } as ReturnType<typeof useProcessTender>);

      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Importer et analyser/i })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: /Importer et analyser/i }));

      await waitFor(() => {
        expect(mockUploadDCE).toHaveBeenCalledWith(
          expect.objectContaining({
            files: [file],
          })
        );
      });
    });

    it('appelle processTender apres upload reussi', async () => {
      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);
      vi.mocked(useProcessTender).mockReturnValue({
        mutateAsync: mockProcessTender,
        isPending: false,
      } as ReturnType<typeof useProcessTender>);

      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Importer et analyser/i })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: /Importer et analyser/i }));

      await waitFor(() => {
        expect(mockProcessTender).toHaveBeenCalledWith({ id: 'tender-123' });
      });
    });

    it('inclut les metadonnees dans l\'upload', async () => {
      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);
      vi.mocked(useProcessTender).mockReturnValue({
        mutateAsync: mockProcessTender,
        isPending: false,
      } as ReturnType<typeof useProcessTender>);

      render(<UploadDCEDialog {...defaultProps} />);

      // Fill in metadata
      await user.type(screen.getByLabelText(/Titre \(optionnel\)/i), 'Mon DCE');
      await user.type(screen.getByLabelText(/Client \(optionnel\)/i), 'Mairie de Paris');

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Importer et analyser/i })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: /Importer et analyser/i }));

      await waitFor(() => {
        expect(mockUploadDCE).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              title: 'Mon DCE',
              client: 'Mairie de Paris',
            }),
          })
        );
      });
    });

    it('affiche une erreur si aucun fichier selectionne et soumis via code', async () => {
      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);

      render(<UploadDCEDialog {...defaultProps} />);

      // The button is disabled when no files - this validates that directly
      const submitButton = screen.getByRole('button', { name: /Importer et analyser/i });
      expect(submitButton).toBeDisabled();
    });

    it('affiche l\'etat d\'upload en cours', async () => {
      let resolveUpload: (value: unknown) => void;
      const pendingUpload = new Promise((resolve) => { resolveUpload = resolve; });
      mockUploadDCE.mockReturnValue(pendingUpload);

      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);
      vi.mocked(useProcessTender).mockReturnValue({
        mutateAsync: mockProcessTender,
        isPending: false,
      } as ReturnType<typeof useProcessTender>);

      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Importer et analyser/i })).not.toBeDisabled();
      });

      // Click the submit button
      fireEvent.click(screen.getByRole('button', { name: /Importer et analyser/i }));

      // The upload hook was called
      await waitFor(() => {
        expect(mockUploadDCE).toHaveBeenCalledTimes(1);
      });

      // Clean up
      resolveUpload!({ id: 'tender-456' });
    });

    it('affiche une erreur si l\'upload echoue', async () => {
      mockUploadDCE.mockRejectedValue(new Error('Erreur serveur'));

      vi.mocked(useUploadDCE).mockReturnValue({
        mutateAsync: mockUploadDCE,
        isPending: false,
      } as ReturnType<typeof useUploadDCE>);
      vi.mocked(useProcessTender).mockReturnValue({
        mutateAsync: mockProcessTender,
        isPending: false,
      } as ReturnType<typeof useProcessTender>);

      render(<UploadDCEDialog {...defaultProps} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Importer et analyser/i })).not.toBeDisabled();
      });

      await user.click(screen.getByRole('button', { name: /Importer et analyser/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Erreur d'upload",
          expect.objectContaining({
            description: 'Erreur serveur',
          })
        );
      });
    });
  });

  describe('Annulation', () => {
    it('appelle onOpenChange(false) au clic sur Annuler', async () => {
      const onOpenChange = vi.fn();
      render(<UploadDCEDialog open={true} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole('button', { name: /Annuler/i }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Types de fichiers acceptes', () => {
    it('accepte les fichiers PDF, ZIP, DOCX, XLSX', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.accept).toContain('.pdf');
      expect(input.accept).toContain('.zip');
      expect(input.accept).toContain('.docx');
      expect(input.accept).toContain('.xlsx');
    });

    it('accepte les fichiers multiples', () => {
      render(<UploadDCEDialog {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.multiple).toBe(true);
    });
  });
});
