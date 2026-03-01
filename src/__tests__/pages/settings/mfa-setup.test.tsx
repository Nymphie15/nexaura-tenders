import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MFASetup } from "@/components/settings/mfa-setup";

// Mock api client
const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
};

vi.mock("@/lib/api/client", () => ({
  default: {
    get: (...args: any[]) => mockApi.get(...args),
    post: (...args: any[]) => mockApi.post(...args),
  },
}));

describe("MFASetup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading spinner while fetching status", () => {
      mockApi.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<MFASetup />);

      // The Loader2 component is rendered - check for svg with animate-spin
      const spinner = document.querySelector("svg.animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  describe("MFA Disabled State", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          enabled: false,
          verified_at: null,
          backup_codes_remaining: 0,
          locked: false,
          locked_until: null,
        },
      });
    });

    it("should render MFA disabled card", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getAllByText(/authentification a deux facteurs/i)[0]).toBeInTheDocument();
        expect(screen.getByText(/protegez votre compte/i)).toBeInTheDocument();
      });
    });

    it("should show password input to enable MFA", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/votre mot de passe/i)
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /activer l'authentification/i })
        ).toBeInTheDocument();
      });
    });

    it("should show switch in disabled state", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const switchElement = screen.getByRole("switch");
        expect(switchElement).toHaveAttribute("data-state", "unchecked");
        expect(switchElement).toBeDisabled();
      });
    });

    it("should require password to initiate MFA setup", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      // Button should be disabled when password is empty
      const activateButton = screen.getByRole("button", {
        name: /activer l'authentification/i,
      });

      expect(activateButton).toBeDisabled();
    });

    it("should initiate MFA setup with valid password", async () => {
      const user = userEvent.setup();
      const mockQRCode = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const mockBackupCodes = ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345", "PQR678"];

      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });

      mockApi.post.mockResolvedValue({
        data: {
          qr_code_base64: mockQRCode,
          provisioning_uri: "otpauth://totp/test",
          backup_codes: mockBackupCodes,
          message: "MFA setup initiated",
        },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/votre mot de passe/i);
      const activateButton = screen.getByRole("button", {
        name: /activer l'authentification/i,
      });

      await user.type(passwordInput, "mySecurePassword123");
      await user.click(activateButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          "/mfa/setup/init",
          { password: "mySecurePassword123" }
        );
      });
    });

    it("should show error on invalid password", async () => {
      const user = userEvent.setup();

      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });

      mockApi.post.mockRejectedValue({
        response: { data: { detail: "Invalid password" } },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByPlaceholderText(/votre mot de passe/i);
      const activateButton = screen.getByRole("button", {
        name: /activer l'authentification/i,
      });

      await user.type(passwordInput, "wrongPassword");
      await user.click(activateButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
      });
    });
  });

  describe("MFA Setup Wizard - Scan Step", () => {
    const mockSetupData = {
      qr_code_base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      provisioning_uri: "otpauth://totp/AppelOffre:user@example.com?secret=BASE32SECRET&issuer=AppelOffre",
      backup_codes: ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345", "PQR678"],
      message: "Setup initiated",
    };

    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });
      mockApi.post.mockResolvedValue({
        data: mockSetupData,
      });
    });

    it("should show QR code in setup wizard", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));

      await waitFor(() => {
        expect(screen.getByText(/scannez ce qr code/i)).toBeInTheDocument();
        expect(screen.getByAltText(/qr code mfa/i)).toBeInTheDocument();
      });
    });

    it("should toggle manual code display", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /afficher le code manuel/i })).toBeInTheDocument();
      });

      const toggleButton = screen.getByRole("button", { name: /afficher le code manuel/i });
      await user.click(toggleButton);

      expect(screen.getByText(/otpauth:\/\/totp/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /masquer le code manuel/i })).toBeInTheDocument();
    });

    it("should allow proceeding to verification step", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /j'ai scanne le qr code/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /j'ai scanne le qr code/i }));

      expect(screen.getByText(/entrez le code a 6 chiffres/i)).toBeInTheDocument();
    });

    it("should allow canceling setup", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /annuler/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /annuler/i }));

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/scannez ce qr code/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("MFA Setup Wizard - Verification Step", () => {
    const mockSetupData = {
      qr_code_base64: "base64string",
      provisioning_uri: "otpauth://totp/test",
      backup_codes: ["ABC123", "DEF456", "GHI789", "JKL012", "MNO345", "PQR678"],
      message: "Setup initiated",
    };

    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });
      mockApi.post.mockResolvedValue({
        data: mockSetupData,
      });
    });

    it("should verify valid MFA code", async () => {
      const user = userEvent.setup();

      // Override post for multiple calls
      mockApi.post
        .mockResolvedValueOnce({ data: mockSetupData }) // init
        .mockResolvedValueOnce({ data: { success: true } }); // verify

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /j'ai scanne le qr code/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /j'ai scanne le qr code/i }));

      const codeInput = screen.getByPlaceholderText("000000");
      await user.type(codeInput, "123456");

      const verifyButton = screen.getByRole("button", { name: /verifier/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          "/mfa/setup/complete",
          { code: "123456" }
        );
      });
    });

    it("should show error on invalid MFA code", async () => {
      const user = userEvent.setup();

      mockApi.post
        .mockResolvedValueOnce({ data: mockSetupData }) // init
        .mockRejectedValueOnce({
          response: { data: { detail: "Code invalide" } },
        }); // verify fails

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /j'ai scanne le qr code/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /j'ai scanne le qr code/i }));

      const codeInput = screen.getByPlaceholderText("000000");
      await user.type(codeInput, "000000");
      await user.click(screen.getByRole("button", { name: /verifier/i }));

      await waitFor(() => {
        expect(screen.getByText(/code invalide/i)).toBeInTheDocument();
      });
    });

    it("should disable verify button with invalid code length", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /j'ai scanne le qr code/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /j'ai scanne le qr code/i }));

      const codeInput = screen.getByPlaceholderText("000000");
      const verifyButton = screen.getByRole("button", { name: /verifier/i });

      await user.type(codeInput, "123");

      expect(verifyButton).toBeDisabled();
    });

    it("should allow going back to scan step", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /j'ai scanne le qr code/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /j'ai scanne le qr code/i }));

      const backButton = screen.getByRole("button", { name: /retour/i });
      await user.click(backButton);

      expect(screen.getByText(/scannez ce qr code/i)).toBeInTheDocument();
    });
  });

  describe("MFA Enabled State", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          enabled: true,
          verified_at: "2024-01-15T10:00:00Z",
          backup_codes_remaining: 5,
          locked: false,
          locked_until: null,
        },
      });
    });

    it("should render MFA enabled card", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/mfa active/i)).toBeInTheDocument();
        expect(screen.getByText(/votre compte est protege/i)).toBeInTheDocument();
      });
    });

    it("should show activation date", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/active le/i)).toBeInTheDocument();
      });
    });

    it("should show backup codes count", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/5 codes restants/i)).toBeInTheDocument();
      });
    });

    it("should show regenerate backup codes button", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /regenerer/i })).toBeInTheDocument();
      });
    });

    it("should show warning when backup codes are low", async () => {
      mockApi.get.mockResolvedValue({
        data: {
          enabled: true,
          verified_at: "2024-01-15T10:00:00Z",
          backup_codes_remaining: 2,
          locked: false,
          locked_until: null,
        },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByText(/codes de recuperation faibles/i)).toBeInTheDocument();
      });
    });

    it("should show switch in enabled state", async () => {
      render(<MFASetup />);

      await waitFor(() => {
        const switchElement = screen.getByRole("switch");
        expect(switchElement).toHaveAttribute("data-state", "checked");
      });
    });

    it("should open disable dialog when toggling switch off", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toBeInTheDocument();
      });

      const switchElement = screen.getByRole("switch");
      await user.click(switchElement);

      await waitFor(() => {
        expect(screen.getByText(/desactiver l'authentification/i)).toBeInTheDocument();
        expect(screen.getByText(/cette action reduira la securite/i)).toBeInTheDocument();
      });
    });
  });

  describe("Disable MFA Dialog", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          enabled: true,
          verified_at: "2024-01-15T10:00:00Z",
          backup_codes_remaining: 5,
          locked: false,
          locked_until: null,
        },
      });
    });

    it("should require password and MFA code to disable", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/code mfa actuel/i)).toBeInTheDocument();
      });
    });

    it("should disable MFA successfully", async () => {
      const user = userEvent.setup();

      mockApi.post.mockResolvedValue({
        data: { success: true },
      });

      // After disable, refetch shows disabled
      mockApi.get
        .mockResolvedValueOnce({
          data: { enabled: true, backup_codes_remaining: 5 },
        })
        .mockResolvedValueOnce({
          data: { enabled: false },
        });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/mot de passe/i);
      const codeInput = screen.getByLabelText(/code mfa actuel/i);

      await user.type(passwordInput, "myPassword123");
      await user.type(codeInput, "123456");

      const disableButton = screen.getByRole("button", { name: /desactiver mfa/i });
      await user.click(disableButton);

      await waitFor(() => {
        expect(mockApi.post).toHaveBeenCalledWith(
          "/mfa/disable",
          { password: "myPassword123", code: "123456" }
        );
      });
    });

    it("should close dialog on cancel", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("switch")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("switch"));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /annuler/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /annuler/i }));

      await waitFor(() => {
        expect(screen.queryByText(/desactiver l'authentification/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Regenerate Backup Codes", () => {
    beforeEach(() => {
      mockApi.get.mockResolvedValue({
        data: {
          enabled: true,
          verified_at: "2024-01-15T10:00:00Z",
          backup_codes_remaining: 5,
          locked: false,
          locked_until: null,
        },
      });
    });

    it("should open regenerate dialog", async () => {
      const user = userEvent.setup();
      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /regenerer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /regenerer/i }));

      await waitFor(() => {
        expect(screen.getByText(/regenerer les codes de recuperation/i)).toBeInTheDocument();
        expect(screen.getByText(/les anciens codes seront invalides/i)).toBeInTheDocument();
      });
    });

    it("should regenerate backup codes successfully", async () => {
      const user = userEvent.setup();
      const newBackupCodes = ["NEW123", "NEW456", "NEW789", "NEW012", "NEW345", "NEW678"];

      mockApi.post.mockResolvedValue({
        data: { backup_codes: newBackupCodes },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /regenerer/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /regenerer/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/code mfa actuel/i)).toBeInTheDocument();
      });

      const codeInput = screen.getByLabelText(/code mfa actuel/i);
      await user.type(codeInput, "123456");
      await user.click(screen.getByRole("button", { name: /regenerer les codes/i }));

      await waitFor(() => {
        expect(screen.getAllByText(/codes de recuperation/i)[0]).toBeInTheDocument();
        newBackupCodes.forEach((code) => {
          expect(screen.getByText(code)).toBeInTheDocument();
        });
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading", async () => {
      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getAllByText(/authentification a deux facteurs/i)[0]).toBeInTheDocument();
      });
    });

    it("should have accessible form labels in setup", async () => {
      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });

      render(<MFASetup />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/confirmez votre mot de passe pour activer mfa/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      mockApi.get.mockRejectedValue(new Error("Network error"));

      render(<MFASetup />);

      // Should not crash and eventually stop loading
      await waitFor(
        () => {
          const spinner = document.querySelector("svg.animate-spin");
          expect(spinner).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should handle connection errors during setup", async () => {
      const user = userEvent.setup();

      mockApi.get.mockResolvedValue({
        data: { enabled: false },
      });

      mockApi.post.mockRejectedValue(new Error("Connection failed"));

      render(<MFASetup />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/votre mot de passe/i)).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/votre mot de passe/i), "password123");
      await user.click(screen.getByRole("button", { name: /activer l'authentification/i }));

      await waitFor(() => {
        expect(screen.getByText(/erreur lors de l'initialisation/i)).toBeInTheDocument();
      });
    });
  });
});
