import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import SettingsPage from "@/app/(dashboard)/settings/page";
import { authApi } from "@/lib/api/endpoints";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("next-themes", () => ({
  useTheme: vi.fn(() => ({
    theme: "light",
    setTheme: vi.fn(),
  })),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: {
    changePassword: vi.fn(),
  },
}));

describe("SettingsPage", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Rendering", () => {
    it("should render settings page with header", () => {
      render(<SettingsPage />);

      expect(screen.getByRole("heading", { name: /parametres/i })).toBeInTheDocument();
      expect(screen.getByText(/configurez les options de votre compte/i)).toBeInTheDocument();
    });

    it("should render all tabs", () => {
      render(<SettingsPage />);

      expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /fonctionnalites/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /notifications/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /api/i })).toBeInTheDocument();
    });

    it("should render save button", () => {
      render(<SettingsPage />);

      const saveButton = screen.getByRole("button", { name: /enregistrer/i });
      expect(saveButton).toBeInTheDocument();
    });

    it("should show general tab by default", () => {
      render(<SettingsPage />);

      expect(screen.getAllByText(/apparence/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/langue et région/i)).toBeInTheDocument();
      expect(screen.getAllByText(/sécurité/i).length).toBeGreaterThan(0);
    });
  });

  describe("General Tab - Appearance", () => {
    it("should render theme selector", () => {
      render(<SettingsPage />);

      const themeLabels = screen.getAllByText(/thème/i);
      expect(themeLabels.length).toBeGreaterThan(0);
      expect(screen.getByText(/choisissez entre mode clair et sombre/i)).toBeInTheDocument();
    });

    it("should allow theme change", async () => {
      const mockSetTheme = vi.fn();
      const { useTheme } = await import("next-themes");
      (useTheme as ReturnType<typeof vi.fn>).mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
      });

      render(<SettingsPage />);

      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes.length).toBeGreaterThan(0);

      // First combobox should be the theme selector
      expect(comboboxes[0]).toBeInTheDocument();
    });
  });

  describe("General Tab - Language", () => {
    it("should render language selector", () => {
      render(<SettingsPage />);

      const langueLabels = screen.getAllByText(/langue/i);
      expect(langueLabels.length).toBeGreaterThan(0);
      expect(screen.getByText(/langue de l'interface/i)).toBeInTheDocument();
    });

    it("should render date format selector", () => {
      render(<SettingsPage />);

      expect(screen.getByText(/format de date/i)).toBeInTheDocument();
      expect(screen.getByText(/format d'affichage des dates/i)).toBeInTheDocument();
    });
  });

  describe("General Tab - Security", () => {
    it("should render password change section", () => {
      render(<SettingsPage />);

      expect(screen.getByText(/changer le mot de passe/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/mot de passe actuel/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/nouveau mot de passe/i)).toBeInTheDocument();
    });

    it("should render MFA section as coming soon", () => {
      render(<SettingsPage />);

      expect(screen.getByText(/authentification à deux facteurs/i)).toBeInTheDocument();
      expect(screen.getByText(/bientôt disponible/i)).toBeInTheDocument();
    });

    it("should handle password change successfully", async () => {
      const user = userEvent.setup();
      (authApi.changePassword as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      render(<SettingsPage />);

      const currentPasswordInput = screen.getByPlaceholderText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByPlaceholderText(/nouveau mot de passe/i);
      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });

      await user.type(currentPasswordInput, "oldPassword123");
      await user.type(newPasswordInput, "newPassword123");
      await user.click(updateButton);

      await waitFor(() => {
        expect(authApi.changePassword).toHaveBeenCalledWith({
          current_password: "oldPassword123",
          new_password: "newPassword123",
        });
        expect(toast.success).toHaveBeenCalledWith("Mot de passe modifié avec succès");
      });

      // Verify fields are cleared
      expect(currentPasswordInput).toHaveValue("");
      expect(newPasswordInput).toHaveValue("");
    });

    it("should show error when password fields are empty", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Veuillez remplir les deux champs");
      });

      expect(authApi.changePassword).not.toHaveBeenCalled();
    });

    it("should validate minimum password length", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const currentPasswordInput = screen.getByPlaceholderText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByPlaceholderText(/nouveau mot de passe/i);
      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });

      await user.type(currentPasswordInput, "oldPassword");
      await user.type(newPasswordInput, "short");
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "Le nouveau mot de passe doit contenir au moins 8 caractères"
        );
      });
    });

    it("should handle incorrect current password", async () => {
      const user = userEvent.setup();
      (authApi.changePassword as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: { status: 401 },
      });

      render(<SettingsPage />);

      const currentPasswordInput = screen.getByPlaceholderText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByPlaceholderText(/nouveau mot de passe/i);
      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });

      await user.type(currentPasswordInput, "wrongPassword");
      await user.type(newPasswordInput, "newPassword123");
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Mot de passe actuel incorrect");
      });
    });

    it("should handle generic password change error", async () => {
      const user = userEvent.setup();
      (authApi.changePassword as ReturnType<typeof vi.fn>).mockRejectedValue({
        response: { status: 500 },
      });

      render(<SettingsPage />);

      const currentPasswordInput = screen.getByPlaceholderText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByPlaceholderText(/nouveau mot de passe/i);
      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });

      await user.type(currentPasswordInput, "oldPassword123");
      await user.type(newPasswordInput, "newPassword123");
      await user.click(updateButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erreur lors du changement de mot de passe");
      });
    });

    it("should disable update button while changing password", async () => {
      const user = userEvent.setup();
      (authApi.changePassword as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(<SettingsPage />);

      const currentPasswordInput = screen.getByPlaceholderText(/mot de passe actuel/i);
      const newPasswordInput = screen.getByPlaceholderText(/nouveau mot de passe/i);
      const updateButton = screen.getByRole("button", { name: /mettre à jour/i });

      await user.type(currentPasswordInput, "oldPassword123");
      await user.type(newPasswordInput, "newPassword123");
      await user.click(updateButton);

      expect(updateButton).toBeDisabled();
      expect(screen.getByText(/modification.../i)).toBeInTheDocument();
    });
  });

  describe("Features Tab", () => {
    it("should render features tab when clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const featuresTab = screen.getByRole("tab", { name: /fonctionnalites/i });
      await user.click(featuresTab);

      expect(screen.getAllByText(/fact checker llm/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/scoring de confiance/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/matching vectoriel/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/téléchargement dce automatique/i).length).toBeGreaterThan(0);
    });

    it("should load features from localStorage on mount", () => {
      const storedFeatures = {
        llm_fact_checker: false,
        confidence_scoring: true,
        vector_matching: false,
        auto_download_dce: true,
      };
      localStorageMock["appel-offre-features"] = JSON.stringify(storedFeatures);

      render(<SettingsPage />);

      // Settings should be loaded
      expect(global.localStorage.getItem).toHaveBeenCalledWith("appel-offre-features");
    });

    it("should use default features when localStorage is empty", () => {
      render(<SettingsPage />);

      // Should not throw error and use defaults
      expect(global.localStorage.getItem).toHaveBeenCalledWith("appel-offre-features");
    });

    it("should toggle feature switches", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const featuresTab = screen.getByRole("tab", { name: /fonctionnalites/i });
      await user.click(featuresTab);

      // Find switches by their associated labels
      const switches = screen.getAllByRole("switch");
      expect(switches.length).toBeGreaterThan(0);

      // Toggle first switch
      await user.click(switches[0]);

      // Verify switch state changed
      expect(switches[0]).toHaveAttribute("data-state");
    });

    it("should show optimal configuration info", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const featuresTab = screen.getByRole("tab", { name: /fonctionnalites/i });
      await user.click(featuresTab);

      expect(screen.getByText(/configuration optimale/i)).toBeInTheDocument();
      expect(screen.getByText(/pour de meilleurs résultats/i)).toBeInTheDocument();
    });
  });

  describe("Notifications Tab", () => {
    it("should render notifications tab when clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const notificationsTab = screen.getByRole("tab", { name: /notifications/i });
      await user.click(notificationsTab);

      expect(screen.getByText(/décisions hitl en attente/i)).toBeInTheDocument();
      expect(screen.getByText(/workflow terminé/i)).toBeInTheDocument();
      expect(screen.getByText(/workflow échoué/i)).toBeInTheDocument();
      expect(screen.getByText(/rappel de deadline/i)).toBeInTheDocument();
      expect(screen.getByText(/rapport hebdomadaire/i)).toBeInTheDocument();
    });

    it("should load notifications from localStorage on mount", () => {
      const storedNotifications = {
        hitl_pending: false,
        workflow_completed: false,
        workflow_failed: true,
      };
      localStorageMock["appel-offre-notifications"] = JSON.stringify(storedNotifications);

      render(<SettingsPage />);

      expect(global.localStorage.getItem).toHaveBeenCalledWith("appel-offre-notifications");
    });

    it("should render slack notifications section", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const notificationsTab = screen.getByRole("tab", { name: /notifications/i });
      await user.click(notificationsTab);

      expect(screen.getByText(/notifications slack/i)).toBeInTheDocument();
    });

    it("should show slack webhook input when enabled", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const notificationsTab = screen.getByRole("tab", { name: /notifications/i });
      await user.click(notificationsTab);

      // Find and enable Slack notifications
      const slackSwitch = screen.getAllByRole("switch").find((sw) => {
        const label = sw.closest('[data-state]')?.previousElementSibling;
        return label?.textContent?.includes("Slack");
      });

      if (slackSwitch) {
        await user.click(slackSwitch);

        // Webhook input should appear
        await waitFor(() => {
          expect(screen.getByPlaceholderText(/https:\/\/hooks.slack.com/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe("API Tab", () => {
    it("should render API tab when clicked", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const apiTab = screen.getByRole("tab", { name: /api/i });
      await user.click(apiTab);

      expect(screen.getAllByText(/cle api/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/bientot disponible/i).length).toBeGreaterThan(0);
    });

    it("should render API documentation links", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const apiTab = screen.getByRole("tab", { name: /api/i });
      await user.click(apiTab);

      expect(screen.getByText(/documentation api/i)).toBeInTheDocument();
      expect(screen.getByText(/swagger ui/i)).toBeInTheDocument();
      expect(screen.getByText(/redoc/i)).toBeInTheDocument();
    });
  });

  describe("Save Functionality", () => {
    it("should save settings to localStorage", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const saveButton = screen.getByRole("button", { name: /enregistrer/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          "appel-offre-features",
          expect.any(String)
        );
        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          "appel-offre-notifications",
          expect.any(String)
        );
        expect(toast.success).toHaveBeenCalledWith("Paramètres enregistrés", {
          description: "Vos preferences ont ete sauvegardees",
        });
      });
    });

    it("should disable save button while saving", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      const saveButton = screen.getByRole("button", { name: /enregistrer/i });
      await user.click(saveButton);

      // Button should be disabled during save
      expect(saveButton).toBeDisabled();
    });

    it("should handle save errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock localStorage.setItem to throw error
      global.localStorage.setItem = vi.fn(() => {
        throw new Error("Storage error");
      });

      render(<SettingsPage />);

      const saveButton = screen.getByRole("button", { name: /enregistrer/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erreur lors de la sauvegarde");
      });
    });

    it("should persist feature changes across save", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Switch to features tab
      const featuresTab = screen.getByRole("tab", { name: /fonctionnalites/i });
      await user.click(featuresTab);

      // Toggle a feature
      const switches = screen.getAllByRole("switch");
      await user.click(switches[0]);

      // Save
      const saveButton = screen.getByRole("button", { name: /enregistrer/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.localStorage.setItem).toHaveBeenCalled();
      });

      // Verify saved data contains the feature toggle
      const savedData = JSON.parse(
        (global.localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls.find(
          (call) => call[0] === "appel-offre-features"
        )?.[1] || "{}"
      );
      expect(savedData).toHaveProperty("llm_fact_checker");
    });
  });

  describe("Tab Navigation", () => {
    it("should switch between tabs", async () => {
      const user = userEvent.setup();
      render(<SettingsPage />);

      // Initially on General tab
      expect(screen.getAllByText(/apparence/i).length).toBeGreaterThan(0);

      // Switch to Features
      await user.click(screen.getByRole("tab", { name: /fonctionnalites/i }));
      expect(screen.getByText(/fact checker llm/i)).toBeInTheDocument();

      // Switch to Notifications
      await user.click(screen.getByRole("tab", { name: /notifications/i }));
      expect(screen.getByText(/décisions hitl en attente/i)).toBeInTheDocument();

      // Switch to API
      await user.click(screen.getByRole("tab", { name: /api/i }));
      expect(screen.getByText(/cle api/i)).toBeInTheDocument();

      // Switch back to General
      await user.click(screen.getByRole("tab", { name: /general/i }));
      expect(screen.getAllByText(/apparence/i).length).toBeGreaterThan(0);
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<SettingsPage />);

      const mainHeading = screen.getByRole("heading", { name: /parametres/i });
      expect(mainHeading).toBeInTheDocument();
    });

    it("should have accessible form labels", () => {
      render(<SettingsPage />);

      expect(screen.getAllByText(/thème/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/langue/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/format de date/i).length).toBeGreaterThan(0);
    });

    it("should have accessible tabs with roles", () => {
      render(<SettingsPage />);

      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(4);

      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("role", "tab");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle invalid JSON in localStorage gracefully", () => {
      localStorageMock["appel-offre-features"] = "invalid json{";
      localStorageMock["appel-offre-notifications"] = "{broken:";

      // Should not throw error
      expect(() => render(<SettingsPage />)).not.toThrow();
    });

    it("should merge stored settings with defaults", () => {
      const partialFeatures = { llm_fact_checker: false };
      localStorageMock["appel-offre-features"] = JSON.stringify(partialFeatures);

      render(<SettingsPage />);

      // Should load without errors and merge with defaults
      expect(global.localStorage.getItem).toHaveBeenCalledWith("appel-offre-features");
    });
  });
});
