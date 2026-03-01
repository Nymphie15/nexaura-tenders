"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";

const features = [
  {
    icon: Zap,
    title: "Automatisation IA",
    description: "Génération automatique des réponses aux AO",
  },
  {
    icon: Shield,
    title: "Conformité garantie",
    description: "Vérification des 69 points de conformité",
  },
  {
    icon: CheckCircle2,
    title: "Taux de succès +40%",
    description: "Optimisation continue par machine learning",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success("Connexion réussie", {
        description: "Bienvenue sur Nexaura Tenders",
      });
      router.push("/");
    } catch (error) {
      toast.error("Connexion échouée", {
        description: "Email ou mot de passe incorrect",
      });
    }
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

          {/* Main content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-medium text-white">
                  Propulsé par l&apos;IA
                </span>
              </div>
              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Automatisez vos
                <br />
                <span className="text-white/80">appels d&apos;offres</span>
              </h1>
              <p className="max-w-md text-lg text-white/70">
                La plateforme intelligente qui révolutionne la réponse aux marchés publics français.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm animate-fade-up",
                    `stagger-${index + 1}`
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{feature.title}</p>
                    <p className="text-sm text-white/70">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/50">
            © 2026 Nexaura. Tous droits réservés.
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <span className="text-lg font-bold text-white">N</span>
            </div>
            <span className="text-xl font-bold text-foreground">Nexaura</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">
              Connexion
            </h2>
            <p className="mt-2 text-muted-foreground">
              Entrez vos identifiants pour accéder à votre espace
            </p>
          </div>

          <Card className="border-0 shadow-elegant">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Adresse email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@entreprise.fr"
                      className={cn(
                        "h-11 rounded-xl border-0 bg-muted/50 pl-10 focus-visible:ring-2 focus-visible:ring-primary/20",
                        errors.email && "ring-2 ring-destructive/50"
                      )}
                      {...registerField("email")}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={cn(
                        "h-11 rounded-xl border-0 bg-muted/50 pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary/20",
                        errors.password && "ring-2 ring-destructive/50"
                      )}
                      {...registerField("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                    />
                    <Label
                      htmlFor="remember"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Se souvenir de moi
                    </Label>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full rounded-xl bg-primary text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Connexion...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/register"
              className="font-semibold text-primary hover:underline"
            >
              Créer un compte
            </Link>
          </p>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 pt-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>SSL sécurisé</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>RGPD compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
