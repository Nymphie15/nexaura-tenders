"use client";

import { useState, useEffect, useCallback } from "react";
import { useCompanyProfile, useUpdateCompanyProfile, useUploadLogo } from "@/hooks/use-company";
import { companyApi } from "@/lib/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Users,
  Euro,
  Award,
  FileText,
  Image,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { CompanyProfile } from "@/types";

const SECTORS = [
  { value: "btp", label: "BTP - Bâtiment et Travaux Publics" },
  { value: "fournitures", label: "Fournitures" },
  { value: "services", label: "Services" },
  { value: "informatique", label: "Informatique et Numérique" },
  { value: "energie", label: "Énergie et Environnement" },
  { value: "transport", label: "Transport et Logistique" },
  { value: "sante", label: "Santé et Médical" },
  { value: "securite", label: "Sécurité" },
  { value: "restauration", label: "Restauration" },
  { value: "formation", label: "Formation" },
  { value: "autre", label: "Autre" },
];

const COMPANY_SIZES = [
  { value: "micro", label: "Micro-entreprise (< 10 salariés)" },
  { value: "pme", label: "PME (10-249 salariés)" },
  { value: "eti", label: "ETI (250-4999 salariés)" },
  { value: "grande", label: "Grande entreprise (5000+ salariés)" },
];

