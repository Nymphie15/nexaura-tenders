"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  GitCompare,
  Plus,
  X,
  Loader2,
  Clock,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLLMModels, useLLMModelComparison } from "@/hooks/use-llm-testing";
import { LLMCompareResult } from "@/lib/api/endpoints";

// Tier badge colors
const TIER_COLORS: Record<number, string> = {
  1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  2: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  3: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
};

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  anthropic: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  gemini: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
};

function ComparisonResultCard({ result }: { result: LLMCompareResult }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={cn(result.error && "border-red-200 dark:border-red-900")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", PROVIDER_COLORS[result.provider])}>
              {result.provider}
            </Badge>
            {result.tier && (
              <Badge className={cn("text-xs", TIER_COLORS[result.tier])}>
                T{result.tier}
              </Badge>
            )}
          </div>
          {result.error ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </div>
        <CardTitle className="text-sm font-medium">{result.model}</CardTitle>
        {!result.error && (
          <CardDescription className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {(result.execution_time_ms / 1000).toFixed(2)}s
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${result.cost_usd.toFixed(4)}
            </span>
            <span>
              {result.tokens_input}/{result.tokens_output} tokens
            </span>
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {result.error ? (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-sm text-red-600 dark:text-red-400">
            <p className="font-medium">Erreur:</p>
            <p className="text-xs mt-1">{result.error}</p>
          </div>
        ) : (
          <div>
            <ScrollArea className={cn("transition-all", expanded ? "h-[300px]" : "h-[120px]")}>
              <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-3 rounded-lg">
                {result.response}
              </pre>
            </ScrollArea>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Reduire" : "Voir plus"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ModelComparison() {
  const { data: modelsData, isLoading: modelsLoading } = useLLMModels();
  const [newProvider, setNewProvider] = useState<string>("ollama");
  const [newModel, setNewModel] = useState<string>("");

  const {
    prompt,
    setPrompt,
    selectedModels,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    lastComparison,
    runComparison,
    addModel,
    removeModel,
    clearComparison,
    isLoading,
  } = useLLMModelComparison();

  const availableModels = modelsData?.providers[newProvider] || [];

  const handleAddModel = () => {
    if (newModel) {
      addModel(newProvider, newModel);
      setNewModel("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Models Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Modeles a comparer
            </CardTitle>
            <CardDescription>
              Selectionnez 2 a 4 modeles pour comparer leurs reponses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Models */}
            <div className="space-y-2">
              {selectedModels.map((model, index) => (
                <div
                  key={`${model.provider}-${model.model}-${index}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-xs", PROVIDER_COLORS[model.provider])}>
                      {model.provider}
                    </Badge>
                    <span className="text-sm">{model.model}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeModel(index)}
                    disabled={selectedModels.length <= 2}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Model */}
            {selectedModels.length < 4 && (
              <div className="flex gap-2">
                <Select value={newProvider} onValueChange={setNewProvider}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ollama">Ollama</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newModel} onValueChange={setNewModel}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Choisir un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
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
                <Button onClick={handleAddModel} disabled={!newModel}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prompt */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Prompt de test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Entrez le prompt a envoyer a tous les modeles...

Exemple: Quels sont les 3 facteurs cles de succes pour repondre a un appel d'offres public en France?"
              className="min-h-[180px]"
            />
            <Button
              className="w-full"
              onClick={runComparison}
              disabled={isLoading || !prompt.trim() || selectedModels.length < 2}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Comparaison en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Lancer la comparaison ({selectedModels.length} modeles)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {lastComparison && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Temps total</p>
                    <p className="text-xl font-bold">
                      {(lastComparison.total_time_ms / 1000).toFixed(2)}s
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div>
                    <p className="text-xs text-muted-foreground">Cout total</p>
                    <p className="text-xl font-bold">
                      ${lastComparison.total_cost_usd.toFixed(4)}
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-10" />
                  <div>
                    <p className="text-xs text-muted-foreground">Modeles</p>
                    <p className="text-xl font-bold">
                      {lastComparison.results.filter((r) => !r.error).length}/
                      {lastComparison.results.length}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={clearComparison}>
                  Nouvelle comparaison
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Model Results Grid */}
          <div className={cn(
            "grid gap-4",
            lastComparison.results.length === 2 && "lg:grid-cols-2",
            lastComparison.results.length === 3 && "lg:grid-cols-3",
            lastComparison.results.length >= 4 && "lg:grid-cols-2 xl:grid-cols-4"
          )}>
            {lastComparison.results.map((result, index) => (
              <ComparisonResultCard key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* No comparison yet */}
      {!lastComparison && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Selectionnez des modeles et entrez un prompt pour commencer la comparaison
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
