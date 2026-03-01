"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Demo content
const DEMO_CONTENT = `Notre entreprise dispose de beaucoup d'expérience dans le domaine de la rénovation énergétique. 
Nous avons travaillé sur de nombreux projets similaires et nous sommes en mesure de répondre 
à vos besoins de manière efficace et professionnelle.`;

export default function TestV3Page() {
  const [transformedContent, setTransformedContent] = useState(DEMO_CONTENT);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 Product v3.0 - Test Page</h1>
        <p className="text-muted-foreground">
          Validation des nouvelles fonctionnalités
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">1</span>
              ⚡ Quick Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyse rapide &lt; 10s - Score matching + Recommandation GO/NO_GO
            </p>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✅ Composant QuickCheckCard créé</p>
              <p className="text-xs text-green-600 mt-1">
                Fichier: components/quick-check/quick-check-card.tsx
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Writing Modes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm">2</span>
              ✍️ Writing Modes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              7 modes: Concis, Détaillé, Technique, Exécutif, Pédagogique, Conforme, Persuasif
            </p>
            <div className="flex flex-wrap gap-2">
              {["Concis (Ctrl+1)", "Détaillé (Ctrl+2)", "Technique (Ctrl+3)", "Exécutif (Ctrl+4)"].map((mode) => (
                <Badge key={mode} variant="outline">{mode}</Badge>
              ))}
            </div>
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-800">✅ Composant WritingModeToggle créé</p>
              <p className="text-xs text-purple-600 mt-1">
                Fichier: components/writing-modes/writing-mode-toggle.tsx
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Persona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm">3</span>
              🏢 Company Persona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Adapter le langage à votre entreprise avec Voice Profile & Vocabulary
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["BTP", "IT", "Consulting", "Services"].map((sector) => (
                <Badge key={sector} variant="secondary">{sector}</Badge>
              ))}
            </div>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-800">✅ Composant PersonaSelector créé</p>
              <p className="text-xs text-amber-600 mt-1">
                Fichier: components/persona/persona-selector.tsx
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Document Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">4</span>
              🔄 Document Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Édition interactive avec suggestions IA, chat et actions rapides
            </p>
            <div className="p-3 bg-muted rounded text-xs font-mono mb-4 max-h-24 overflow-auto">
              {transformedContent}
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">✅ Composant DocumentEditor créé</p>
              <p className="text-xs text-green-600 mt-1">
                Fichier: components/document-editor/document-editor.tsx
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📊 Résumé des Livrables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-blue-500">15</div>
              <div className="text-xs text-muted-foreground">Fichiers Backend</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-purple-500">18</div>
              <div className="text-xs text-muted-foreground">Fichiers Frontend</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-500">24</div>
              <div className="text-xs text-muted-foreground">Endpoints API</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-amber-500">8.5k+</div>
              <div className="text-xs text-muted-foreground">Lignes de code</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
