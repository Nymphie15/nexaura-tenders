"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  FileEdit,
  ExternalLink,
  Calendar,
  Building2,
  Euro,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Target,
  Briefcase,
  MapPin,
  Loader2,
  ArrowRight,
  Mail,
  Phone,
  Hash,
  Star,
  Award,
  ChevronDown,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useTender, useProcessTender } from "@/hooks/use-tenders";
import { toast } from "sonner";
import { QuickCheckWidget } from "@/components/tenders/quick-check-widget";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600" },
  ANALYZING: { label: "En analyse", color: "bg-amber-500/10 text-amber-600" },
  SCORED: { label: "Evalue", color: "bg-purple-500/10 text-purple-600" },
  PROCESSING: { label: "En traitement", color: "bg-indigo-500/10 text-indigo-600" },
  COMPLETED: { label: "Termine", color: "bg-emerald-500/10 text-emerald-600" },
  nouveau: { label: "Nouveau", color: "bg-blue-500/10 text-blue-600" },
  downloaded: { label: "Telecharge", color: "bg-cyan-500/10 text-cyan-600" },
  completed: { label: "Termine", color: "bg-emerald-500/10 text-emerald-600" },
  analyzing: { label: "En analyse", color: "bg-amber-500/10 text-amber-600" },
  expired: { label: "Expire", color: "bg-zinc-500/10 text-zinc-600" },
  error: { label: "Erreur", color: "bg-red-500/10 text-red-600" },
  processing: { label: "En traitement", color: "bg-indigo-500/10 text-indigo-600" },
  failed: { label: "Echoue", color: "bg-red-500/10 text-red-600" },
  timeout: { label: "Delai depasse", color: "bg-orange-500/10 text-orange-600" },
  FAILED: { label: "Echoue", color: "bg-red-500/10 text-red-600" },
  TIMEOUT: { label: "Delai depasse", color: "bg-orange-500/10 text-orange-600" },
  DOWNLOADED: { label: "Telecharge", color: "bg-cyan-500/10 text-cyan-600" },
  REJECTED: { label: "Rejete", color: "bg-zinc-500/10 text-zinc-600" },
  EXPIRED: { label: "Expire", color: "bg-zinc-500/10 text-zinc-600" },
};

const getStatusConfig = (status: string) => {
  return statusConfig[status] || { label: status || "Inconnu", color: "bg-zinc-500/10 text-zinc-600" };
};

const sourceConfig: Record<string, { label: string; pill: string }> = {
  BOAMP: { label: "BOAMP", pill: "bg-blue-100 text-blue-700" },
  TED: { label: "TED", pill: "bg-indigo-100 text-indigo-700" },
  UPLOAD: { label: "Upload", pill: "bg-zinc-100 text-zinc-600" },
  PLACE: { label: "PLACE", pill: "bg-violet-100 text-violet-700" },
  MEGALIS: { label: "MEGALIS", pill: "bg-violet-100 text-violet-700" },
};

function getDeadlineCountdown(deadline?: string): { text: string; className: string; urgent: boolean } {
  if (!deadline) return { text: "-", className: "text-zinc-400", urgent: false };
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: "Expire", className: "text-zinc-400", urgent: false };
  if (diffDays < 14) return { text: `J-${diffDays}`, className: "text-red-600 font-bold", urgent: true };
  return { text: `J-${diffDays}`, className: "text-emerald-600", urgent: false };
}

function getScoreBorderColor(score: number): string {
  if (score >= 80) return "border-emerald-300";
  if (score >= 60) return "border-blue-300";
  if (score >= 40) return "border-amber-300";
  return "border-zinc-300";
}

function TenderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="hidden lg:block w-60">
          <Card className="border border-zinc-200 shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenderId = params.id as string;
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data: tender, isLoading, error } = useTender(tenderId);
  const processTender = useProcessTender();

  const handleRespond = async () => {
    try {
      const result = await processTender.mutateAsync({ id: tenderId });
      toast.success("Reponse lancee", {
        description: "Le workflow a demarre. Redirection vers votre projet...",
      });
      const resultData = result as Record<string, string>;
      const caseId = resultData?.case_id || resultData?.workflow_id || tenderId;
      router.push(`/projects/${caseId}`);
    } catch (err) {
      toast.error("Erreur", {
        description: "Impossible de lancer le traitement",
      });
    }
  };

  if (isLoading) {
    return <TenderDetailSkeleton />;
  }

  if (error || !tender) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-destructive">
          Opportunite non trouvee
        </h2>
        <p className="mt-2 text-muted-foreground">
          L&apos;opportunite demandee n&apos;existe pas ou a ete supprimee.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/opportunities")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux opportunites
        </Button>
      </div>
    );
  }

  const rawAcheteur = tender.acheteur;
  const acheteur = typeof rawAcheteur === "string"
    ? { nom: rawAcheteur, adresse: undefined as string | undefined, contact: undefined as string | undefined }
    : rawAcheteur || { nom: "Non specifie", adresse: "Non specifie" as string | undefined, contact: undefined as string | undefined };
  const delais = tender.delais || { depot: tender.deadline || "", execution: "Non specifie", garantie: "Non specifie" };
  const lots = tender.lots || [];
  const criteres_jugement = tender.criteres_jugement || [];
  const requirements = tender.requirements || [];
  const documents = tender.documents || [];
  const existingCaseId = tender.workflow_cases?.[0]?.case_id || tender.case_id;
  const deadlineInfo = getDeadlineCountdown(tender.deadline);
  const src = (tender.source ? sourceConfig[tender.source] : undefined) || { label: tender.source || "-", pill: "bg-violet-100 text-violet-700" };

  return (
    <div className="space-y-6 bg-zinc-50/50 min-h-screen -m-6 p-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-zinc-500">
        <Link href="/opportunities" className="hover:text-foreground transition-colors">Opportunites</Link>
        <span className="text-zinc-300">/</span>
        <span className="font-medium text-foreground truncate max-w-[300px]">{tender.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", src.pill)}>
              {src.label}
            </span>
            <Badge variant="secondary" className={cn("text-xs", getStatusConfig(tender.status).color)}>
              {getStatusConfig(tender.status).label}
            </Badge>
            {tender.type_marche && (
              <Badge variant="outline" className="text-xs">{tender.type_marche}</Badge>
            )}
            {tender.procedure && (
              <Badge variant="outline" className="text-xs">{tender.procedure}</Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{tender.title}</h1>
          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {tender.client}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {tender.deadline ? formatDate(tender.deadline) : "Non specifiee"}
              {deadlineInfo.urgent && (
                <span className={cn("ml-1 font-bold", deadlineInfo.className)}>{deadlineInfo.text}</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {tender.url && (
            <Button variant="outline" className="gap-2 rounded-xl" asChild>
              <a href={tender.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Source
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="resume" className="space-y-4">
            <TabsList className="h-10 w-full justify-start gap-4 rounded-none border-b border-zinc-200 bg-transparent p-0">
              <TabsTrigger value="resume" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Resume
              </TabsTrigger>
              <TabsTrigger value="acheteur" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Acheteur
              </TabsTrigger>
              <TabsTrigger value="exigences" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Exigences ({requirements.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent px-1 pb-3 pt-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none">
                Documents ({documents.length})
              </TabsTrigger>
            </TabsList>

            {/* Resume Tab */}
            <TabsContent value="resume" className="space-y-4">
              {/* Description */}
              <Card className="border border-zinc-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {tender.description || "Aucune description disponible."}
                  </p>
                </CardContent>
              </Card>

              {/* Criteres de jugement */}
              {criteres_jugement.length > 0 && (
                <Card className="border border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Criteres de jugement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criteres_jugement.map((critere) => (
                        <div key={critere.critere || critere.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{critere.critere || critere.name}</span>
                            <span className="font-medium tabular-nums">{critere.ponderation || critere.weight}%</span>
                          </div>
                          <Progress value={critere.ponderation || critere.weight} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Delais */}
              <Card className="border border-zinc-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Delais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Date limite de depot</span>
                      </div>
                      <span className="font-medium text-sm tabular-nums">
                        {delais.depot
                          ? formatDate(delais.depot, { hour: "2-digit", minute: "2-digit" })
                          : "Non specifiee"}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Duree d&apos;execution</span>
                      </div>
                      <span className="font-medium text-sm">{delais.execution}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                        <span className="text-sm">Garantie</span>
                      </div>
                      <span className="font-medium text-sm">{delais.garantie}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lots */}
              {lots.length > 0 && (
                <Card className="border border-zinc-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Lots ({lots.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lots.map((lot) => (
                        <div
                          key={lot.lot_number || lot.number}
                          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary tabular-nums">
                              {lot.lot_number || lot.number}
                            </div>
                            <div>
                              <p className="font-medium">{lot.title}</p>
                              <p className="text-sm text-zinc-500">Lot n{lot.lot_number || lot.number}</p>
                            </div>
                          </div>
                          {lot.budget && (
                            <div className="text-right">
                              <p className="font-semibold tabular-nums">{formatCurrency(lot.budget)}</p>
                              <p className="text-xs text-zinc-400">Budget estime</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Acheteur Tab */}
            <TabsContent value="acheteur">
              <Card className="border border-zinc-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Fiche acheteur</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Nom */}
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-4 w-4 text-zinc-400" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-zinc-400">Nom</p>
                        <p className="text-sm font-medium">{acheteur.nom || tender.client || "Non specifie"}</p>
                      </div>
                    </div>

                    {/* SIRET */}
                    {tender.acheteur_siret && (
                      <div className="flex items-start gap-3">
                        <Hash className="mt-0.5 h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400">SIRET</p>
                          <p className="text-sm font-mono">{tender.acheteur_siret}</p>
                        </div>
                      </div>
                    )}

                    {/* Adresse */}
                    {acheteur.adresse && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Adresse</p>
                          <p className="text-sm text-zinc-600">{acheteur.adresse}</p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {(tender.acheteur_email || acheteur.contact) && (
                      <div className="flex items-start gap-3">
                        <Mail className="mt-0.5 h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Email</p>
                          <a
                            href={`mailto:${tender.acheteur_email || acheteur.contact}`}
                            className="text-sm text-primary hover:underline"
                          >
                            {tender.acheteur_email || acheteur.contact}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Telephone */}
                    {tender.acheteur_telephone && (
                      <div className="flex items-start gap-3">
                        <Phone className="mt-0.5 h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Telephone</p>
                          <p className="text-sm">{tender.acheteur_telephone}</p>
                        </div>
                      </div>
                    )}

                    {/* Contact */}
                    {(tender.contact_nom || tender.contact_fonction) && (
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 text-zinc-400" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-zinc-400">Contact</p>
                          <p className="text-sm font-medium">{tender.contact_nom}</p>
                          {tender.contact_fonction && (
                            <p className="text-xs text-zinc-500">{tender.contact_fonction}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exigences Tab */}
            <TabsContent value="exigences">
              <Card className="border border-zinc-200 shadow-sm">
                <CardContent className="p-6">
                  {requirements.length > 0 ? (
                    <div className="space-y-3">
                      {requirements.map((req, index) => (
                        <div
                          key={req.id || index}
                          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-lg",
                                (req.score ?? 0) >= 80
                                  ? "bg-emerald-500/10"
                                  : (req.score ?? 0) >= 60
                                  ? "bg-amber-500/10"
                                  : "bg-rose-500/10"
                              )}
                            >
                              <CheckCircle2
                                className={cn(
                                  "h-5 w-5",
                                  (req.score ?? 0) >= 80
                                    ? "text-emerald-600"
                                    : (req.score ?? 0) >= 60
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                )}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{req.title || req.text}</p>
                                {req.mandatory && (
                                  <Badge variant="secondary" className="text-[10px]">Obligatoire</Badge>
                                )}
                              </div>
                              {(req.type || req.category) && (
                                <p className="text-sm text-zinc-500">{req.type || req.category}</p>
                              )}
                            </div>
                          </div>
                          {req.score !== undefined && (
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-200">
                                <div
                                  className={cn(
                                    "h-full rounded-full",
                                    req.score >= 80 ? "bg-emerald-500" : req.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                                  )}
                                  style={{ width: `${req.score}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium w-10 tabular-nums">{req.score}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-zinc-500 py-8">
                      Aucune exigence extraite pour le moment
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="border border-zinc-200 shadow-sm">
                <CardContent className="p-6">
                  {documents.length > 0 ? (
                    <div className="space-y-3">
                      {documents.map((doc, index) => (
                        <div
                          key={doc.name || index}
                          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-zinc-500">
                                {doc.type?.toUpperCase()} - {doc.size ? `${(doc.size / 1024).toFixed(1)} Ko` : "Taille inconnue"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-zinc-500 py-8">
                      Aucun document DCE disponible
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sticky right panel */}
        <div className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-6 space-y-4">
            {/* Score Card */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400 text-center mb-3">Pertinence</p>
                <div className={cn(
                  "relative flex h-20 w-20 items-center justify-center rounded-full border-4 mx-auto",
                  tender.score != null ? getScoreBorderColor(tender.score) : "border-zinc-200"
                )}>
                  <div className="text-center">
                    <span className="text-xl font-bold tabular-nums">{tender.score ?? 0}</span>
                    <span className="text-xs text-zinc-400">/100</span>
                  </div>
                </div>

                {/* Breakdown toggle */}
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center justify-center gap-1 w-full mt-3 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  Details
                  <ChevronDown className={cn("h-3 w-3 transition-transform", showBreakdown && "rotate-180")} />
                </button>

                {showBreakdown && (
                  <div className="mt-3 space-y-2 text-xs border-t border-zinc-100 pt-3">
                    {[
                      { icon: Briefcase, label: "Domaine", value: tender.relevance_details?.domain_match, max: 40 },
                      { icon: Star, label: "CPV", value: tender.relevance_details?.cpv_match, max: 25 },
                      { icon: MapPin, label: "Geographie", value: tender.relevance_details?.geo_match, max: 15 },
                      { icon: Euro, label: "Budget", value: tender.relevance_details?.budget_match, max: 10 },
                      { icon: Award, label: "Certifications", value: tender.relevance_details?.cert_match, max: 10 },
                    ].map(({ icon: Icon, label, value, max }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <Icon className="h-3 w-3" />
                          {label}
                        </span>
                        <span className="tabular-nums font-medium">{value ?? 0}/{max}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Card */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Budget estime</p>
                <p className="text-lg font-bold tabular-nums">
                  {tender.budget ? formatCurrency(tender.budget) : "-"}
                </p>
              </CardContent>
            </Card>

            {/* Deadline Card */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">Date limite</p>
                <p className={cn("text-lg font-bold tabular-nums", deadlineInfo.className)}>
                  {deadlineInfo.text}
                </p>
                {tender.deadline && (
                  <p className="text-xs text-zinc-400 mt-0.5">{formatDate(tender.deadline)}</p>
                )}
              </CardContent>
            </Card>

            {/* Quick Check Widget */}
            {process.env.NEXT_PUBLIC_ENABLE_AI_ANALYSIS === "true" && (
              <QuickCheckWidget tenderId={tenderId} />
            )}

            {/* CTA Card */}
            <Card className="border border-zinc-200 shadow-sm">
              <CardContent className="p-5">
                {existingCaseId ? (
                  <Button
                    variant="outline"
                    className="w-full gap-2 rounded-xl border-primary text-primary hover:bg-primary/10"
                    onClick={() => router.push(`/projects/${existingCaseId}`)}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Voir le projet
                  </Button>
                ) : (
                  <Button
                    className="w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
                    onClick={handleRespond}
                    disabled={processTender.isPending}
                  >
                    {processTender.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Lancement...
                      </>
                    ) : (
                      <>
                        <FileEdit className="h-4 w-4" />
                        Lancer la reponse IA
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
