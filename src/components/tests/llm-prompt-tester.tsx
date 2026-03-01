"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MessageSquare,
  Send,
  Loader2,
  Clock,
  DollarSign,
  Zap,
  Copy,
  Check,
  ChevronDown,
  Settings2,
  History,
  Trash2,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLLMModels, useLLMPromptTester } from "@/hooks/use-llm-testing";
import { toast } from "sonner";

// Tier badge colors
const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  3: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

const TIER_NAMES: Record<number, string> = {
  1: "Light",
  2: "Medium",
  3: "Heavy",
};

export function LLMPromptTester() {
  const { data: modelsData, isLoading: modelsLoading } = useLLMModels();
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    prompt,
    setPrompt,
    systemPrompt,
    setSystemPrompt,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    taskType,
    setTaskType,
    lastResult,
    history,
    runTest,
    clearHistory,
    isLoading,
  } = useLLMPromptTester();

  const handleCopyResponse = () => {
    if (lastResult?.response) {
      navigator.clipboard.writeText(lastResult.response);
      setCopied(true);
      toast.success("Reponse copiee");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentModels = modelsData?.providers[selectedProvider] || [];
  const currentModelInfo = currentModels.find((m) => m.model === selectedModel);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column: Input */}
      <div className="space-y-6">
        {/* Model Selection */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Provider */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={selectedProvider}
                onValueChange={(v) => {
                  setSelectedProvider(v as "ollama" | "anthropic" | "gemini");
                  // Reset model when provider changes
                  const newModels = modelsData?.providers[v] || [];
                  if (newModels.length > 0) {
                    setSelectedModel(newModels[0].model);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionnez un provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ollama">Ollama (Local/Cloud)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="gemini">Google (Gemini)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {currentModels.map((model) => (
                    <SelectItem key={model.model} value={model.model}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", TIER_COLORS[model.tier])}>
                          T{model.tier}
                        </Badge>
                        <span>{model.model}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentModelInfo && (
                <p className="text-xs text-muted-foreground">
                  {currentModelInfo.description} | ${currentModelInfo.cost_per_1m_input}/1M in,
                  ${currentModelInfo.cost_per_1m_output}/1M out
                </p>
              )}
            </div>

            {/* Advanced Settings */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="text-sm">Paramètres avancés</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      showAdvanced && "rotate-180"
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Task Type */}
                <div className="space-y-2">
                  <Label>Type de tache</Label>
                  <Select value={taskType} onValueChange={setTaskType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="summary">Resume</SelectItem>
                      <SelectItem value="win_themes">Win Themes</SelectItem>
                      <SelectItem value="risk_analysis">Analyse Risques</SelectItem>
                      <SelectItem value="translation">Traduction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">{temperature}</span>
                  </div>
                  <Slider
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">{maxTokens}</span>
                  </div>
                  <Slider
                    value={[maxTokens]}
                    onValueChange={([v]) => setMaxTokens(v)}
                    min={128}
                    max={8192}
                    step={128}
                  />
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label>System Prompt (optionnel)</Label>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Instructions système..."
                    className="h-20 text-sm"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Prompt Input */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              Prompt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Entrez votre prompt ici...

Exemple: Quels sont les 3 facteurs cles de succes pour repondre a un appel d'offres BTP?"
              className="min-h-[200px]"
            />
            <Button
              className="w-full"
              onClick={runTest}
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generation en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer ({selectedModel})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Output */}
      <div className="space-y-6">
        {/* Response */}
        <Card className={cn(lastResult && "ring-2 ring-primary/20")}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5" />
                Reponse
              </CardTitle>
              {lastResult && (
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs", TIER_COLORS[lastResult.tier_used])}>
                    Tier {lastResult.tier_used} ({TIER_NAMES[lastResult.tier_used]})
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCopyResponse}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
            {lastResult && (
              <CardDescription className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {(lastResult.execution_time_ms / 1000).toFixed(2)}s
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  ${lastResult.cost_estimate_usd.toFixed(4)}
                </span>
                <span>
                  {lastResult.tokens_input} in / {lastResult.tokens_output} out
                </span>
                {lastResult.cache_hit && (
                  <Badge variant="secondary" className="text-xs">
                    <Database className="h-3 w-3 mr-1" />
                    Cache
                  </Badge>
                )}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {lastResult ? (
              <ScrollArea className="h-[400px]">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg">
                    {lastResult.response}
                  </pre>
                </div>
              </ScrollArea>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Entrez un prompt et cliquez sur Envoyer</p>
                  <p className="text-xs mt-1">La réponse s&apos;affichera ici</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Historique ({history.length})
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-muted/50 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className={cn("text-xs", TIER_COLORS[item.tier_used])}>
                          {item.model_used}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{(item.execution_time_ms / 1000).toFixed(2)}s</span>
                          <span>${item.cost_estimate_usd.toFixed(4)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.response.slice(0, 150)}...
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
