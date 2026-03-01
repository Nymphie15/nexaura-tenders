"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Zap,
  Key,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { authApi } from "@/lib/api/endpoints";

const STORAGE_KEY_FEATURES = "appel-offre-features";
const STORAGE_KEY_NOTIFICATIONS = "appel-offre-notifications";

const defaultFeatures = {
  llm_fact_checker: true,
  confidence_scoring: true,
  vector_matching: true,
  auto_download_dce: false,
  email_notifications: true,
  slack_notifications: false,
};

const defaultNotifications = {
  hitl_pending: true,
  workflow_completed: true,
  workflow_failed: true,
  new_tender: false,
  slack_notifications: false,
  deadline_reminder: true,
  weekly_report: false,
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Feature toggles - persisted to localStorage
  const [features, setFeatures] = useState(defaultFeatures);

  // Notifications settings - persisted to localStorage
  const [notifications, setNotifications] = useState(defaultNotifications);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedFeatures = localStorage.getItem(STORAGE_KEY_FEATURES);
    const storedNotifications = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);

    if (storedFeatures) {
      try {
        setFeatures({ ...defaultFeatures, ...JSON.parse(storedFeatures) });
      } catch {
        // Invalid JSON, use defaults
      }
    }

    if (storedNotifications) {
      try {
        setNotifications({ ...defaultNotifications, ...JSON.parse(storedNotifications) });
      } catch {
        // Invalid JSON, use defaults
      }
    }

    setIsLoaded(true);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(features));
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));

      // Small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success("Paramètres enregistrés", {
        description: "Vos preferences ont ete sauvegardees",
      });
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Veuillez remplir les deux champs");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Mot de passe modifié avec succès");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        toast.error("Mot de passe actuel incorrect");
      } else {
        toast.error("Erreur lors du changement de mot de passe");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Parametres</h1>
          <p className="text-muted-foreground mt-1">
            Configurez les options de votre compte et de l&apos;application
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <Tabs defaultValue="general">
        <div className="flex flex-col lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
          <nav>
            <TabsList className="flex w-full overflow-x-auto lg:flex-col lg:h-auto lg:w-full lg:bg-transparent lg:p-0 gap-1">
              <TabsTrigger value="general" className="gap-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:py-2 lg:data-[state=active]:bg-muted lg:data-[state=active]:shadow-none">
                <Settings className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="features" className="gap-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:py-2 lg:data-[state=active]:bg-muted lg:data-[state=active]:shadow-none">
                <Zap className="h-4 w-4" />
                Fonctionnalites
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:py-2 lg:data-[state=active]:bg-muted lg:data-[state=active]:shadow-none">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="api" className="gap-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:py-2 lg:data-[state=active]:bg-muted lg:data-[state=active]:shadow-none">
                <Key className="h-4 w-4" />
                API
              </TabsTrigger>
            </TabsList>
          </nav>

          <div className="mt-6 lg:mt-0 min-w-0">

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-0">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence
              </CardTitle>
              <CardDescription>
                Personnalisez l&apos;apparence de l&apos;application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Thème</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisissez entre mode clair et sombre
                  </p>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Langue et région
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Langue</Label>
                  <p className="text-sm text-muted-foreground">
                    Langue de l&apos;interface
                  </p>
                </div>
                <Select defaultValue="fr">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en" disabled>
                      English (bientôt)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Format de date</Label>
                  <p className="text-sm text-muted-foreground">
                    Format d&apos;affichage des dates
                  </p>
                </div>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Authentification à deux facteurs</Label>
                  <p className="text-sm text-muted-foreground">
                    Ajoute une couche de sécurité supplémentaire
                  </p>
                </div>
                <Badge variant="secondary">Bientôt disponible</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Changer le mot de passe</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe (min. 8 caractères)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    "Mettre à jour"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Fonctionnalités IA
              </CardTitle>
              <CardDescription>
                Activez ou désactivez les fonctionnalités avancées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Fact Checker LLM</Label>
                  <p className="text-sm text-muted-foreground">
                    Vérifie l&apos;exactitude des informations générées
                  </p>
                </div>
                <Switch
                  checked={features.llm_fact_checker}
                  onCheckedChange={(v) =>
                    setFeatures((f) => ({ ...f, llm_fact_checker: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Scoring de confiance</Label>
                  <p className="text-sm text-muted-foreground">
                    Calcule un score de confiance pour chaque section
                  </p>
                </div>
                <Switch
                  checked={features.confidence_scoring}
                  onCheckedChange={(v) =>
                    setFeatures((f) => ({ ...f, confidence_scoring: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Matching vectoriel</Label>
                  <p className="text-sm text-muted-foreground">
                    Utilise des embeddings pour le matching produits
                  </p>
                </div>
                <Switch
                  checked={features.vector_matching}
                  onCheckedChange={(v) =>
                    setFeatures((f) => ({ ...f, vector_matching: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Téléchargement DCE automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Télécharge automatiquement les DCE depuis les plateformes
                  </p>
                </div>
                <Switch
                  checked={features.auto_download_dce}
                  onCheckedChange={(v) =>
                    setFeatures((f) => ({ ...f, auto_download_dce: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 dark:border-indigo-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Configuration optimale</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pour de meilleurs résultats, nous recommandons d&apos;activer
                    toutes les fonctionnalités IA (Fact Checker, Scoring, Matching vectoriel).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications par email
              </CardTitle>
              <CardDescription>
                Choisissez quand recevoir des emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Décisions HITL en attente</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifié quand une décision humaine est requise
                  </p>
                </div>
                <Switch
                  checked={notifications.hitl_pending}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, hitl_pending: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Workflow terminé</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifié quand un workflow se termine avec succès
                  </p>
                </div>
                <Switch
                  checked={notifications.workflow_completed}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, workflow_completed: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Workflow échoué</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifié en cas d&apos;erreur dans un workflow
                  </p>
                </div>
                <Switch
                  checked={notifications.workflow_failed}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, workflow_failed: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rappel de deadline</Label>
                  <p className="text-sm text-muted-foreground">
                    Rappel 48h avant la date limite de réponse
                  </p>
                </div>
                <Switch
                  checked={notifications.deadline_reminder}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, deadline_reminder: v }))
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label>Rapport hebdomadaire</Label>
                  <p className="text-sm text-muted-foreground">
                    Résumé de l&apos;activité chaque semaine
                  </p>
                </div>
                <Switch
                  checked={notifications.weekly_report}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, weekly_report: v }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Intégrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications Slack</Label>
                  <p className="text-sm text-muted-foreground">
                    Envoyez les notifications vers un canal Slack
                  </p>
                </div>
                <Switch
                  checked={notifications.slack_notifications}
                  onCheckedChange={(v) =>
                    setNotifications((n) => ({ ...n, slack_notifications: v }))
                  }
                />
              </div>
              {notifications.slack_notifications && (
                <div className="space-y-2 pl-4 border-l-2">
                  <Label htmlFor="slack-webhook">URL du Webhook Slack</Label>
                  <Input
                    id="slack-webhook"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="h-5 w-5" />
                Cle API
              </CardTitle>
              <CardDescription>
                Utilisez cette cle pour acceder a l&apos;API depuis vos applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center py-8 text-center">
                <div className="space-y-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mx-auto">
                    <Key className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary">Bientot disponible</Badge>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    La generation de cles API sera disponible dans une prochaine version.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentation API</CardTitle>
              <CardDescription>
                Consultez la documentation pour integrer l&apos;API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button variant="outline" className="h-auto py-4" asChild>
                  <a
                    href="/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Globe className="h-6 w-6" />
                      <span className="font-semibold">Swagger UI</span>
                      <span className="text-xs text-muted-foreground">
                        Documentation interactive
                      </span>
                    </div>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-4" asChild>
                  <a
                    href="/redoc"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Key className="h-6 w-6" />
                      <span className="font-semibold">ReDoc</span>
                      <span className="text-xs text-muted-foreground">
                        Documentation detaillee
                      </span>
                    </div>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
