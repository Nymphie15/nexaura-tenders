"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FlaskConical,
  Play,
  Square,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  FileText,
  Building2,
  RefreshCw,
  History,
  Eye,
  Database,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileCode,
  Award,
  Target,
  Brain,
  Zap,
  Timer,
  Wifi,
  WifiOff,
  MessageSquare,
  GitCompare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTestSectors,
  useTestHistory,
  useTestStatus,
  useTestResults,
  useExistingResults,
  useSectorMemoire,
  useStartTest,
  useCancelTest,
  downloadSectorDocuments,
  downloadExistingSectorDocuments,
  useDbGeneratedTests,
  useDbTestDocument,
  useDbTestStats,
  useStartRealLLMTest,
  useRealLLMTestStatus,
  useRealLLMTestResults,
  useCancelRealLLMTest,
  useRealLLMTestProgress,
} from "@/hooks/use-tests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LLMPromptTester } from "@/components/tests/llm-prompt-tester";
import { ModelComparison } from "@/components/tests/model-comparison";
import { LLMMetricsDashboard } from "@/components/tests/llm-metrics-dashboard";
import { TestEvaluator } from "@/components/tests/test-evaluator";
import { LLMEvalDashboard } from "@/components/tests/llm-eval-dashboard";

// Sector display names and icons
const SECTOR_INFO: Record<string, { name: string; icon: string }> = {
  btp: { name: "BTP & Construction", icon: "🏗️" },
  fournitures: { name: "Fournitures Bureau", icon: "📦" },
  it: { name: "Informatique & IT", icon: "💻" },
  medical: { name: "Medical & Sante", icon: "🏥" },
  nettoyage: { name: "Nettoyage & Proprete", icon: "🧹" },
  formation: { name: "Formation", icon: "📚" },
  securite: { name: "Securite & Gardiennage", icon: "🔒" },
  transport: { name: "Transport & Logistique", icon: "🚚" },
  restauration: { name: "Restauration Collective", icon: "🍽️" },
  espaces_verts: { name: "Espaces Verts", icon: "🌳" },
  energie: { name: "Energie", icon: "⚡" },
  conseil: { name: "Conseil & Ingenierie", icon: "📊" },
};

const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
  pending: { color: "bg-gray-100 text-gray-600", icon: <Clock className="h-4 w-4" /> },
  running: { color: "bg-blue-100 text-blue-600", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
  success: { color: "bg-emerald-100 text-emerald-600", icon: <CheckCircle2 className="h-4 w-4" /> },
  error: { color: "bg-red-100 text-red-600", icon: <XCircle className="h-4 w-4" /> },
  cancelled: { color: "bg-amber-100 text-amber-600", icon: <Square className="h-4 w-4" /> },
};

// Memoire Preview Dialog Component
function MemoirePreviewDialog({ sector, content }: { sector: string; content: string }) {
  const info = SECTOR_INFO[sector] || { name: sector, icon: "📄" };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="h-4 w-4 mr-1" />
          Voir MT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{info.icon}</span>
            Mémoire Technique - {info.name}
          </DialogTitle>
          <DialogDescription>
            Contenu généré par LLM ({content.length} caractères)
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] mt-4">
          <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
            {content}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Sector Card Component
