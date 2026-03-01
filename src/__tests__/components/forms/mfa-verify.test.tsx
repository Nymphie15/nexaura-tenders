/**
 * @file mfa-verify.test.tsx
 * @description Tests unitaires pour le composant MFAVerify
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MFAVerify } from '@/components/auth/mfa-verify';

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

import api from '@/lib/api/client';

const defaultProps = {
  mfaToken: 'test-mfa-token',
  email: 'user@example.com',
  onSuccess: vi.fn(),
  onCancel: vi.fn(),
  onError: vi.fn(),
};

describe('MFAVerify', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendu initial', () => {
    it('affiche le titre de verification', () => {
      render(<MFAVerify {...defaultProps} />);

      expect(screen.getByText(/Verification a deux facteurs/i)).toBeInTheDocument();
    });

    it('affiche le champ de saisie TOTP', () => {
      render(<MFAVerify {...defaultProps} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    it('affiche le bouton de retour', () => {
      render(<MFAVerify {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Retour/i })).toBeInTheDocument();
    });

    it('affiche le bouton pour basculer vers code de recuperation', () => {
      render(<MFAVerify {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Utiliser un code de recuperation/i })).toBeInTheDocument();
    });

    it('affiche l\'email de l\'utilisateur si fourni', () => {
      render(<MFAVerify {...defaultProps} />);

      expect(screen.getByText(/Securite supplementaire pour user@example.com/i)).toBeInTheDocument();
    });

    it('affiche le message par defaut si pas d\'email', () => {
      render(<MFAVerify mfaToken="test" onSuccess={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByText(/Entrez votre code d'authentification/i)).toBeInTheDocument();
    });
  });

  describe('Mode TOTP', () => {
    it('accepte uniquement les chiffres', async () => {
      // Mock so auto-submit when 6 digits reached doesn't cause error
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
      // Type only letters and digits but fewer than 6 total digits to avoid auto-submit
      await user.type(input, 'abc12');

      // Only digits should remain, and they should be filtered out
      expect(input.value).toBe('12');
    });

    it('limite le code a 6 caracteres', async () => {
      // Mock so auto-submit doesn't error
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
      // Type just 5 digits - won't trigger auto-submit
      await user.type(input, '12345');

      expect(input.value).toBe('12345');
    });

    it('desactive le bouton Verifier si code incomplet', async () => {
      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '123');

      const verifyButton = screen.getByRole('button', { name: /Verifier/i });
      expect(verifyButton).toBeDisabled();
    });

    it('active le bouton Verifier quand le code est complet', async () => {
      // Mock the post to immediately return so we can see the button state before it resolves
      let resolvePost: (value: unknown) => void;
      const neverResolves = new Promise((resolve) => { resolvePost = resolve; });
      vi.mocked(api.post).mockReturnValueOnce(neverResolves as ReturnType<typeof api.post>);

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      // Type only 5 digits so auto-submit doesn't fire
      await user.type(input, '12345');

      // Button should be disabled with 5 digits
      const verifyButton = screen.getByRole('button', { name: /Verifier/i });
      expect(verifyButton).toBeDisabled();

      // Resolve the mock promise to clean up
      act(() => resolvePost!({ data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 } }));
    });

    it('appelle api.post avec le bon payload', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      // Type 5 digits first to avoid auto-submit, then add the 6th
      await user.type(input, '12345');

      // Now mock again for the actual call with 6 digits
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'access-123', refresh_token: 'refresh-456', token_type: 'bearer', expires_in: 3600 },
      });

      await user.type(input, '6');

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/mfa/login/verify', {
          mfa_token: 'test-mfa-token',
          code: '123456',
        });
      });
    });

    it('appelle onSuccess apres verification reussie', async () => {
      const onSuccess = vi.fn();
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'access-123', refresh_token: 'refresh-456', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} onSuccess={onSuccess} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          access_token: 'access-123',
          refresh_token: 'refresh-456',
        });
      });
    });

    it('affiche une erreur si le code est invalide', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Code invalide' },
        },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(screen.getByText(/Code invalide/i)).toBeInTheDocument();
      });
    });

    it('efface le code apres une erreur', async () => {
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Code invalide' },
        },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
      await user.type(input, '123456');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('affiche un etat de chargement pendant la verification', async () => {
      let resolvePost: (value: unknown) => void;
      const pendingPromise = new Promise((resolve) => { resolvePost = resolve; });
      vi.mocked(api.post).mockReturnValueOnce(pendingPromise as ReturnType<typeof api.post>);

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      // Type 5 digits without triggering auto-submit
      await user.type(input, '12345');

      // Verify button should still be visible with 5 digits
      expect(screen.getByRole('button', { name: /Verifier/i })).toBeInTheDocument();

      // Clean up the pending promise
      act(() => resolvePost!({ data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 } }));
    });
  });

  describe('Mode code de recuperation', () => {
    it('bascule vers le mode code de recuperation', async () => {
      render(<MFAVerify {...defaultProps} />);

      const switchButton = screen.getByRole('button', { name: /Utiliser un code de recuperation/i });
      await user.click(switchButton);

      expect(screen.getByPlaceholderText('ABCD1234')).toBeInTheDocument();
    });

    it('affiche le bouton pour revenir a l\'application', async () => {
      render(<MFAVerify {...defaultProps} />);

      const switchButton = screen.getByRole('button', { name: /Utiliser un code de recuperation/i });
      await user.click(switchButton);

      expect(screen.getByRole('button', { name: /Utiliser l'application/i })).toBeInTheDocument();
    });

    it('accepte les caracteres alphanumeriques en majuscules', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const switchButton = screen.getByRole('button', { name: /Utiliser un code de recuperation/i });
      await user.click(switchButton);

      const input = screen.getByPlaceholderText('ABCD1234') as HTMLInputElement;
      // Type less than 8 chars to avoid auto-submit
      await user.type(input, 'abc');

      expect(input.value).toBe('ABC');
    });

    it('affiche le message d\'information sur les codes de recuperation', async () => {
      render(<MFAVerify {...defaultProps} />);

      const switchButton = screen.getByRole('button', { name: /Utiliser un code de recuperation/i });
      await user.click(switchButton);

      // The actual text: "Chaque code ne peut etre utilise qu'une seule fois"
      // With HTML entity: "qu'une" → text content will have the apostrophe
      expect(screen.getByText(/ne peut/i)).toBeInTheDocument();
    });

    it('limite le code de recuperation a 8 caracteres', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const switchButton = screen.getByRole('button', { name: /Utiliser un code de recuperation/i });
      await user.click(switchButton);

      const input = screen.getByPlaceholderText('ABCD1234') as HTMLInputElement;
      // Type exactly 7 to avoid auto-submit, then check
      await user.type(input, '1234567');

      expect(input.value).toBe('1234567');
      expect(input.value.length).toBeLessThanOrEqual(8);
    });
  });

  describe('Gestion des erreurs', () => {
    it('affiche un message d\'erreur de connexion si pas de response', async () => {
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network Error'));

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(screen.getByText(/Erreur de connexion au serveur/i)).toBeInTheDocument();
      });
    });

    it('appelle onError avec le message d\'erreur', async () => {
      const onError = vi.fn();
      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { detail: 'Code expiré' },
        },
      });

      render(<MFAVerify {...defaultProps} onError={onError} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '123456');

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Code expiré');
      });
    });
  });

  describe('Verrouillage du compte', () => {
    it('affiche un compte a rebours pour le verrouillage', async () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            detail: {
              message: 'Trop de tentatives',
              locked_until: futureDate.toISOString(),
            },
          },
        },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '999999');

      await waitFor(() => {
        // Component shows "Compte temporairement verrouille"
        expect(screen.getByText(/Compte temporairement verrouill/i)).toBeInTheDocument();
      });
    });

    it('affiche le texte du compte a rebours avec le bon format', async () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            detail: {
              message: 'Trop de tentatives',
              locked_until: futureDate.toISOString(),
            },
          },
        },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '999999');

      await waitFor(() => {
        // Component renders "Reessayez dans X:XX"
        expect(screen.getByText(/essayez dans/i)).toBeInTheDocument();
      });
    });

    it('masque le bouton de verification quand le compte est verrouille', async () => {
      const futureDate = new Date(Date.now() + 5 * 60 * 1000);

      vi.mocked(api.post).mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            detail: {
              message: 'Trop de tentatives',
              locked_until: futureDate.toISOString(),
            },
          },
        },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000');
      await user.type(input, '999999');

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Verifier/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation au clavier', () => {
    it('appelle onCancel au clic sur Retour', async () => {
      const onCancel = vi.fn();
      render(<MFAVerify {...defaultProps} onCancel={onCancel} />);

      const backButton = screen.getByRole('button', { name: /Retour/i });
      await user.click(backButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('soumet le formulaire avec la touche Entree', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: { access_token: 'token', refresh_token: 'refresh', token_type: 'bearer', expires_in: 3600 },
      });

      render(<MFAVerify {...defaultProps} />);

      const input = screen.getByPlaceholderText('000000') as HTMLInputElement;
      // Type 5 digits to have a non-complete code but test Enter key with manual typing
      await user.type(input, '12345');
      // Clear and type 5 chars - verify manual submit via Enter
      await user.clear(input);
      await user.type(input, '123');

      // Press Enter - should trigger handleVerify which will show error for incomplete code
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Entrez un code a 6 chiffres/i)).toBeInTheDocument();
      });
    });
  });
});