export default function CompanyPage() {
  const { data: profile, isLoading, isError } = useCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();
  const uploadLogoMutation = useUploadLogo();

  const [form, setForm] = useState<Partial<CompanyProfile>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [siretSearch, setSiretSearch] = useState("");
  const [isEnriching, setIsEnriching] = useState(false);

  const handleSiretEnrich = useCallback(async () => {
    const cleaned = siretSearch.replace(/\s/g, "");
    if (cleaned.length !== 14) {
      toast.error("Le SIRET doit contenir 14 chiffres");
      return;
    }
    setIsEnriching(true);
    try {
      const enriched = await companyApi.enrichBySiret(cleaned);
      setForm((prev) => ({
        ...prev,
        name: (enriched.name as string) || prev.name,
        siret: (enriched.siret as string) || prev.siret,
        siren: (enriched.siren as string) || prev.siren,
        legal_form: (enriched.legal_form as string) || prev.legal_form,
        address: (enriched.address as string) || prev.address,
        postal_code: (enriched.postal_code as string) || prev.postal_code,
        city: (enriched.city as string) || prev.city,
        description: (enriched.description as string) || prev.description,
        employees: (enriched.employees as number) || prev.employees,
        annual_revenue: (enriched.annual_revenue as number) || prev.annual_revenue,
      }));
      setIsDirty(true);
      toast.success("Informations pré-remplies depuis Pappers");
    } catch (err) {
      console.error("[Company] Pappers enrichment failed:", err);
      toast.error("Impossible de récupérer les informations. Vérifiez le SIRET ou la configuration Pappers.");
    } finally {
      setIsEnriching(false);
    }
  }, [siretSearch]);

  useEffect(() => {
    if (profile) {
      setForm(profile);
    }
  }, [profile]);

  // Client-side completeness calculation as fallback
  const computedCompleteness = (() => {
    if (profile?.completeness_score) return profile.completeness_score;
    if (!profile) return 0;
    const fields = [
      profile.name, profile.siret, profile.siren, profile.legal_form,
      profile.description, profile.address, profile.postal_code, profile.city,
      profile.phone, profile.email, profile.website, profile.sector,
      profile.company_size, profile.employees, profile.annual_revenue, profile.years_experience,
    ];
    const certCount = (profile.certifications?.length || 0) > 0 ? 1 : 0;
    const filled = fields.filter((v) => v && String(v).trim()).length + certCount;
    return Math.round((filled / (fields.length + 1)) * 100);
  })();

  const handleChange = (field: keyof CompanyProfile, value: string | string[] | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync(form);
      toast.success("Profil entreprise mis à jour");
      setIsDirty(false);
    } catch (err) {
      console.error("[Company] profile update failed:", err);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync(file);
      toast.success("Logo mis à jour");
    } catch (err) {
      console.error("[Company] logo upload failed:", err);
      toast.error("Erreur lors de l'upload du logo");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[400px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>
            Impossible de charger le profil entreprise.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profil Entreprise</h1>
          <p className="text-muted-foreground mt-1">
            Gérez les informations de votre entreprise pour les réponses aux appels d&apos;offres
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!isDirty || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Enregistrer
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* SIRET Auto-fill */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Remplissage automatique par SIRET</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Entrez votre SIRET pour pre-remplir automatiquement les informations via Pappers
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="123 456 789 00012"
                      value={siretSearch}
                      onChange={(e) => setSiretSearch(e.target.value)}
                      maxLength={17}
                      className="max-w-xs"
                    />
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleSiretEnrich}
                      disabled={isEnriching || siretSearch.replace(/\s/g, "").length !== 14}
                    >
                      {isEnriching ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Search className="h-4 w-4 mr-2" />
                      )}
                      Rechercher
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Identité
              </CardTitle>
              <CardDescription>
                Informations légales de l&apos;entreprise
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Raison sociale *</Label>
                  <Input
                    id="name"
                    value={form.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Nom de l'entreprise"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siret">SIRET *</Label>
                  <Input
                    id="siret"
                    value={form.siret || ""}
                    onChange={(e) => handleChange("siret", e.target.value)}
                    placeholder="12345678901234"
                    maxLength={14}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="siren">SIREN</Label>
                  <Input
                    id="siren"
                    value={form.siren || ""}
                    onChange={(e) => handleChange("siren", e.target.value)}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="legal_form">Forme juridique</Label>
                  <Select
                    value={form.legal_form || ""}
                    onValueChange={(v) => handleChange("legal_form", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SAS">SAS</SelectItem>
                      <SelectItem value="SA">SA</SelectItem>
                      <SelectItem value="EURL">EURL</SelectItem>
                      <SelectItem value="EI">Entreprise Individuelle</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description de l&apos;activité</Label>
                <Textarea
                  id="description"
                  value={form.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Décrivez votre activité principale..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input
                  id="address"
                  value={form.address || ""}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 rue de la République"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    value={form.postal_code || ""}
                    onChange={(e) => handleChange("postal_code", e.target.value)}
                    placeholder="75001"
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input
                    id="city"
                    value={form.city || ""}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Paris"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    value={form.phone || ""}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="01 23 45 67 89"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@entreprise.fr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Site web
                </Label>
                <Input
                  id="website"
                  value={form.website || ""}
                  onChange={(e) => handleChange("website", e.target.value)}
                  placeholder="https://www.entreprise.fr"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                Informations commerciales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sector">Secteur d&apos;activité</Label>
                  <Select
                    value={form.sector || ""}
                    onValueChange={(v) => handleChange("sector", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Taille de l&apos;entreprise</Label>
                  <Select
                    value={form.company_size || ""}
                    onValueChange={(v) => handleChange("company_size", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="employees">
                    <Users className="h-4 w-4 inline mr-2" />
                    Effectif
                  </Label>
                  <Input
                    id="employees"
                    type="number"
                    value={form.employees || ""}
                    onChange={(e) =>
                      handleChange("employees", parseInt(e.target.value) || 0)
                    }
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue">
                    <Euro className="h-4 w-4 inline mr-2" />
                    Chiffre d&apos;affaires annuel (€)
                  </Label>
                  <Input
                    id="revenue"
                    type="number"
                    value={form.annual_revenue || ""}
                    onChange={(e) =>
                      handleChange("annual_revenue", parseInt(e.target.value) || 0)
                    }
                    placeholder="1000000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Années d&apos;expérience</Label>
                <Input
                  id="experience"
                  type="number"
                  value={form.years_experience || ""}
                  onChange={(e) =>
                    handleChange("years_experience", parseInt(e.target.value) || 0)
                  }
                  placeholder="15"
                />
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications et qualifications
              </CardTitle>
              <CardDescription>
                Liste des certifications détenues (ISO, Qualibat, RGE, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.certifications?.join("\n") || ""}
                onChange={(e) =>
                  handleChange(
                    "certifications",
                    e.target.value.split("\n").filter(Boolean)
                  )
                }
                placeholder="ISO 9001&#10;Qualibat 7131&#10;RGE&#10;..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Une certification par ligne
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-5 w-5" />
                Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {form.logo_url ? (
                    <img
                      src={form.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer w-full"
                >
                  <div className="flex items-center justify-center gap-2 p-3 border border-dashed rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {uploadLogoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span className="text-sm">Changer le logo</span>
                  </div>
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </Label>
                <p className="text-xs text-muted-foreground text-center">
                  PNG, JPG ou SVG. Max 5 Mo.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut du profil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Complétude</span>
                <Badge
                  variant={
                    computedCompleteness >= 80
                      ? "default"
                      : "secondary"
                  }
                  className={
                    computedCompleteness >= 80
                      ? "bg-green-100 text-green-700"
                      : ""
                  }
                >
                  {computedCompleteness}%
                </Badge>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (computedCompleteness) >= 80
                      ? "bg-green-500"
                      : (computedCompleteness) >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${computedCompleteness}%` }}
                />
              </div>
              {computedCompleteness < 80 && (
                <p className="text-xs text-muted-foreground">
                  Complétez votre profil pour améliorer la qualité des réponses
                  générées.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AO traités</span>
                <span className="font-medium">{profile?.stats?.total_tenders || 0}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taux de succès</span>
                <span className="font-medium text-green-600">
                  {profile?.stats?.win_rate || 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Montant gagné</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(profile?.stats?.total_won || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
