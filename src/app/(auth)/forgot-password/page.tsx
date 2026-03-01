"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export default function ForgotPasswordPage() {
  const [isLoading] = useState(false);
  const [emailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.info("Fonctionnalité bientôt disponible", {
      description: "La réinitialisation de mot de passe sera disponible prochainement. Contactez le support si nécessaire.",
    });
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel - Branding */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 lg:block">
        {/* Decorative elements */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/4 h-48 w-48 -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-xl backdrop-blur-sm">
              <span className="text-2xl font-bold text-white">N</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">Nexaura</span>
              <span className="ml-1.5 text-sm font-medium text-white/70">
                Tenders
              </span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">
                Récupération de compte sécurisée
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-white">
                Réinitialisez votre
                <br />
                mot de passe
              </h1>
              <p className="max-w-md text-lg leading-relaxed text-white/80">
                Recevez un lien de réinitialisation par email pour accéder à
                nouveau à votre compte.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-sm text-white/60">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Protection des données conforme RGPD</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardContent className="space-y-6 p-0">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Mot de passe oublié ?</h2>
              <p className="text-sm text-muted-foreground">
                {emailSent
                  ? "Email envoyé ! Vérifiez votre boîte de réception."
                  : "Entrez votre email pour recevoir un lien de réinitialisation"}
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="vous@entreprise.fr"
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        Envoyer le lien
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </span>
                </Button>
              </form>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Un email contenant les instructions pour réinitialiser votre
                  mot de passe a été envoyé à votre adresse email. Vérifiez
                  également votre dossier spam.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </div>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span>SSL sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span>RGPD compliant</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
