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
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register: authRegister, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authRegister({
        email: data.email,
        password: data.password,
        full_name: `${data.firstName} ${data.lastName}`,
      });
      toast.success("Compte créé avec succès", {
        description: "Bienvenue sur Nexaura Tenders",
      });
      router.push("/");
    } catch (error) {
      toast.error("Erreur lors de la création du compte", {
        description: "Vérifiez vos informations et réessayez",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/20">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">Nexaura</span>
            <span className="ml-1.5 text-sm font-medium text-muted-foreground">
              Tenders
            </span>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            Créer votre compte
          </h2>
          <p className="mt-2 text-muted-foreground">
            Commencez gratuitement, sans engagement
          </p>
        </div>

        <Card className="border-0 shadow-elegant bg-card">
          <CardContent className="p-6 text-card-foreground">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                    Prénom
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Jean"
                      className={cn(
                        "h-11 rounded-xl border-0 bg-muted/50 pl-10 text-foreground",
                        errors.firstName && "ring-2 ring-destructive/50"
                      )}
                      {...registerField("firstName")}
                    />
                  </div>
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                    Nom
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    className={cn(
                      "h-11 rounded-xl border-0 bg-muted/50 text-foreground",
                      errors.lastName && "ring-2 ring-destructive/50"
                    )}
                    {...registerField("lastName")}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Adresse email professionnelle
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vous@entreprise.fr"
                    className={cn(
                      "h-11 rounded-xl border-0 bg-muted/50 pl-10 text-foreground",
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
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 caractères"
                    className={cn(
                      "h-11 rounded-xl border-0 bg-muted/50 pl-10 pr-10 text-foreground",
                      errors.password && "ring-2 ring-destructive/50"
                    )}
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 caractères
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-primary text-sm font-semibold shadow-lg shadow-primary/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Création...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Créer mon compte
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Données sécurisées</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4" />
            <span>Essai gratuit 14 jours</span>
          </div>
        </div>
      </div>
    </div>
  );
}
