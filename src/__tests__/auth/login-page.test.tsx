import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import LoginPage from "@/app/(auth)/login/page";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/stores/auth-store", () => ({
  useAuthStore: vi.fn(),
}));

describe("LoginPage", () => {
  const mockPush = vi.fn();
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
    });
    (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
      login: mockLogin,
      isLoading: false,
    });
  });

  // Helper to get the password input by its id (avoids matching the "Mot de passe oublie" link)
  const getPasswordInput = () => screen.getByPlaceholderText("••••••••");
  const getEmailInput = () => screen.getByLabelText("Adresse email");

  describe("Rendering", () => {
    it("should render login form with all fields", () => {
      render(<LoginPage />);

      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
    });

    it("should render branding elements", () => {
      render(<LoginPage />);

      // There are multiple "Nexaura" texts (desktop + mobile logos)
      expect(screen.getAllByText(/nexaura/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/automatisez vos/i)).toBeInTheDocument();
    });

    it("should render features list", () => {
      render(<LoginPage />);

      expect(screen.getByText(/automatisation ia/i)).toBeInTheDocument();
      expect(screen.getByText(/conformité garantie/i)).toBeInTheDocument();
      expect(screen.getByText(/taux de succès \+40%/i)).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      render(<LoginPage />);

      const forgotPasswordLink = screen.getByRole("link", { name: /mot de passe oublié/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });

    it("should render register link", () => {
      render(<LoginPage />);

      const registerLink = screen.getByRole("link", { name: /créer un compte/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });
  });

  describe("Form Validation", () => {
    it("should have email input with email type", async () => {
      render(<LoginPage />);

      const emailInput = getEmailInput();
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have password input with password type", async () => {
      render(<LoginPage />);

      const passwordInput = getPasswordInput();
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should require email to be valid email format", async () => {
      render(<LoginPage />);

      const emailInput = getEmailInput();
      expect(emailInput).toHaveAttribute("type", "email");
    });
  });

  describe("Password Visibility Toggle", () => {
    it("should toggle password visibility on click", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = getPasswordInput();
      const toggleButton = screen.getByRole("button", { name: /afficher le mot de passe/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute("type", "password");

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      // Click to hide password again (label changes to "Masquer le mot de passe")
      const hideButton = screen.getByRole("button", { name: /masquer le mot de passe/i });
      await user.click(hideButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Remember Me", () => {
    it("should render remember me switch", () => {
      render(<LoginPage />);

      expect(screen.getByText(/se souvenir de moi/i)).toBeInTheDocument();
    });

    it("should toggle remember me state", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const rememberMeSwitch = screen.getByRole("switch", { name: /se souvenir de moi/i });

      expect(rememberMeSwitch).not.toBeChecked();

      await user.click(rememberMeSwitch);
      expect(rememberMeSwitch).toBeChecked();
    });
  });

  describe("Successful Login Flow", () => {
    it("should call login with correct credentials on form submit", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);
      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
      });
    });

    it("should show success toast on successful login", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Connexion r\u00e9ussie",
          { description: "Bienvenue sur Nexaura Tenders" }
        );
      });
    });

    it("should redirect to / on successful login", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("Failed Login Flow", () => {
    it("should show error toast on login failure", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      await user.type(emailInput, "wrong@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Connexion \u00e9chou\u00e9e",
          { description: "Email ou mot de passe incorrect" }
        );
      });
    });

    it("should not redirect on login failure", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error("Invalid credentials"));

      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();
      const submitButton = screen.getByRole("button", { name: /se connecter/i });

      await user.type(emailInput, "wrong@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Loading State", () => {
    it("should disable submit button when loading", () => {
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: true,
      });

      render(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /connexion.../i });
      expect(submitButton).toBeDisabled();
    });

    it("should show loading text when loading", () => {
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: true,
      });

      render(<LoginPage />);

      expect(screen.getByText(/connexion.../i)).toBeInTheDocument();
    });

    it("should show spinner when loading", () => {
      (useAuthStore as ReturnType<typeof vi.fn>).mockReturnValue({
        login: mockLogin,
        isLoading: true,
      });

      render(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /connexion.../i });
      expect(submitButton).toBeDisabled();
      expect(submitButton.textContent).toMatch(/connexion/i);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible form labels", () => {
      render(<LoginPage />);

      expect(getEmailInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
    });

    it("should have proper input types", () => {
      render(<LoginPage />);

      const emailInput = getEmailInput();
      const passwordInput = getPasswordInput();

      expect(emailInput).toHaveAttribute("type", "email");
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should have accessible buttons", () => {
      render(<LoginPage />);

      const submitButton = screen.getByRole("button", { name: /se connecter/i });
      expect(submitButton).toHaveAttribute("type", "submit");
    });
  });

  describe("Security", () => {
    it("should prevent default form submission", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const form = screen.getByRole("button", { name: /se connecter/i }).closest("form");
      const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(submitEvent, "preventDefault");

      form?.dispatchEvent(submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("should not expose password in plain text by default", () => {
      render(<LoginPage />);

      const passwordInput = getPasswordInput();
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });
});