function SectorCard({
  sector,
  result,
  testId,
}: {
  sector: string;
  result?: {
    status: string;
    company_name?: string;
    execution_time: number;
    documents: string[];
    memoire_technique_preview?: string;
  };
  testId?: string;
}) {
  const info = SECTOR_INFO[sector] || { name: sector, icon: "📄" };
  const status = result?.status || "pending";
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      status === "running" && "ring-2 ring-blue-400 ring-offset-2"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <h4 className="font-medium text-sm">{info.name}</h4>
              {result?.company_name && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {result.company_name}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn("text-xs", statusStyle.color)}>
            {statusStyle.icon}
            <span className="ml-1 capitalize">{status}</span>
          </Badge>
        </div>

        {result && status === "success" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{result.execution_time.toFixed(1)}s</span>
              <span>{result.documents.length} docs</span>
            </div>

            <div className="flex gap-2">
              {result.memoire_technique_preview && (
                <MemoirePreviewDialog
                  sector={sector}
                  content={result.memoire_technique_preview}
                />
              )}
              {testId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSectorDocuments(testId, sector)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  ZIP
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Test Launcher Component
function TestLauncher({
  onTestStarted
}: {
  onTestStarted: (testId: string) => void
}) {
  const { data: sectors = [], isLoading: sectorsLoading } = useTestSectors();
  const startTest = useStartTest();

  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [useRealBoamp, setUseRealBoamp] = useState(true);
  const [companySiret, setCompanySiret] = useState("");

  // Select all by default
  useEffect(() => {
    if (sectors.length > 0 && selectedSectors.length === 0) {
      setSelectedSectors(sectors);
    }
  }, [sectors]);

  const handleSelectAll = () => {
    if (selectedSectors.length === sectors.length) {
      setSelectedSectors([]);
    } else {
      setSelectedSectors([...sectors]);
    }
  };

  const handleToggleSector = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      setSelectedSectors(selectedSectors.filter(s => s !== sector));
    } else {
      setSelectedSectors([...selectedSectors, sector]);
    }
  };

  const handleStartTest = async () => {
    const result = await startTest.mutateAsync({
      sectors: selectedSectors,
      use_real_boamp: useRealBoamp,
      company_siret: companySiret || undefined,
    });
    onTestStarted(result.test_id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          Configuration du Test
        </CardTitle>
        <CardDescription>
          Selectionnez les secteurs et lancez un test multi-secteur LLM
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sector Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Secteurs</Label>
            <Button variant="ghost" size="sm" onClick={handleSelectAll}>
              {selectedSectors.length === sectors.length ? "Deselectionner tout" : "Selectionner tout"}
            </Button>
          </div>

          {sectorsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {sectors.map(sector => {
                const info = SECTOR_INFO[sector] || { name: sector, icon: "📄" };
                const isSelected = selectedSectors.includes(sector);
                return (
                  <div
                    key={sector}
                    onClick={() => handleToggleSector(sector)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    <Checkbox checked={isSelected} />
                    <span className="text-lg">{info.icon}</span>
                    <span className="text-sm truncate">{info.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Utiliser vrais DCE BOAMP</Label>
              <p className="text-xs text-muted-foreground">
                Recupere des appels d&apos;offres reels depuis BOAMP
              </p>
            </div>
            <Switch checked={useRealBoamp} onCheckedChange={setUseRealBoamp} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="siret">SIRET Entreprise (optionnel)</Label>
            <Input
              id="siret"
              placeholder="Ex: 34395813800012"
              value={companySiret}
              onChange={(e) => setCompanySiret(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser des entreprises aleatoires par secteur
            </p>
          </div>
        </div>

        <Separator />

        {/* Launch Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleStartTest}
          disabled={selectedSectors.length === 0 || startTest.isPending}
        >
          {startTest.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Demarrage...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Lancer le test ({selectedSectors.length} secteurs)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Test Progress Component
function TestProgress({
  testId,
  onComplete,
}: {
  testId: string;
  onComplete?: () => void;
}) {
  const { data: status, isLoading } = useTestStatus(testId);
  const { data: results } = useTestResults(testId, {
    enabled: status?.status === "success" || status?.status === "error"
  });
  const cancelTest = useCancelTest();

  useEffect(() => {
    if (status?.status === "success" && onComplete) {
      onComplete();
    }
  }, [status?.status, onComplete]);

  if (isLoading || !status) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isRunning = status.status === "running";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
              {status.status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {status.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Test en cours
            </CardTitle>
            <CardDescription>
              {status.test_id} - {status.sectors_completed}/{status.sectors_total} secteurs
            </CardDescription>
          </div>
          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelTest.mutate(testId)}
              disabled={cancelTest.isPending}
            >
              <Square className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression</span>
            <span>{Math.round(status.progress)}%</span>
          </div>
          <Progress value={status.progress} className="h-2" />
          {status.current_sector && (
            <p className="text-sm text-muted-foreground">
              En cours: {SECTOR_INFO[status.current_sector]?.name || status.current_sector}
            </p>
          )}
        </div>

        {/* Results Grid */}
        {results && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
            {Object.entries(results.results).map(([sector, result]) => (
              <SectorCard
                key={sector}
                sector={sector}
                result={result}
                testId={testId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Existing Results Component
function ExistingResultsSection() {
  const { data: existing, isLoading, refetch } = useExistingResults();
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const { data: memoireData } = useSectorMemoire(selectedSector);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!existing || existing.count === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Aucun resultat existant. Lancez un test pour generer des memoires techniques.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultats Existants
            </CardTitle>
            <CardDescription>
              {existing.count} secteurs avec des documents generes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(existing.sectors).map(([sector, data]) => {
            const info = SECTOR_INFO[sector] || { name: sector, icon: "📄" };
            return (
              <Card key={sector} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <h4 className="font-medium text-sm">{info.name}</h4>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {data.company_folder.split("_")[0]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>{data.documents.length} documents</span>
                  </div>
                  <div className="flex gap-2">
                    {data.memoire_preview && (
                      <MemoirePreviewDialog
                        sector={sector}
                        content={data.memoire_preview}
                      />
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadExistingSectorDocuments(sector)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      ZIP
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Database Document Viewer Component
function DocumentViewer({ testId, docName }: { testId: string; docName: string }) {
  const { data, isLoading, error } = useDbTestDocument(testId, docName);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error || !data) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Erreur lors du chargement du document
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
        {data.content}
      </pre>
    </ScrollArea>
  );
}

// Database Test Card Component
function DbTestCard({ test }: { test: {
  id: string;
  sector_id: string;
  sector_name: string;
  status: string;
  company_siret?: string;
  company_name?: string;
  company_city?: string;
  dce_reference?: string;
  dce_objet?: string;
  dce_acheteur?: string;
  documents: string[];
  minijupe_score?: number;
  minijupe_compliant?: boolean;
  vcycle_score?: number;
  vcycle_coverage?: number;
  execution_time?: number;
  created_at?: string;
}}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const info = SECTOR_INFO[test.sector_id] || { name: test.sector_name, icon: "📄" };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div
          className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{info.icon}</span>
              <div>
                <h4 className="font-semibold">{info.name}</h4>
                {test.company_name && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {test.company_name}
                    {test.company_city && ` - ${test.company_city}`}
                  </p>
                )}
                {test.dce_acheteur && (
                  <p className="text-xs text-muted-foreground mt-1 max-w-[300px] truncate">
                    DCE: {test.dce_acheteur}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Scores */}
              <div className="flex gap-2">
                {test.minijupe_score !== undefined && (
                  <Badge variant={test.minijupe_compliant ? "default" : "secondary"} className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    {Math.round(test.minijupe_score * 100)}%
                  </Badge>
                )}
                {test.vcycle_coverage !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    <Target className="h-3 w-3 mr-1" />
                    {Math.round(test.vcycle_coverage)}%
                  </Badge>
                )}
              </div>
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileCode className="h-3 w-3" />
              {test.documents.length} documents
            </span>
            {test.execution_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {test.execution_time.toFixed(1)}s
              </span>
            )}
            {test.created_at && (
              <span>
                {new Date(test.created_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t bg-muted/30">
            {/* DCE Info */}
            {test.dce_objet && (
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">Objet du DCE:</p>
                <p className="text-sm text-muted-foreground mt-1">{test.dce_objet}</p>
                {test.dce_reference && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ref: {test.dce_reference}
                  </p>
                )}
              </div>
            )}

            {/* Documents list */}
            <div className="p-4">
              <p className="text-sm font-medium mb-2">Documents generes:</p>
              <div className="flex flex-wrap gap-2">
                {test.documents.map((doc) => (
                  <Button
                    key={doc}
                    variant={selectedDoc === doc ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedDoc(selectedDoc === doc ? null : doc)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {doc.replace(".txt", "").replace(/_/g, " ")}
                  </Button>
                ))}
              </div>

              {/* Document viewer */}
              {selectedDoc && (
                <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
                  <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {selectedDoc.replace(".txt", "").replace(/_/g, " ")} - {info.name}
                      </DialogTitle>
                      <DialogDescription>
                        {test.company_name} | {test.dce_acheteur}
                      </DialogDescription>
                    </DialogHeader>
                    <DocumentViewer testId={test.id} docName={selectedDoc} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Database Stats Card Component
function DbStatsCard() {
  const { data: stats, isLoading } = useDbTestStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total_tests === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold">Statistiques Tests DB</h3>
            <p className="text-sm text-muted-foreground">{stats.total_tests} tests generes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">
              {stats.average_minijupe_score ? `${Math.round(stats.average_minijupe_score * 100)}%` : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Minijupe</p>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">
              {stats.minijupe_compliant_count}/{stats.total_tests}
            </p>
            <p className="text-xs text-muted-foreground">Compliant</p>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <p className="text-2xl font-bold text-violet-600">
              {stats.average_vcycle_score ? `${Math.round(stats.average_vcycle_score)}%` : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Avg V-Cycle</p>
          </div>
          <div className="text-center p-3 bg-white/50 dark:bg-white/5 rounded-lg">
            <p className="text-2xl font-bold text-amber-600">
              {stats.average_execution_time ? `${stats.average_execution_time.toFixed(1)}s` : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Time</p>
          </div>
        </div>

        {/* Sectors breakdown */}
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Par secteur:</p>
          <div className="flex flex-wrap gap-1">
            {Object.entries(stats.by_sector).map(([sector, count]) => {
              const info = SECTOR_INFO[sector] || { icon: "📄" };
              return (
                <Badge key={sector} variant="secondary" className="text-xs">
                  {info.icon} {count}
                </Badge>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Database Tests Section Component
function DatabaseTestsSection() {
  const { data: tests, isLoading, refetch } = useDbGeneratedTests({ limit: 50 });
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);

  const filteredTests = sectorFilter
    ? tests?.filter(t => t.sector_id === sectorFilter)
    : tests;

  const sectors = tests ? [...new Set(tests.map(t => t.sector_id))] : [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!tests || tests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Database className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Aucun test en base de donnees.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Executez <code className="bg-muted px-1 rounded">python scripts/test_real_workflow_all_sectors.py</code>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <DbStatsCard />

      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Tests Generes (PostgreSQL)
              </CardTitle>
              <CardDescription>
                {tests.length} tests avec documents complets
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Sector filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={sectorFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSectorFilter(null)}
            >
              Tous ({tests.length})
            </Button>
            {sectors.map(sector => {
              const info = SECTOR_INFO[sector] || { icon: "📄", name: sector };
              const count = tests.filter(t => t.sector_id === sector).length;
              return (
                <Button
                  key={sector}
                  variant={sectorFilter === sector ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSectorFilter(sector)}
                >
                  {info.icon} {count}
                </Button>
              );
            })}
          </div>

          {/* Tests list */}
          <div className="space-y-3">
            {filteredTests?.map(test => (
              <DbTestCard key={test.id} test={test} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// REAL LLM TEST COMPONENTS (30-60s execution)
// ============================================

const WORKFLOW_PHASES = [
  { id: "PHASE_0", name: "RC Strategy", icon: "📋" },
  { id: "INGESTION", name: "Ingestion", icon: "📥" },
  { id: "EXTRACTION", name: "Extraction", icon: "🔍" },
  { id: "MATCHING", name: "Matching", icon: "🎯" },
  { id: "RISK_ANALYSIS", name: "Risk Analysis", icon: "⚠️" },
  { id: "STRATEGY", name: "Strategy", icon: "🧠" },
  { id: "CALCULATION", name: "Calculation", icon: "🧮" },
  { id: "GENERATION", name: "Generation", icon: "✍️" },
  { id: "VALIDATION", name: "Validation", icon: "✅" },
  { id: "PACKAGING", name: "Packaging", icon: "📦" },
];

// Real LLM Test Launcher Component
function RealLLMTestLauncher({
  onTestStarted,
}: {
  onTestStarted: (testId: string) => void;
}) {
  const { data: sectors = [] } = useTestSectors();
  const startTest = useStartRealLLMTest();
  const [selectedSector, setSelectedSector] = useState<string>("btp");
  const [companySiret, setCompanySiret] = useState("");

  const handleStartTest = async () => {
    const result = await startTest.mutateAsync({
      sectors: [selectedSector],
      company_siret: companySiret || undefined,
    });
    onTestStarted(result.test_id);
  };

  return (
    <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Test LLM Réel
        </CardTitle>
        <CardDescription className="space-y-1">
          <span className="block">Exécute le workflow LangGraph complet avec vrais appels LLM</span>
          <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Timer className="h-4 w-4" />
            Durée: 30-60 secondes par secteur
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sector Selection */}
        <div className="space-y-2">
          <Label>Secteur à tester</Label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {sectors.slice(0, 4).map((sector) => {
              const info = SECTOR_INFO[sector] || { name: sector, icon: "📄" };
              const isSelected = selectedSector === sector;
              return (
                <div
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                    isSelected
                      ? "bg-purple-100 dark:bg-purple-900/50 border-purple-500"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <span className="text-lg">{info.icon}</span>
                  <span className="text-xs truncate">{info.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company SIRET */}
        <div className="space-y-2">
          <Label htmlFor="siret-real">SIRET (optionnel)</Label>
          <Input
            id="siret-real"
            placeholder="Ex: 34395813800012"
            value={companySiret}
            onChange={(e) => setCompanySiret(e.target.value)}
          />
        </div>

        {/* Info box */}
        <div className="rounded-lg bg-purple-100 dark:bg-purple-900/30 p-3 text-sm">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 mt-0.5 text-purple-600" />
            <div className="space-y-1">
              <p className="font-medium">Ce test exécute:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• 10 phases du workflow LangGraph</li>
                <li>• 10-15 appels LLM (DeepSeek/Mixtral/Qwen)</li>
                <li>• Génération de vrais documents</li>
                <li>• Coût estimé: ~0.50-2€/test</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700"
          size="lg"
          onClick={handleStartTest}
          disabled={!selectedSector || startTest.isPending}
        >
          {startTest.isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Démarrage...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5 mr-2" />
              Lancer Test LLM Réel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Real LLM Test Progress Component with WebSocket
function RealLLMTestProgress({
  testId,
  onComplete,
}: {
  testId: string;
  onComplete?: () => void;
}) {
  const { data: status } = useRealLLMTestStatus(testId);
  const { data: results } = useRealLLMTestResults(testId, {
    enabled: status?.status === "success" || status?.status === "error",
  });
  const { progress, phases, isConnected } = useRealLLMTestProgress(testId);
  const cancelTest = useCancelRealLLMTest();

  useEffect(() => {
    if (status?.status === "success" && onComplete) {
      onComplete();
    }
  }, [status?.status, onComplete]);

  const isRunning = status?.status === "running";
  const currentPhaseIndex = status?.phases_completed || progress?.phase_index || 0;
  const progressPercent = status?.progress_percent || progress?.percent || 0;

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isRunning && <Loader2 className="h-5 w-5 animate-spin text-purple-500" />}
              {status?.status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {status?.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
              Test LLM Réel
              <Badge variant="secondary" className="ml-2">
                {status?.mode || "real_llm"}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-3">
              <span>{testId}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-600">Connecté</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-gray-400" />
                    <span className="text-gray-500">Déconnecté</span>
                  </>
                )}
              </span>
            </CardDescription>
          </div>
          {isRunning && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelTest.mutate(testId)}
              disabled={cancelTest.isPending}
            >
              <Square className="h-4 w-4 mr-1" />
              Annuler
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progression globale</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          {progress?.phase && (
            <p className="text-sm text-muted-foreground">
              Phase en cours: {progress.phase}
            </p>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">
              {status?.execution_time?.toFixed(1) || "0.0"}s
            </p>
            <p className="text-xs text-muted-foreground">Temps</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-600">
              {status?.llm_calls_count || 0}
            </p>
            <p className="text-xs text-muted-foreground">Appels LLM</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">
              {status?.phases_completed || 0}/{status?.phases_total || 10}
            </p>
            <p className="text-xs text-muted-foreground">Phases</p>
          </div>
        </div>

        {/* Phases Timeline */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Phases du workflow</p>
          <div className="grid grid-cols-5 gap-1">
            {WORKFLOW_PHASES.map((phase, index) => {
              const completedPhase = phases.find((p) => p.phase === phase.id);
              const isCurrentPhase = status?.current_phase === phase.id;
              const isPastPhase = index < currentPhaseIndex;
              const isFuturePhase = index > currentPhaseIndex && !isCurrentPhase;

              return (
                <div
                  key={phase.id}
                  className={cn(
                    "p-2 rounded-lg text-center transition-all",
                    isPastPhase && "bg-emerald-100 dark:bg-emerald-900/50",
                    isCurrentPhase && "bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500",
                    isFuturePhase && "bg-muted/50 opacity-50"
                  )}
                  title={`${phase.name}${completedPhase ? ` - ${completedPhase.duration}s` : ""}`}
                >
                  <span className="text-lg">{phase.icon}</span>
                  <p className="text-[10px] truncate">{phase.name}</p>
                  {completedPhase && (
                    <p className="text-[9px] text-muted-foreground">
                      {(completedPhase.duration || 0).toFixed(1)}s
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {results && status?.status === "success" && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Test terminé avec succès
            </p>

            {/* Scores */}
            <div className="flex gap-4">
              {results.minijupe_score && (
                <Badge variant="default" className="text-sm">
                  <Award className="h-4 w-4 mr-1" />
                  Minijupe: {Math.round(results.minijupe_score * 100)}%
                </Badge>
              )}
              {results.vcycle_score && (
                <Badge variant="outline" className="text-sm">
                  <Target className="h-4 w-4 mr-1" />
                  V-Cycle: {Math.round(results.vcycle_score)}%
                </Badge>
              )}
            </div>

            {/* Documents */}
            {results.documents_generated.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Documents générés:</p>
                <div className="flex flex-wrap gap-1">
                  {results.documents_generated.map((doc) => (
                    <Badge key={doc} variant="secondary" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      {doc.replace(".txt", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Phase breakdown */}
            {results.phase_progress.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Détail des phases:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {results.phase_progress.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-muted/30 p-1.5 rounded">
                      <span>{p.phase}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{(p.duration_ms / 1000).toFixed(1)}s</span>
                        {p.llm_calls > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {p.llm_calls} LLM
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error display */}
        {status?.status === "error" && status?.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-sm text-red-600 dark:text-red-400">
            <p className="font-medium">Erreur:</p>
            <p className="text-xs mt-1">{status.error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// History Component
function TestHistorySection() {
  const { data: history, isLoading } = useTestHistory(10);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des Tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {history.map((item) => {
            const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
            return (
              <div
                key={item.test_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Badge className={cn("text-xs", statusStyle.color)}>
                    {statusStyle.icon}
                    <span className="ml-1 capitalize">{item.status}</span>
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{item.test_id}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.sectors_completed}/{item.sectors_total} secteurs
                    </p>
                  </div>
                </div>
                {item.started_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.started_at).toLocaleString("fr-FR")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page Component
export default function TestsPage() {
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeRealTestId, setActiveRealTestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("database");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <FlaskConical className="h-8 w-8" />
          Tests Multi-Secteurs LLM
        </h1>
        <p className="text-muted-foreground mt-1">
          Testez la generation de memoires techniques sur les 12 secteurs d&apos;activite
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full max-w-5xl flex-wrap gap-1">
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tests DB
          </TabsTrigger>
          <TabsTrigger value="real-llm" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            LLM Reel
          </TabsTrigger>
          <TabsTrigger value="prompt-tester" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Test Prompt
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Comparaison
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Metriques
          </TabsTrigger>
          <TabsTrigger value="launcher" className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            Demo
          </TabsTrigger>
          <TabsTrigger value="test-eval" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Evaluateur IA
          </TabsTrigger>
          {process.env.NEXT_PUBLIC_ENABLE_LLM_EVAL === "true" && (
            <TabsTrigger value="llm-eval" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              LLM-as-Judge
            </TabsTrigger>
          )}
        </TabsList>

        {/* Database Tests Tab */}
        <TabsContent value="database" className="mt-6">
          <DatabaseTestsSection />
        </TabsContent>

        {/* Real LLM Test Tab */}
        <TabsContent value="real-llm" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Launcher or Progress */}
            <div className="space-y-6">
              {activeRealTestId ? (
                <RealLLMTestProgress
                  testId={activeRealTestId}
                  onComplete={() => {}}
                />
              ) : (
                <RealLLMTestLauncher onTestStarted={setActiveRealTestId} />
              )}

              {activeRealTestId && (
                <Button
                  variant="outline"
                  onClick={() => setActiveRealTestId(null)}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Nouveau test LLM reel
                </Button>
              )}
            </div>

            {/* Right Column: Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Tests LLM Reels vs Demo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                      <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-purple-700 dark:text-purple-300">Test LLM Reel</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <li>• Execution: 30-60 secondes</li>
                          <li>• 10-15 appels LLM reels</li>
                          <li>• Documents generes par IA</li>
                          <li>• Cout: ~0.50-2€/test</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-950/30">
                      <FlaskConical className="h-5 w-5 text-gray-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">Test Demo</p>
                        <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
                          <li>• Execution: 0.0 secondes</li>
                          <li>• 0 appels LLM</li>
                          <li>• Templates pre-generes</li>
                          <li>• Cout: 0€</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium mb-2">Workflow LangGraph (10 phases):</p>
                    <div className="flex flex-wrap gap-1">
                      {WORKFLOW_PHASES.map((phase) => (
                        <Badge key={phase.id} variant="outline" className="text-xs">
                          {phase.icon} {phase.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <TestHistorySection />
            </div>
          </div>
        </TabsContent>

        {/* Direct Prompt Tester Tab */}
        <TabsContent value="prompt-tester" className="mt-6">
          <LLMPromptTester />
        </TabsContent>

        {/* Model Comparison Tab */}
        <TabsContent value="comparison" className="mt-6">
          <ModelComparison />
        </TabsContent>

        {/* Metrics Dashboard Tab */}
        <TabsContent value="metrics" className="mt-6">
          <LLMMetricsDashboard />
        </TabsContent>

        {/* Demo Launcher Tab */}
        <TabsContent value="launcher" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Launcher or Progress */}
            <div className="space-y-6">
              {activeTestId ? (
                <TestProgress
                  testId={activeTestId}
                  onComplete={() => {}}
                />
              ) : (
                <TestLauncher onTestStarted={setActiveTestId} />
              )}

              {activeTestId && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTestId(null)}
                  className="w-full"
                >
                  Nouveau test
                </Button>
              )}
            </div>

            {/* Right Column: Existing Results + History */}
            <div className="space-y-6">
              <ExistingResultsSection />
              <TestHistorySection />
            </div>
          </div>
        </TabsContent>

        {/* AI Test Evaluator Tab */}
        <TabsContent value="test-eval" className="mt-6">
          <TestEvaluator />
        </TabsContent>

        {/* LLM-as-Judge Tab */}
        {process.env.NEXT_PUBLIC_ENABLE_LLM_EVAL === "true" && (
          <TabsContent value="llm-eval" className="mt-6">
            <LLMEvalDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
