"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Square,
  Upload,
  FolderOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Brain,
  Zap,
  AlertTriangle,
  RefreshCw,
  Settings2,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface WorkflowPhase {
  id: string;
  name: string;
  icon: string;
  status: "pending" | "running" | "completed" | "error";
  duration?: number;
  llm_calls?: number;
  error?: string;
}

interface LocalDCE {
  name: string;
  path: string;
  files: string[];
  file_count: number;
  size_mb: number;
  has_rc: boolean;
  has_cctp: boolean;
  has_bpu: boolean;
  modified_at?: string;
}

interface WorkflowResult {
  success: boolean;
  case_id: string;
  phases_completed: number;
  total_duration: number;
  llm_calls_total: number;
  documents_generated: string[];
  error?: string;
}

// Workflow phases definition
const WORKFLOW_PHASES: { id: string; name: string; icon: string }[] = [
  { id: "PHASE_0", name: "Lecture RC", icon: "📋" },
  { id: "INGESTION", name: "Ingestion", icon: "📥" },
  { id: "EXTRACTION", name: "Extraction", icon: "🔍" },
  { id: "MATCHING", name: "Matching", icon: "🎯" },
  { id: "RISK_ANALYSIS", name: "Analyse Risques", icon: "⚠️" },
  { id: "STRATEGY", name: "Stratégie", icon: "🧠" },
  { id: "CALCULATION", name: "Calcul", icon: "🧮" },
  { id: "GENERATION", name: "Génération", icon: "✍️" },
  { id: "VALIDATION", name: "Validation", icon: "✅" },
  { id: "PACKAGING", name: "Packaging", icon: "📦" },
];

// API URL (with /api/v2 prefix for HTTP calls)
const _rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = _rawApiBase.endsWith("/api/v2") ? _rawApiBase : `${_rawApiBase}/api/v2`;
// WS base: strip /api/v2 suffix (WebSocket endpoints are at root)
const WS_BASE = _rawApiBase.replace(/\/api\/v2\/?$/, "");

