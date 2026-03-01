"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, DollarSign, Wrench } from "lucide-react";

interface CheckpointContextProps {
  checkpoint: string;
  data: Record<string, unknown>;
}

export function CheckpointContext({ checkpoint, data }: CheckpointContextProps) {
  const normalizedCheckpoint = checkpoint.toLowerCase();

  if (normalizedCheckpoint === "go_nogo") return <GoNoGoContext data={data} />;
  if (normalizedCheckpoint === "strategy_review") return <StrategyContext data={data} />;
  if (normalizedCheckpoint === "price_review") return <PriceContext data={data} />;
  if (normalizedCheckpoint === "tech_review") return <TechContext data={data} />;

  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">Contexte non disponible pour ce checkpoint.</p>
      </CardContent>
    </Card>
  );
}

function GoNoGoContext({ data }: { data: Record<string, unknown> }) {
  const riskFactors = (data.risk_factors as Array<{ factor: string; severity: string }>) || [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4" /> Analyse Go/No-Go
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Taux de correspondance</p>
            <p className="font-semibold">{((data.matching_rate as number) || 0).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Exigences</p>
            <p className="font-semibold">{(data.requirements_count as number) || 0}</p>
          </div>
        </div>
        {riskFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Facteurs de risque</p>
            <div className="flex flex-wrap gap-1">
              {riskFactors.slice(0, 5).map((f, i) => (
                <Badge key={i} variant={f.severity === "high" ? "destructive" : "secondary"} className="text-[10px]">
                  {typeof f === "string" ? f : f.factor || String(f)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StrategyContext({ data }: { data: Record<string, unknown> }) {
  const winThemes = (data.win_themes as string[]) || [];
  const arguments_ = (data.strategic_arguments as string[]) || [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" /> Strategie Commerciale
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {winThemes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Themes gagnants</p>
            <div className="flex flex-wrap gap-1">
              {winThemes.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs">{typeof t === "string" ? t : String(t)}</Badge>
              ))}
            </div>
          </div>
        )}
        {arguments_.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Arguments cles</p>
            <ul className="text-sm space-y-1">
              {arguments_.slice(0, 4).map((a, i) => (
                <li key={i} className="text-muted-foreground">• {typeof a === "string" ? a : String(a)}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceContext({ data }: { data: Record<string, unknown> }) {
  const items = (data.bpu_items as Array<{ designation: string; prix_unitaire: number }>) || [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Tarification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Total HT</p>
            <p className="font-semibold">{((data.total_ht as number) || 0).toLocaleString("fr-FR")} EUR</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Total TTC</p>
            <p className="font-semibold">{((data.total_ttc as number) || 0).toLocaleString("fr-FR")} EUR</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Marge</p>
            <p className="font-semibold">{((data.margin_rate as number) || 0).toFixed(1)}%</p>
          </div>
        </div>
        {items.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">BPU ({(data.items_count as number) || items.length} postes)</p>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {items.slice(0, 10).map((item, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="truncate flex-1">{item.designation || `Poste ${i + 1}`}</span>
                  <span className="font-mono ml-2">{(item.prix_unitaire || 0).toLocaleString("fr-FR")} EUR</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechContext({ data }: { data: Record<string, unknown> }) {
  const docs = (data.generated_documents as string[]) || [];
  const errors = (data.validation_errors as string[]) || [];
  const missing = (data.missing_products as string[]) || [];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Wrench className="h-4 w-4" /> Revue Technique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Conformite</p>
            <p className="font-semibold">{((data.compliance_score as number) || 0).toFixed(0)}%</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Documents</p>
            <p className="font-semibold">{docs.length}</p>
          </div>
        </div>
        {errors.length > 0 && (
          <div>
            <p className="text-xs font-medium text-red-500 mb-1">Erreurs de validation ({errors.length})</p>
            <ul className="text-xs space-y-0.5">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i} className="text-red-400">• {typeof e === "string" ? e : String(e)}</li>
              ))}
            </ul>
          </div>
        )}
        {missing.length > 0 && (
          <div>
            <p className="text-xs font-medium text-amber-500 mb-1">Produits manquants ({missing.length})</p>
            <div className="flex flex-wrap gap-1">
              {missing.slice(0, 5).map((m, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{typeof m === "string" ? m : String(m)}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
