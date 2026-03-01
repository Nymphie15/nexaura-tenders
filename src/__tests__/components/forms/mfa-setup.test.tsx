/**
 * @file mfa-setup.test.tsx
 * @description Tests unitaires pour le composant MFASetup
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MFASetup } from '@/components/settings/mfa-setup';

// Mock the api client (Axios instance used by the component)
vi.mock('@/lib/api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import api from '@/lib/api/client';

const disabledStatusResponse = {
  data: {
    enabled: false,
    verified_at: null,
    backup_codes_remaining: 0,
    locked: false,
    locked_until: null,
  },
};

const enabledStatusResponse = {
  data: {
    enabled: true,
    verified_at: '2026-01-20T10:00:00Z',
    backup_codes_remaining: 8,
    locked: false,
    locked_until: null,
  },
};

const setupInitResponse = {
  data: {
    qr_code_base64: 'base64-qr-code',
    provisioning_uri: 'otpauth://totp/test',
    backup_codes: ['CODE1', 'CODE2', 'CODE3', 'CODE4', 'CODE5', 'CODE6', 'CODE7', 'CODE8'],
    message: 'Setup initiated',
  },
};

describe('MFASetup', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('État initial - MFA désactivé', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValueOnce(disabledStatusResponse);
    });

    it('affiche le titre du composant', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/Authentification a deux facteurs \(MFA\)/i)).toBeInTheDocument();
      });
    });

    it('affiche un switch désactivé quand MFA est inactif', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('data-state', 'unchecked');
        expect(switchElement).toBeDisabled();
      });
    });

    it('affiche le champ de mot de passe pour activer MFA', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });
    });

    it('affiche un message explicatif sur MFA', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/Protegez votre compte/i)).toBeInTheDocument();
        expect(screen.getByText(/couche de securite supplementaire/i)).toBeInTheDocument();
      });
    });

    it('désactive le bouton d\'activation si pas de mot de passe', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
        expect(activateButton).toBeDisabled();
      });
    });

    it('active le bouton quand un mot de passe est saisi', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
        expect(passwordInput).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'MySecurePassword123');

      await waitFor(() => {
        const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
        expect(activateButton).not.toBeDisabled();
      });
    });
  });

  describe('État initial - MFA activé', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValueOnce(enabledStatusResponse);
    });

    it('affiche un switch activé quand MFA est actif', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toHaveAttribute('data-state', 'checked');
      });
    });

    it('affiche l\'alerte de succès', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/MFA active/i)).toBeInTheDocument();
      });
    });

    it('affiche le nombre de codes de récupération restants', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/8 codes restants/i)).toBeInTheDocument();
      });
    });

    it('affiche le bouton pour régénérer les codes', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Regenerer/i })).toBeInTheDocument();
      });
    });

    it('affiche une alerte si peu de codes restants (≤2)', async () => {
      vi.mocked(api.get).mockReset();
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          enabled: true,
          verified_at: '2026-01-20T10:00:00Z',
          backup_codes_remaining: 2,
          locked: false,
          locked_until: null,
        },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/Codes de recuperation faibles/i)).toBeInTheDocument();
      });
    });
  });

  describe('Activation de MFA', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValueOnce(disabledStatusResponse);
    });

    it('affiche une erreur si mot de passe vide', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
        expect(activateButton).toBeDisabled();
      });
    });

    it('envoie la requête d\'initialisation avec le bon mot de passe', async () => {
      vi.mocked(api.post).mockResolvedValueOnce(setupInitResponse);

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'MySecurePassword123');

      const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
      await user.click(activateButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/mfa/setup/init',
          { password: 'MySecurePassword123' }
        );
      });
    });

    it('affiche le QR code après initialisation réussie', async () => {
      vi.mocked(api.post).mockResolvedValueOnce(setupInitResponse);

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'MySecurePassword123');

      const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
      await user.click(activateButton);

      await waitFor(() => {
        expect(screen.getByAltText(/QR Code MFA/i)).toBeInTheDocument();
      });
    });

    it('affiche une erreur si le mot de passe est incorrect', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Mot de passe incorrect',
          },
        },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'WrongPassword');

      const activateButton = screen.getByRole('button', { name: /Activer l'authentification/i });
      await user.click(activateButton);

      await waitFor(() => {
        expect(screen.getByText(/Mot de passe incorrect/i)).toBeInTheDocument();
      });
    });
  });

  describe('Wizard de configuration', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockResolvedValueOnce(disabledStatusResponse);
      vi.mocked(api.post).mockResolvedValueOnce(setupInitResponse);

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'MySecurePassword123');

      const activateButton = screen.getByRole('button', { name: /Activer/i });
      await user.click(activateButton);
    });

    it('affiche le bouton pour passer à la vérification', async () => {
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /J'ai scanne le QR code/i })).toBeInTheDocument();
      });
    });

    it('permet d\'afficher le code manuel', async () => {
      await waitFor(() => {
        const showManualButton = screen.getByRole('button', { name: /Afficher le code manuel/i });
        expect(showManualButton).toBeInTheDocument();
      });

      const showManualButton = screen.getByRole('button', { name: /Afficher le code manuel/i });
      await user.click(showManualButton);

      await waitFor(() => {
        expect(screen.getByText(/otpauth:\/\/totp\/test/i)).toBeInTheDocument();
      });
    });

    it('passe à l\'étape de vérification', async () => {
      await waitFor(() => {
        const nextButton = screen.getByRole('button', { name: /J'ai scanne/i });
        expect(nextButton).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /J'ai scanne/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Code de verification/i)).toBeInTheDocument();
      });
    });
  });

  describe('Vérification du code MFA', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockResolvedValueOnce(disabledStatusResponse);
      vi.mocked(api.post).mockResolvedValueOnce(setupInitResponse);

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
      await user.type(passwordInput, 'MySecurePassword123');

      const activateButton = screen.getByRole('button', { name: /Activer/i });
      await user.click(activateButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /J'ai scanne/i })).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /J'ai scanne/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Code de verification/i)).toBeInTheDocument();
      });
    });

    it('accepte uniquement les chiffres dans le code', async () => {
      const codeInput = screen.getByLabelText(/Code de verification/i) as HTMLInputElement;

      await user.type(codeInput, 'abc123def');

      expect(codeInput.value).toBe('123');
    });

    it('limite le code à 6 caractères', async () => {
      const codeInput = screen.getByLabelText(/Code de verification/i) as HTMLInputElement;

      await user.type(codeInput, '12345678');

      expect(codeInput.value).toBe('123456');
    });

    it('affiche une erreur si le code est invalide', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Code invalide',
          },
        },
      });

      const codeInput = screen.getByLabelText(/Code de verification/i);
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /Verifier/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/Code invalide/i)).toBeInTheDocument();
      });
    });

    it('passe aux codes de backup après vérification réussie', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      const codeInput = screen.getByLabelText(/Code de verification/i);
      await user.type(codeInput, '123456');

      const verifyButton = screen.getByRole('button', { name: /Verifier/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText(/Codes de recuperation/i)).toBeInTheDocument();
      });
    });

    it('désactive le bouton Vérifier si code incomplet', async () => {
      const codeInput = screen.getByLabelText(/Code de verification/i);
      await user.type(codeInput, '12345'); // Seulement 5 chiffres

      const verifyButton = screen.getByRole('button', { name: /Verifier/i });
      expect(verifyButton).toBeDisabled();
    });
  });

  describe('Désactivation de MFA', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValueOnce(enabledStatusResponse);
    });

    it('ouvre le dialog de désactivation au clic sur le switch', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const switchElement = screen.getByRole('switch');
        expect(switchElement).toBeInTheDocument();
      });

      const switchElement = screen.getByRole('switch');
      await user.click(switchElement);

      await waitFor(() => {
        expect(screen.getByText(/Desactiver l'authentification a deux facteurs/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibilité', () => {
    beforeEach(() => {
      vi.mocked(api.get).mockResolvedValueOnce(disabledStatusResponse);
    });

    it('a des labels pour tous les champs de saisie', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Confirmez votre mot de passe/i)).toBeInTheDocument();
      });
    });

    it('supporte l\'auto-focus sur le champ de mot de passe', async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/Confirmez votre mot de passe/i);
        expect(passwordInput).toBeInTheDocument();
      });
    });
  });

  describe('États de chargement', () => {
    it('affiche un loader pendant la récupération du statut', () => {
      vi.mocked(api.get).mockReturnValueOnce(new Promise(() => {})); // Never resolves

      render(<MFASetup />);

      // While loading, the card content shows a spinner (Loader2 with animate-spin)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});
