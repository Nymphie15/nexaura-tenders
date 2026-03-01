"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

// Types
interface MFAStatus {
  enabled: boolean;
  verified_at: string | null;
  backup_codes_remaining: number;
  locked: boolean;
  locked_until: string | null;
}

interface MFASetupData {
  qr_code_base64: string;
  provisioning_uri: string;
  backup_codes: string[];
  message: string;
}

// Backup Code Display Component
function BackupCodesDisplay({
  codes,
  onClose,
}: {
  codes: string[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyAllCodes = useCallback(() => {
    const text = codes.join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [codes]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5 text-amber-500" />
            Codes de recuperation
          </DialogTitle>
          <DialogDescription>
            Conservez ces codes en lieu sur. Chaque code ne peut etre utilise
            qu&apos;une seule fois.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="size-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Ces codes ne seront plus affiches. Sauvegardez-les maintenant !
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
          {codes.map((code, i) => (
            <div
              key={i}
              className="px-3 py-2 bg-background rounded border text-center"
            >
              {code}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={copyAllCodes}>
            {copied ? (
              <>
                <Check className="size-4 mr-2" />
                Copie !
              </>
            ) : (
              <>
                <Copy className="size-4 mr-2" />
                Copier tout
              </>
            )}
          </Button>
          <Button onClick={onClose}>J&apos;ai sauvegarde mes codes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// MFA Setup Wizard Component
function MFASetupWizard({
  setupData,
  onComplete,
  onCancel,
}: {
  setupData: MFASetupData;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<"scan" | "verify" | "backup">("scan");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUri, setShowUri] = useState(false);

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError("Entrez un code a 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/mfa/setup/complete", { code });
      setStep("backup");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Code invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Configuration de l&apos;authentification a deux facteurs
          </DialogTitle>
        </DialogHeader>

        {step === "scan" && (
          <div className="space-y-4">
            <DialogDescription>
              Scannez ce QR code avec votre application d&apos;authentification
              (Google Authenticator, Authy, etc.)
            </DialogDescription>

            <div className="flex justify-center p-4 bg-card rounded-lg">
              <img
                src={`data:image/png;base64,${setupData.qr_code_base64}`}
                alt="QR Code MFA"
                className="w-48 h-48"
              />
            </div>

            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUri(!showUri)}
                className="w-full"
              >
                {showUri ? (
                  <EyeOff className="size-4 mr-2" />
                ) : (
                  <Eye className="size-4 mr-2" />
                )}
                {showUri ? "Masquer le code manuel" : "Afficher le code manuel"}
              </Button>
              {showUri && (
                <div className="p-2 bg-muted rounded text-xs font-mono break-all">
                  {setupData.provisioning_uri}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button onClick={() => setStep("verify")}>
                <Smartphone className="size-4 mr-2" />
                J&apos;ai scanne le QR code
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "verify" && (
          <div className="space-y-4">
            <DialogDescription>
              Entrez le code a 6 chiffres affiche dans votre application
              d&apos;authentification.
            </DialogDescription>

            <div className="space-y-2">
              <Label htmlFor="mfa-code">Code de verification</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("scan")}>
                Retour
              </Button>
              <Button onClick={verifyCode} disabled={loading || code.length !== 6}>
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Verifier
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === "backup" && (
          <BackupCodesDisplay codes={setupData.backup_codes} onClose={onComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Disable MFA Dialog
function DisableMFADialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    if (!password || code.length !== 6) {
      setError("Mot de passe et code MFA requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/mfa/disable", { password, code });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Erreur lors de la desactivation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="size-5" />
            Desactiver l&apos;authentification a deux facteurs
          </DialogTitle>
          <DialogDescription>
            Cette action reduira la securite de votre compte. Confirmez votre
            identite pour continuer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disable-password">Mot de passe</Label>
            <Input
              id="disable-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disable-code">Code MFA actuel</Label>
            <Input
              id="disable-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center tracking-widest font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Desactiver MFA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main MFA Setup Component
export function MFASetup() {
  const [status, setStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Fetch MFA status on mount
  React.useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get<MFAStatus>("/mfa/status");
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch MFA status:", err);
    } finally {
      setLoading(false);
    }
  };

  const initiateSetup = async () => {
    if (!password) {
      setSetupError("Mot de passe requis");
      return;
    }

    setSetupLoading(true);
    setSetupError("");

    try {
      const { data } = await api.post<MFASetupData>("/mfa/setup/init", { password });
      setSetupData(data);
      setPassword("");
    } catch (err: any) {
      setSetupError(err.response?.data?.detail || "Erreur lors de l'initialisation");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setSetupData(null);
    fetchStatus();
  };

  const handleDisableSuccess = () => {
    setShowDisableDialog(false);
    fetchStatus();
  };

  const regenerateBackupCodes = async (code: string) => {
    try {
      const { data } = await api.post<{ backup_codes: string[] }>("/mfa/backup-codes/regenerate", { code });
      return data.backup_codes;
    } catch (err) {
      console.error("Failed to regenerate backup codes:", err);
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status?.enabled ? (
                <ShieldCheck className="size-8 text-green-500" />
              ) : (
                <Shield className="size-8 text-muted-foreground" />
              )}
              <div>
                <CardTitle>Authentification a deux facteurs (MFA)</CardTitle>
                <CardDescription>
                  Renforcez la securite de votre compte avec un code temporaire
                </CardDescription>
              </div>
            </div>
            {status && (
              <Switch
                checked={status.enabled}
                onCheckedChange={(checked) => {
                  if (!checked) {
                    setShowDisableDialog(true);
                  }
                }}
                disabled={!status.enabled}
              />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <ShieldCheck className="size-4 text-green-600" />
                <AlertTitle className="text-green-800 dark:text-green-400">
                  MFA active
                </AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-500">
                  Votre compte est protege par l&apos;authentification a deux facteurs.
                  {status.verified_at && (
                    <span className="block mt-1 text-xs">
                      Active le {new Date(status.verified_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Key className="size-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Codes de recuperation</p>
                    <p className="text-sm text-muted-foreground">
                      {status.backup_codes_remaining} codes restants
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateDialog(true)}
                >
                  <RefreshCw className="size-4 mr-2" />
                  Regenerer
                </Button>
              </div>

              {status.backup_codes_remaining <= 2 && (
                <Alert variant="destructive">
                  <AlertTriangle className="size-4" />
                  <AlertTitle>Codes de recuperation faibles</AlertTitle>
                  <AlertDescription>
                    Il vous reste peu de codes de recuperation. Regenerez-en de
                    nouveaux pour eviter de perdre l&apos;acces a votre compte.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <>
              <Alert>
                <Shield className="size-4" />
                <AlertTitle>Protegez votre compte</AlertTitle>
                <AlertDescription>
                  L&apos;authentification a deux facteurs ajoute une couche de
                  securite supplementaire en exigeant un code temporaire lors de
                  la connexion.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setup-password">
                    Confirmez votre mot de passe pour activer MFA
                  </Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSetupError("");
                    }}
                    placeholder="Votre mot de passe"
                  />
                  {setupError && (
                    <p className="text-sm text-destructive">{setupError}</p>
                  )}
                </div>

                <Button
                  onClick={initiateSetup}
                  disabled={setupLoading || !password}
                  className="w-full"
                >
                  {setupLoading ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldCheck className="size-4 mr-2" />
                  )}
                  Activer l&apos;authentification a deux facteurs
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup Wizard */}
      {setupData && (
        <MFASetupWizard
          setupData={setupData}
          onComplete={handleSetupComplete}
          onCancel={() => setSetupData(null)}
        />
      )}

      {/* Disable MFA Dialog */}
      <DisableMFADialog
        open={showDisableDialog}
        onClose={() => setShowDisableDialog(false)}
        onSuccess={handleDisableSuccess}
      />

      {/* Regenerate Backup Codes Dialog */}
      {showRegenerateDialog && (
        <RegenerateBackupCodesDialog
          open={showRegenerateDialog}
          onClose={() => setShowRegenerateDialog(false)}
          onRegenerate={regenerateBackupCodes}
        />
      )}
    </>
  );
}

// Regenerate Backup Codes Dialog
function RegenerateBackupCodesDialog({
  open,
  onClose,
  onRegenerate,
}: {
  open: boolean;
  onClose: () => void;
  onRegenerate: (code: string) => Promise<string[] | null>;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [newCodes, setNewCodes] = useState<string[] | null>(null);

  const handleRegenerate = async () => {
    if (code.length !== 6) {
      setError("Entrez un code a 6 chiffres");
      return;
    }

    setLoading(true);
    setError("");

    const codes = await onRegenerate(code);
    if (codes) {
      setNewCodes(codes);
    } else {
      setError("Code invalide ou erreur");
    }

    setLoading(false);
  };

  if (newCodes) {
    return (
      <BackupCodesDisplay
        codes={newCodes}
        onClose={() => {
          setNewCodes(null);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5 text-primary" />
            Regenerer les codes de recuperation
          </DialogTitle>
          <DialogDescription>
            Les anciens codes seront invalides. Entrez votre code MFA actuel
            pour confirmer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="regen-code">Code MFA actuel</Label>
            <Input
              id="regen-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              placeholder="000000"
              className="text-center tracking-widest font-mono"
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleRegenerate} disabled={loading || code.length !== 6}>
            {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
            Regenerer les codes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default MFASetup;
