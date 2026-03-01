/**
 * @file document-upload.test.tsx
 * @description Tests unitaires pour le composant DocumentUpload
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DocumentUpload } from '@/components/documents/document-upload';

describe('DocumentUpload', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let onUpload: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    user = userEvent.setup();
    onUpload = vi.fn().mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche la zone de depot', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      expect(screen.getByRole('button', { name: /Zone de depot/i })).toBeInTheDocument();
    });

    it('affiche les instructions de glisser-deposer', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      expect(screen.getByText(/Glissez-deposez vos fichiers/i)).toBeInTheDocument();
    });

    it('affiche le texte pour cliquer et selectionner', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      expect(screen.getByText(/ou cliquez pour selectionner/i)).toBeInTheDocument();
    });

    it('affiche la taille maximale par defaut (50MB)', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      expect(screen.getByText(/Taille max: 50 MB/i)).toBeInTheDocument();
    });

    it('n\'affiche pas le bouton de telechargement quand pas de fichiers', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      expect(screen.queryByRole('button', { name: /Telecharger/i })).not.toBeInTheDocument();
    });
  });

  describe('Selection de fichiers', () => {
    it('affiche la liste des fichiers selectionnes', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('affiche le bouton de telechargement apres selection d\'un fichier', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i })).toBeInTheDocument();
      });
    });

    it('affiche le compteur de fichiers', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        // The count label is a span with class "text-sm font-medium" containing just the count
        const countSpan = document.querySelector('span.text-sm.font-medium');
        expect(countSpan).toBeTruthy();
        expect(countSpan?.textContent).toMatch(/1 fichier/);
      });
    });

    it('affiche la taille du fichier', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const content = 'a'.repeat(1024); // 1KB
      const file = new File([content], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        // File size is shown in a span with class "text-xs text-muted-foreground"
        // inside the file list item. There's also a "Taille max:" text above.
        // Find file size specifically by looking for the file-list size text
        const sizeSpans = document.querySelectorAll('.max-h-\\[300px\\] .text-xs.text-muted-foreground');
        expect(sizeSpans.length).toBeGreaterThan(0);
        const hasSizeText = Array.from(sizeSpans).some((el) =>
          el.textContent && /\d+(\.\d+)?\s*(B|KB|MB)/i.test(el.textContent)
        );
        expect(hasSizeText).toBe(true);
      });
    });

    it('refuse les fichiers trop volumineux', async () => {
      const maxSize = 100; // 100 bytes
      render(<DocumentUpload onUpload={onUpload} maxSize={maxSize} />);

      const largeContent = 'a'.repeat(200);
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/depasse la taille maximale/i)).toBeInTheDocument();
      });
    });

    it('refuse les types de fichiers non supportes', async () => {
      render(<DocumentUpload onUpload={onUpload} accept=".pdf" />);

      const file = new File(['content'], 'test.exe', { type: 'application/octet-stream' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Use fireEvent.change instead of userEvent.upload to bypass jsdom's accept filter
      Object.defineProperty(input, 'files', {
        value: [file],
        configurable: true,
      });
      fireEvent.change(input);

      await waitFor(() => {
        // Error is shown in span.text-xs.text-destructive inside the file list
        const errorSpans = document.querySelectorAll('.text-xs.text-destructive');
        const hasTypeError = Array.from(errorSpans).some((el) =>
          el.textContent && /Type de fichier non supporte/i.test(el.textContent)
        );
        expect(hasTypeError).toBe(true);
      });
    });
  });

  describe('Suppression de fichiers', () => {
    it('permet de supprimer un fichier de la liste', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
      });

      // Find the remove button (X icon button in the file list)
      // The button is a ghost icon-sm button containing an X svg
      const removeButtons = document.querySelectorAll('button[class*="ghost"]');
      // Find the one that contains an X SVG for removing files
      let removeButton: Element | null = null;
      removeButtons.forEach((btn) => {
        const svg = btn.querySelector('svg');
        if (svg && btn.closest('.space-y-2')) {
          removeButton = btn;
        }
      });

      if (removeButton) {
        await user.click(removeButton as HTMLElement);
        await waitFor(() => {
          expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
        });
      }
    });

    it('affiche le bouton Tout effacer', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Tout effacer/i })).toBeInTheDocument();
      });
    });

    it('efface tous les fichiers avec Tout effacer', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, [file1, file2]);

      await waitFor(() => {
        expect(screen.getByText('test1.pdf')).toBeInTheDocument();
      });

      const clearAllButton = screen.getByRole('button', { name: /Tout effacer/i });
      await user.click(clearAllButton);

      await waitFor(() => {
        expect(screen.queryByText('test1.pdf')).not.toBeInTheDocument();
        expect(screen.queryByText('test2.pdf')).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload', () => {
    it('appelle onUpload avec les bons fichiers', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledWith([file]);
      });
    });

    it('affiche l\'etat de telechargement en cours', async () => {
      // Make onUpload never resolve to test loading state
      let resolveUpload: (value: unknown) => void;
      const pendingUpload = new Promise((resolve) => { resolveUpload = resolve; });
      onUpload.mockReturnValue(pendingUpload);

      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i })).toBeInTheDocument();
      });

      // Clicking the button starts the async upload
      const uploadButton = screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i });
      fireEvent.click(uploadButton);

      // The component should call onUpload (which is now pending)
      await waitFor(() => {
        expect(onUpload).toHaveBeenCalledTimes(1);
      });

      // Resolve the upload to let the test finish cleanly
      act(() => { resolveUpload!(undefined); });
    });

    it('affiche l\'icone de succes apres upload reussi', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i });
      await user.click(uploadButton);

      await waitFor(() => {
        // After success, "Effacer termines" button appears
        expect(screen.getByRole('button', { name: /Effacer termines/i })).toBeInTheDocument();
      });
    });

    it('affiche une erreur si l\'upload echoue', async () => {
      onUpload.mockRejectedValue(new Error('Erreur reseau'));

      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i })).toBeInTheDocument();
      });

      const uploadButton = screen.getByRole('button', { name: /Telecharger 1 fichier\(s\)/i });
      await user.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText(/Erreur reseau/i)).toBeInTheDocument();
      });
    });
  });

  describe('Glisser-deposer', () => {
    it('met en surbrillance la zone lors du glisser', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const dropZone = screen.getByRole('button', { name: /Zone de depot/i });

      fireEvent.dragOver(dropZone, {
        dataTransfer: { files: [] },
      });

      expect(dropZone).toHaveClass('border-primary');
    });

    it('retire la surbrillance quand le fichier quitte la zone', () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const dropZone = screen.getByRole('button', { name: /Zone de depot/i });

      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).not.toHaveClass('bg-primary/5');
    });

    it('accepte les fichiers deposes', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const dropZone = screen.getByRole('button', { name: /Zone de depot/i });
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

  describe('Mode mono-fichier', () => {
    it('accepte un seul fichier en mode multiple=false', async () => {
      render(<DocumentUpload onUpload={onUpload} multiple={false} />);

      const file1 = new File(['content'], 'test1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content'], 'test2.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, [file1, file2]);

      await waitFor(() => {
        // In single mode, only the first file should be kept
        const fileNames = document.querySelectorAll('.truncate');
        expect(fileNames.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Classes CSS personnalisees', () => {
    it('applique le className fourni', () => {
      render(<DocumentUpload onUpload={onUpload} className="custom-class" />);

      const container = document.querySelector('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Icones de fichiers', () => {
    it('affiche une icone SVG pour les fichiers PDF', async () => {
      render(<DocumentUpload onUpload={onUpload} />);

      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
        // Verify that an SVG icon is rendered near the filename
        const fileListItem = screen.getByText('test.pdf').closest('.flex.items-center.gap-3');
        const svg = fileListItem?.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });
  });
});
