"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
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
import { cn } from "@/lib/utils";
import api from "@/lib/api/client";
import {
  Shield,
  Key,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Timer,
  Lock,
} from "lucide-react";

// Types
interface MFAVerifyProps {
  mfaToken: string;
  email?: string;
  onSuccess: (tokens: { access_token: string; refresh_token: string }) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
}

interface VerifyResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface ErrorResponse {
  detail: string | { message: string; locked_until?: string };
}

/**
 * MFA Verification Component
 *
 * Displayed after successful password authentication when MFA is enabled.
 * Handles TOTP code and backup code verification.
 */
export function MFAVerify({
  mfaToken,
  email,
  onSuccess,
  onCancel,
  onError,
}: MFAVerifyProps) {
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [lockCountdown, setLockCountdown] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and mode change
  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) {
      setLockCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diff = lockedUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setLockedUntil(null);
        setLockCountdown("");
        setError("");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setLockCountdown(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Handle code input change
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (mode === "totp") {
      // TOTP: Only digits, max 6
      setCode(value.replace(/\D/g, "").slice(0, 6));
    } else {
      // Backup: Alphanumeric, max 8, uppercase
      setCode(
        value
          .replace(/[^A-Za-z0-9]/g, "")
          .toUpperCase()
          .slice(0, 8)
      );
    }

    setError("");
  };

  // Auto-submit when code is complete
  useEffect(() => {
    if (mode === "totp" && code.length === 6) {
      handleVerify();
    } else if (mode === "backup" && code.length === 8) {
      handleVerify();
    }
  }, [code]);

  // Verify the code
  const handleVerify = async () => {
    if (lockedUntil) return;

    const requiredLength = mode === "totp" ? 6 : 8;
    if (code.length !== requiredLength) {
      setError(
        mode === "totp"
          ? "Entrez un code a 6 chiffres"
          : "Entrez un code de recuperation a 8 caracteres"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post<VerifyResponse>("/mfa/login/verify", {
        mfa_token: mfaToken,
        code: code,
      });
      onSuccess({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    } catch (err: any) {
      const responseData = err.response?.data;
      let errorMessage = "Code invalide";

      if (typeof responseData?.detail === "object") {
        errorMessage = responseData.detail.message;
        if (responseData.detail.locked_until) {
          setLockedUntil(new Date(responseData.detail.locked_until));
        }
      } else if (typeof responseData?.detail === "string") {
        errorMessage = responseData.detail;
      } else if (!err.response) {
        errorMessage = "Erreur de connexion au serveur";
      }

      if (err.response?.status === 429) {
        setRemainingAttempts(0);
      }

      setError(errorMessage);
      setCode("");
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleVerify();
    }
  };

  // Switch between TOTP and backup code mode
  const toggleMode = () => {
    setMode(mode === "totp" ? "backup" : "totp");
    setCode("");
    setError("");
  };

  const isLocked = lockedUntil && lockedUntil > new Date();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          {isLocked ? (
            <Lock className="size-6 text-destructive" />
          ) : (
            <Shield className="size-6 text-primary" />
          )}
        </div>
        <CardTitle>Verification a deux facteurs</CardTitle>
        <CardDescription>
          {email
            ? `Securite supplementaire pour ${email}`
            : "Entrez votre code d'authentification"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLocked ? (
          <Alert variant="destructive">
            <Lock className="size-4" />
            <AlertTitle>Compte temporairement verrouillé</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Trop de tentatives échouées.</p>
              <div className="flex items-center gap-2 font-mono text-lg">
                <Timer className="size-4" />
                <span>Réessayez dans {lockCountdown}</span>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {mode === "totp" ? (
              <div className="space-y-2">
                <Label htmlFor="totp-code">
                  Code depuis votre application d&apos;authentification
                </Label>
                <Input
                  ref={inputRef}
                  id="totp-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="000000"
                  className={cn(
                    "text-center text-2xl tracking-[0.5em] font-mono h-14",
                    error && "border-destructive"
                  )}
                  disabled={loading}
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Le code change toutes les 30 secondes
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="backup-code">Code de recuperation</Label>
                <Input
                  ref={inputRef}
                  id="backup-code"
                  type="text"
                  maxLength={8}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  placeholder="ABCD1234"
                  className={cn(
                    "text-center text-xl tracking-widest font-mono h-14 uppercase",
                    error && "border-destructive"
                  )}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Chaque code ne peut être utilisé qu&apos;une seule fois
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {remainingAttempts !== null && remainingAttempts > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                {remainingAttempts} tentative{remainingAttempts > 1 ? "s" : ""}{" "}
                restante{remainingAttempts > 1 ? "s" : ""}
              </p>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3">
        {!isLocked && (
          <Button
            onClick={handleVerify}
            disabled={
              loading ||
              (mode === "totp" && code.length !== 6) ||
              (mode === "backup" && code.length !== 8)
            }
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Verification...
              </>
            ) : (
              "Verifier"
            )}
          </Button>
        )}

        <div className="flex items-center justify-between w-full text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground"
          >
            <ArrowLeft className="size-4 mr-1" />
            Retour
          </Button>

          {!isLocked && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMode}
              className="text-muted-foreground"
            >
              <Key className="size-4 mr-1" />
              {mode === "totp" ? "Utiliser un code de recuperation" : "Utiliser l'application"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * MFA Required Indicator
 *
 * Small badge/indicator showing MFA is required for this action.
 */
export function MFARequiredBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
        "bg-primary/10 text-primary",
        className
      )}
    >
      <Shield className="size-3" />
      MFA requis
    </div>
  );
}

/**
 * Inline MFA Verification
 *
 * Compact inline verification for sensitive operations within the app.
 */
export function InlineMFAVerify({
  onVerified,
  onCancel,
  className,
}: {
  onVerified: () => void;
  onCancel: () => void;
  className?: string;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Code a 6 chiffres requis");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/mfa/verify", { code });
      if (data.success) {
        onVerified();
        return;
      }
      setError("Code invalide");
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Erreur de verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("space-y-3 p-4 border rounded-lg bg-muted/50", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="size-4 text-primary" />
        Verification MFA requise
      </div>

      <div className="flex gap-2">
        <Input
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
          className="flex-1 text-center tracking-widest font-mono"
          disabled={loading}
        />
        <Button onClick={handleVerify} disabled={loading || code.length !== 6}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Verifier"}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default MFAVerify;