export default function WorkflowTestPage() {
  const [activeTab, setActiveTab] = useState("local");
  const [localDCEs, setLocalDCEs] = useState<LocalDCE[]>([]);
  const [selectedDCE, setSelectedDCE] = useState<string>("");
  const [companySiret, setCompanySiret] = useState("");
  const [sector, setSector] = useState("fournitures");
  const [isRunning, setIsRunning] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [phases, setPhases] = useState<WorkflowPhase[]>(
    WORKFLOW_PHASES.map((p) => ({ ...p, status: "pending" }))
  );
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // Sectors list
  const SECTORS = [
    { value: "btp", label: "BTP & Construction" },
    { value: "fournitures", label: "Fournitures Bureau" },
    { value: "it", label: "Informatique & IT" },
    { value: "medical", label: "Médical & Santé" },
    { value: "nettoyage", label: "Nettoyage & Propreté" },
    { value: "formation", label: "Formation" },
    { value: "securite", label: "Sécurité & Gardiennage" },
    { value: "transport", label: "Transport & Logistique" },
    { value: "restauration", label: "Restauration Collective" },
    { value: "espaces_verts", label: "Espaces Verts" },
    { value: "energie", label: "Énergie" },
    { value: "conseil", label: "Conseil & Ingénierie" },
  ];

  // Fetch local DCEs on mount
  useEffect(() => {
    fetchLocalDCEs();
  }, []);

  const fetchLocalDCEs = async () => {
    try {
      const response = await fetch(`${API_BASE}/tests/local-dces`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      if (response.ok) {
        const data: LocalDCE[] = await response.json();
        setLocalDCEs(data);
        if (data.length > 0) {
          setSelectedDCE(data[0].path);
        }
      }
    } catch (error) {
      console.error("Failed to fetch local DCEs:", error);
      // Mock data for development
      setLocalDCEs([
        {
          name: "DCE_2025_0286",
          path: "data/DCE_2025_0286",
          files: ["RC.pdf", "CCTP.pdf"],
          file_count: 5,
          size_mb: 2.1,
          has_rc: true,
          has_cctp: true,
          has_bpu: false,
        },
      ]);
      setSelectedDCE("data/DCE_2025_0286");
    }
  };

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString("fr-FR");
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const updatePhase = useCallback((phaseId: string, update: Partial<WorkflowPhase>) => {
    setPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, ...update } : p))
    );
  }, []);

  const connectWebSocket = useCallback((testId: string) => {
    const wsUrl = `${WS_BASE.replace("http", "ws")}/ws/workflow/${testId}`;
    addLog(`Connexion WebSocket: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      addLog("WebSocket connecté");
      setWsConnection(ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "phase_start") {
          updatePhase(data.phase, { status: "running" });
          addLog(`Phase démarrée: ${data.phase}`);
          setProgress(Math.round((data.phase_index / 10) * 100));
        } else if (data.type === "phase_complete") {
          updatePhase(data.phase, {
            status: "completed",
            duration: data.duration,
            llm_calls: data.llm_calls,
          });
          addLog(`Phase terminée: ${data.phase} (${data.duration?.toFixed(1)}s)`);
          setProgress(Math.round(((data.phase_index + 1) / 10) * 100));
        } else if (data.type === "phase_error") {
          updatePhase(data.phase, { status: "error", error: data.error });
          addLog(`Erreur phase ${data.phase}: ${data.error}`);
        } else if (data.type === "workflow_complete") {
          setResult(data.result);
          setIsRunning(false);
          setProgress(100);
          addLog("Workflow terminé avec succès!");
        } else if (data.type === "workflow_error") {
          setIsRunning(false);
          addLog(`Erreur workflow: ${data.error}`);
          toast.error("Erreur workflow", { description: data.error });
        } else if (data.type === "log") {
          addLog(data.message);
        }
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onerror = (error) => {
      addLog(`Erreur WebSocket: ${error}`);
    };

    ws.onclose = () => {
      addLog("WebSocket déconnecté");
      setWsConnection(null);
    };

    return ws;
  }, [addLog, updatePhase]);

  const startWorkflow = async () => {
    if (!selectedDCE) {
      toast.error("Sélectionnez un DCE");
      return;
    }

    setIsRunning(true);
    setResult(null);
    setProgress(0);
    setLogs([]);
    setPhases(WORKFLOW_PHASES.map((p) => ({ ...p, status: "pending" })));

    addLog(`Démarrage workflow pour: ${selectedDCE}`);
    addLog(`Secteur: ${sector}`);
    if (companySiret) addLog(`SIRET: ${companySiret}`);

    try {
      const response = await fetch(`${API_BASE}/tests/run-workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          dce_path: selectedDCE,
          sector,
          company_siret: companySiret || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setWorkflowId(data.workflow_id);
      addLog(`Workflow ID: ${data.workflow_id}`);

      // Connect WebSocket for real-time updates
      connectWebSocket(data.workflow_id);
    } catch (error) {
      setIsRunning(false);
      const message = error instanceof Error ? error.message : "Erreur inconnue";
      addLog(`Erreur: ${message}`);
      toast.error("Erreur de démarrage", { description: message });
    }
  };

  const cancelWorkflow = async () => {
    if (!workflowId) return;

    try {
      await fetch(`${API_BASE}/tests/workflow/${workflowId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });

      wsConnection?.close();
      setIsRunning(false);
      addLog("Workflow annulé");
      toast.info("Workflow annulé");
    } catch (error) {
      console.error("Cancel error:", error);
    }
  };

  const resetWorkflow = () => {
    setResult(null);
    setProgress(0);
    setLogs([]);
    setPhases(WORKFLOW_PHASES.map((p) => ({ ...p, status: "pending" })));
    setWorkflowId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="h-8 w-8" />
          Test Workflow DCE
        </h1>
        <p className="text-muted-foreground mt-1">
          Testez le workflow complet LangGraph avec un DCE réel ou uploadé
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configuration du Test
              </CardTitle>
              <CardDescription>
                Sélectionnez un DCE et configurez les paramètres
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="local" className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    DCE Local
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="local" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>DCE disponible</Label>
                    <Select value={selectedDCE} onValueChange={setSelectedDCE}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un DCE" />
                      </SelectTrigger>
                      <SelectContent>
                        {localDCEs.map((dce) => (
                          <SelectItem key={dce.path} value={dce.path}>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>{dce.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {dce.file_count} fichiers
                              </Badge>
                              {dce.has_rc && (
                                <Badge variant="outline" className="text-green-600">RC</Badge>
                              )}
                              {dce.has_cctp && (
                                <Badge variant="outline" className="text-blue-600">CCTP</Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedDCE && (() => {
                    const dce = localDCEs.find(d => d.path === selectedDCE);
                    return dce ? (
                      <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
                        <p className="font-medium">DCE sélectionné: {dce.name}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="secondary">{dce.file_count} fichiers</Badge>
                          <Badge variant="secondary">{dce.size_mb} MB</Badge>
                          {dce.has_rc && <Badge className="bg-green-100 text-green-700">RC</Badge>}
                          {dce.has_cctp && <Badge className="bg-blue-100 text-blue-700">CCTP</Badge>}
                          {dce.has_bpu && <Badge className="bg-amber-100 text-amber-700">BPU</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{selectedDCE}</p>
                      </div>
                    ) : null;
                  })()}
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="rounded-xl border-2 border-dashed p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Fonctionnalité d'upload disponible sur la page{" "}
                      <a href="/tenders" className="text-primary hover:underline">
                        Appels d'offres
                      </a>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Sector Selection */}
              <div className="space-y-2">
                <Label>Secteur d'activité</Label>
                <Select value={sector} onValueChange={setSector}>
                  <SelectTrigger>
                    <SelectValue />
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

              {/* Company SIRET */}
              <div className="space-y-2">
                <Label htmlFor="siret">SIRET Entreprise (optionnel)</Label>
                <Input
                  id="siret"
                  placeholder="Ex: 34395813800012"
                  value={companySiret}
                  onChange={(e) => setCompanySiret(e.target.value)}
                  disabled={isRunning}
                />
              </div>

              <Separator />

              {/* Info */}
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Zap className="h-4 w-4 mt-0.5 text-purple-600" />
                  <div>
                    <p className="font-medium">Ce test exécute:</p>
                    <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <li>• 10 phases du workflow LangGraph</li>
                      <li>• 10-15 appels LLM (ministral-3, qwen3-next, deepseek-v3)</li>
                      <li>• Génération de documents réels</li>
                      <li>• Durée: 30-90 secondes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {isRunning ? (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={cancelWorkflow}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={startWorkflow}
                    disabled={!selectedDCE}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Lancer le Workflow
                  </Button>
                )}

                {result && (
                  <Button variant="outline" onClick={resetWorkflow}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nouveau Test
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Progress & Results */}
        <div className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isRunning ? (
                  <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                ) : result?.success ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : result ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground" />
                )}
                Progression du Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Phases Grid */}
              <div className="grid grid-cols-5 gap-1">
                {phases.map((phase) => (
                  <div
                    key={phase.id}
                    className={cn(
                      "p-2 rounded-lg text-center transition-all",
                      phase.status === "completed" &&
                        "bg-emerald-100 dark:bg-emerald-900/50",
                      phase.status === "running" &&
                        "bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500",
                      phase.status === "error" &&
                        "bg-red-100 dark:bg-red-900/50",
                      phase.status === "pending" && "bg-muted/50 opacity-50"
                    )}
                    title={`${phase.name}${
                      phase.duration ? ` - ${phase.duration.toFixed(1)}s` : ""
                    }`}
                  >
                    <span className="text-lg">{phase.icon}</span>
                    <p className="text-[9px] truncate">{phase.name}</p>
                    {phase.duration && (
                      <p className="text-[8px] text-muted-foreground">
                        {phase.duration.toFixed(1)}s
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Stats */}
              {(isRunning || result) && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">
                      {result?.total_duration?.toFixed(1) || "..."}s
                    </p>
                    <p className="text-xs text-muted-foreground">Durée</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-indigo-600">
                      {result?.llm_calls_total || "..."}
                    </p>
                    <p className="text-xs text-muted-foreground">Appels LLM</p>
                  </div>
                  <div className="text-center p-2 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold text-emerald-600">
                      {result?.documents_generated?.length || "..."}
                    </p>
                    <p className="text-xs text-muted-foreground">Documents</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logs Card */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Logs d'exécution
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[200px] p-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Les logs apparaîtront ici lors de l'exécution
                  </p>
                ) : (
                  <div className="space-y-1 font-mono text-xs">
                    {logs.map((log, i) => (
                      <p key={i} className="text-muted-foreground">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Results Card */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  Résultats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Case ID</span>
                  <Badge variant="outline">{result.case_id}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Phases complétées</span>
                  <span className="font-medium">{result.phases_completed}/10</span>
                </div>

                {result.documents_generated?.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Documents générés:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.documents_generated.map((doc) => (
                        <Badge key={doc} variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          {doc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {result.error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600">
                    <p className="font-medium">Erreur:</p>
                    <p className="text-xs mt-1">{result.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
