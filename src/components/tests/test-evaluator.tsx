"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Brain,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEvaluateTest, useGenerateTest } from "@/hooks/use-test-eval";
import type { TestEvalResponse } from "@/lib/llm-utils";

const PROGRESS_MESSAGES = [
  "Analyse en cours...",
  "Evaluation des criteres...",
  "Verification des edge cases...",
  "Presque termine...",
];

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600"
      : score >= 60
        ? "text-blue-600"
        : score >= 40
          ? "text-amber-600"
          : "text-red-600";

  const bgColor =
    score >= 80
      ? "border-emerald-200"
      : score >= 60
        ? "border-blue-200"
        : score >= 40
          ? "border-amber-200"
          : "border-red-200";

  return (
    <div
      className={cn(
        "relative flex h-20 w-20 items-center justify-center rounded-full border-4 mx-auto",
        bgColor
      )}
    >
      <span className={cn("text-xl font-bold tabular-nums", color)}>
        {score}
      </span>
    </div>
  );
}

function TestEvalPanel({ result }: { result: TestEvalResponse }) {
  return (
    <div className="space-y-4">
      <ScoreCircle score={result.score} />
      <p className="text-sm text-center text-zinc-600">{result.summary}</p>

      {/* Criteria */}
      <div className="space-y-2">
        {result.criteria.map((c) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span className="text-sm font-medium">{c.name}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums font-medium">
                {c.score}/100
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div>
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Points forts
          </h4>
          <ul className="space-y-1 text-sm text-zinc-600">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {result.weaknesses.length > 0 && (
        <div>
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Lacunes
          </h4>
          <ul className="space-y-1 text-sm text-zinc-600">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">-</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {result.suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            Suggestions
          </h4>
          <ul className="space-y-1 text-sm text-zinc-600">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">*</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TestGenPanel({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-7 gap-1.5 text-xs z-10"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
        {copied ? "Copie !" : "Copier"}
      </Button>
      <ScrollArea className="h-[400px]">
        <pre className="rounded-md bg-zinc-900 p-4 text-sm text-zinc-100 overflow-x-auto">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  );
}

export function TestEvaluator() {
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState("eval");
  const [progressMsg, setProgressMsg] = useState(PROGRESS_MESSAGES[0]);
  const progressRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const evalMutation = useEvaluateTest();
  const genMutation = useGenerateTest();

  const isPending = evalMutation.isPending || genMutation.isPending;

  // Progressive messages during pending (#15)
  useEffect(() => {
    if (isPending) {
      let idx = 0;
      progressRef.current = setInterval(() => {
        idx = (idx + 1) % PROGRESS_MESSAGES.length;
        setProgressMsg(PROGRESS_MESSAGES[idx]);
      }, 5000);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
      setProgressMsg(PROGRESS_MESSAGES[0]);
    }
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isPending]);

  const handleEvaluate = () => {
    if (!code.trim()) return;
    evalMutation.mutate(code);
  };

  const handleGenerate = () => {
    if (!code.trim()) return;
    genMutation.mutate(code);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: Source code input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Code source
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Collez votre code source ou vos tests ici..."
            className="w-full h-[400px] rounded-md border bg-zinc-50 p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleEvaluate}
              disabled={isPending || !code.trim()}
              className="flex-1 gap-2"
            >
              {evalMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Brain className="h-4 w-4" />
              )}
              Evaluer
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isPending || !code.trim()}
              variant="outline"
              className="flex-1 gap-2"
            >
              {genMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Code2 className="h-4 w-4" />
              )}
              Generer tests
            </Button>
          </div>
          {isPending && (
            <p className="text-xs text-zinc-500 text-center animate-pulse">
              {progressMsg}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Right: Results */}
      <Card>
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="eval" className="gap-1.5">
                <Brain className="h-3 w-3" />
                Evaluer
              </TabsTrigger>
              <TabsTrigger value="gen" className="gap-1.5">
                <Code2 className="h-3 w-3" />
                Generer
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {activeTab === "eval" && (
            <>
              {evalMutation.data ? (
                <TestEvalPanel result={evalMutation.data} />
              ) : evalMutation.isError ? (
                <div className="text-sm text-red-600 text-center py-8">
                  Erreur lors de l&apos;evaluation. Verifiez le code et reessayez.
                </div>
              ) : (
                <div className="text-sm text-zinc-400 text-center py-8">
                  Collez du code et cliquez &quot;Evaluer&quot; pour obtenir une
                  analyse IA.
                </div>
              )}
            </>
          )}
          {activeTab === "gen" && (
            <>
              {genMutation.data ? (
                <TestGenPanel code={genMutation.data} />
              ) : genMutation.isError ? (
                <div className="text-sm text-red-600 text-center py-8">
                  Erreur lors de la generation. Verifiez le code et reessayez.
                </div>
              ) : (
                <div className="text-sm text-zinc-400 text-center py-8">
                  Collez du code source et cliquez &quot;Generer tests&quot;
                  pour creer des tests automatiquement.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
