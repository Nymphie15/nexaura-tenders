"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wand2,
  MessageSquare,
  History,
  Loader2,
  Sparkles,
  Check,
  X,
  ChevronRight,
  Save,
  ArrowLeft,
  Target,
  Zap,
  Building2,
  Monitor,
  Shield,
  Eraser,
  BarChart3,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { WritingModeToggle } from "@/components/writing-modes/writing-mode-toggle";
import { PersonaSelector } from "@/components/persona/persona-selector";
import { useGenerateSuggestions, useInlineEdit, useChatWithDocument } from "@/hooks/use-document-edition";
import { cn } from "@/lib/utils";
import { detectFillers, buildCleanPrompt, getFillerCount } from "@/lib/filler-detector";
import { analyzeSections } from "@/lib/section-targets";
import type { CompanyPersona } from "@/types/persona";
import type { WritingModeKey } from "@/types/writing-modes";
import type { DocumentSuggestion, EditCommand } from "@/types/document-edition";

interface DocumentEditorProps {
  documentId: string;
  initialContent: string;
  documentType?: string;
  className?: string;
  onSave?: (content: string) => void;
  isSaving?: boolean;
  onBack?: () => void;
  onContentChange?: (content: string) => void;
}

// B1: Extended quick actions with sector-specific buttons
const quickActions: { command: EditCommand; label: string; icon: React.ReactNode; prompt?: string }[] = [
  { command: "make_concise", label: "Plus concis", icon: <Target className="h-3 w-3" /> },
  { command: "expand", label: "Développer", icon: <span className="text-xs">+50%</span> },
  { command: "add_example", label: "Ajouter exemple", icon: <Sparkles className="h-3 w-3" /> },
  { command: "fix_grammar", label: "Corriger", icon: <Check className="h-3 w-3" /> },
];

// B1: Sector and commercial actions
const commercialActions: { label: string; icon: React.ReactNode; prompt: string }[] = [
  {
    label: "Plus spécifique",
    icon: <Zap className="h-3 w-3" />,
    prompt: "Remplace chaque affirmation générique par un chiffre, une référence ou un engagement mesurable. Chaque phrase doit contenir un élément concret.",
  },
  {
    label: "Adapter BTP",
    icon: <Building2 className="h-3 w-3" />,
    prompt: "Adapte au secteur BTP : utilise les références DTU, NF, RE2020, mentionne PPSPS, PAQ, DOE. Utilise le vocabulaire chantier.",
  },
  {
    label: "Adapter IT",
    icon: <Monitor className="h-3 w-3" />,
    prompt: "Adapte au secteur IT : utilise SLA, PRA/PCA, RGPD, ISO 27001, MCO. Vocabulaire technique informatique.",
  },
  {
    label: "Plus persuasif",
    icon: <Zap className="h-3 w-3" />,
    prompt: "Renforce l'argumentaire commercial : différenciation, valeur ajoutée, ROI client, engagements mesurables.",
  },
  {
    label: "Vérifier conformité",
    icon: <Shield className="h-3 w-3" />,
    prompt: "Vérifie que chaque exigence est explicitement adressée. Pour chaque point non couvert, propose un paragraphe de réponse.",
  },
];

// B2: Tone slider labels
const TONE_LABELS = ["Formel", "Professionnel", "Persuasif", "Commercial"];
const TONE_MODES: WritingModeKey[] = ["compliant", "technical", "persuasive", "executive"];

export function DocumentEditor({
  documentId,
  initialContent,
  documentType = "memoire",
  className,
  onSave,
  isSaving,
  onBack,
  onContentChange,
}: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedText, setSelectedText] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<CompanyPersona | null>(null);
  const [suggestions, setSuggestions] = useState<DocumentSuggestion[]>([]);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toneValue, setToneValue] = useState([1]); // B2: Default "Professionnel"

  const generateSuggestions = useGenerateSuggestions(documentId);
  const inlineEdit = useInlineEdit(documentId);
  const chat = useChatWithDocument(documentId);

  // B3: Filler detection
  const fillerCount = useMemo(() => getFillerCount(content), [content]);
  const fillers = useMemo(() => detectFillers(content), [content]);

  // B4: Section word counts
  const sections = useMemo(() => analyzeSections(content), [content]);

  // Word count
  const wordCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  // Sync content changes
  useEffect(() => {
    if (content !== initialContent) {
      setHasChanges(true);
      onContentChange?.(content);
    }
  }, [content, initialContent, onContentChange]);

  // Ctrl+S handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (onSave && hasChanges) onSave(content);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [content, hasChanges, onSave]);

  const handleModeApply = useCallback((newContent: string, _mode: WritingModeKey) => {
    setContent(newContent);
  }, []);

  const handleGenerateSuggestions = async () => {
    const result = await generateSuggestions.mutateAsync({
      content,
      document_type: documentType,
      persona_id: selectedPersona?.id,
      max_suggestions: 5,
    });
    setSuggestions(result);
  };

  const handleQuickAction = async (command: EditCommand) => {
    const selection = selectedText || content;
    const result = await inlineEdit.mutateAsync({
      content: selection,
      command,
      persona_id: selectedPersona?.id,
    });
    if (selectedText) {
      setContent(content.replace(selectedText, result.modified));
    } else {
      setContent(result.modified);
    }
  };

  // B1: Commercial action handler (uses custom prompt)
  const handleCommercialAction = async (prompt: string) => {
    const selection = selectedText || content;
    const result = await inlineEdit.mutateAsync({
      content: selection,
      command: "custom" as EditCommand,
      instruction: prompt,
      persona_id: selectedPersona?.id,
    });
    if (selectedText) {
      setContent(content.replace(selectedText, result.modified));
    } else {
      setContent(result.modified);
    }
  };

  // B3: Clean fillers
  const handleCleanFillers = async () => {
    if (fillers.length === 0) return;
    const prompt = buildCleanPrompt(fillers);
    const result = await inlineEdit.mutateAsync({
      content,
      command: "custom" as EditCommand,
      instruction: prompt,
      persona_id: selectedPersona?.id,
    });
    setContent(result.modified);
  };

  const handleApplySuggestion = (suggestion: DocumentSuggestion) => {
    setContent(content.replace(suggestion.original_text, suggestion.suggested_text));
    setSuggestions(suggestions.filter((s) => s.id !== suggestion.id));
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory([...chatHistory, { role: "user", content: userMsg }]);
    setChatMessage("");
    const result = await chat.mutateAsync({
      content,
      message: userMsg,
      conversation_history: chatHistory,
    });
    setChatHistory((prev) => [...prev, { role: "assistant", content: result.response }]);
  };

  return (
    <div className={cn("flex flex-col h-full bg-background rounded-lg border", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          )}
          <PersonaSelector selectedId={selectedPersona?.id} onSelect={setSelectedPersona} />
          <WritingModeToggle content={content} personaId={selectedPersona?.id} onApply={handleModeApply} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowChat(!showChat); setShowStats(false); }}
            className={cn(showChat && "bg-accent")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat IA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowStats(!showStats); setShowChat(false); }}
            className={cn(showStats && "bg-accent")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analyse
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={() => onSave(content)}
              disabled={isSaving || !hasChanges}
              className="gap-1"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      {/* B2: Tone Slider */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/10">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Ton :</span>
        <div className="flex-1 max-w-xs">
          <Slider
            value={toneValue}
            onValueChange={setToneValue}
            min={0}
            max={3}
            step={1}
            className="w-full"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          {TONE_LABELS[toneValue[0]]}
        </Badge>
        {fillerCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 text-amber-600 border-amber-300"
            onClick={handleCleanFillers}
            disabled={inlineEdit.isPending}
          >
            <Eraser className="h-3 w-3" />
            {fillerCount} phrase{fillerCount > 1 ? "s" : ""} creuse{fillerCount > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {/* Quick Actions - B1 extended */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/10 overflow-x-auto">
        <span className="text-xs text-muted-foreground mr-1 whitespace-nowrap">Actions :</span>
        {quickActions.map((action) => (
          <TooltipProvider key={action.command} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs shrink-0"
                  onClick={() => handleQuickAction(action.command)}
                  disabled={inlineEdit.isPending}
                >
                  {inlineEdit.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {commercialActions.map((action) => (
          <TooltipProvider key={action.label} delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.label === "Vérifier conformité" ? "default" : "outline"}
                  size="sm"
                  className={cn("h-7 text-xs shrink-0", action.label === "Vérifier conformité" && "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600")}
                  onClick={() => handleCommercialAction(action.prompt)}
                  disabled={inlineEdit.isPending}
                >
                  {inlineEdit.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <span className="mr-1">{action.icon}</span>}
                  {action.label}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{action.prompt.slice(0, 80)}...</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs ml-auto shrink-0"
          onClick={handleGenerateSuggestions}
          disabled={generateSuggestions.isPending}
        >
          {generateSuggestions.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Wand2 className="h-3 w-3 mr-1" />}
          Suggestions IA
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onSelect={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setSelectedText(target.value.substring(target.selectionStart, target.selectionEnd));
            }}
            className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0 font-mono text-sm leading-relaxed p-4"
            placeholder="Votre document ici..."
          />
          <div className="px-4 py-2 border-t text-xs text-muted-foreground flex justify-between">
            <span>{content.length} caractères &middot; {wordCount} mots</span>
            <span>
              {sections.length} sections
              {fillerCount > 0 && (
                <span className="text-amber-600 ml-2">{fillerCount} fillers</span>
              )}
            </span>
          </div>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence mode="wait">
          {showChat ? (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-muted/20 flex flex-col"
            >
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-medium text-sm">Chat avec l&apos;IA</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowChat(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {chatHistory.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Posez une question sur votre document...
                    </p>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-2.5 rounded-lg text-sm",
                        msg.role === "user" ? "bg-primary text-primary-foreground ml-4" : "bg-muted mr-4"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Votre message..."
                    className="min-h-[60px] text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button size="icon" className="shrink-0" onClick={handleSendMessage} disabled={chat.isPending || !chatMessage.trim()}>
                    {chat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : showStats ? (
            /* B4+B5: Analysis sidebar */
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l bg-muted/20 flex flex-col"
            >
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-medium text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analyse du document
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowStats(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-4">
                  {/* Global stats */}
                  <div className="p-3 rounded-lg bg-background border">
                    <p className="text-sm font-medium mb-2">Statistiques globales</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Mots</span>
                        <p className="font-medium">{wordCount}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Caractères</span>
                        <p className="font-medium">{content.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Sections</span>
                        <p className="font-medium">{sections.length}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phrases creuses</span>
                        <p className={cn("font-medium", fillerCount > 0 ? "text-amber-600" : "text-emerald-600")}>
                          {fillerCount}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* B4: Section word counts */}
                  {sections.length > 0 && (
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-sm font-medium mb-3">Mots par section</p>
                      <div className="space-y-3">
                        {sections.map((section, idx) => (
                          <div key={idx}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="truncate max-w-[180px]">{section.title}</span>
                              <span className={cn(
                                "font-medium",
                                section.status === "ok" ? "text-emerald-600" :
                                section.status === "short" ? "text-amber-600" : "text-rose-600"
                              )}>
                                {section.wordCount}/{section.target.max}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all",
                                  section.status === "ok" ? "bg-emerald-500" :
                                  section.status === "short" ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(100, section.percentage)}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {section.status === "short" ? "Trop court" :
                               section.status === "long" ? "Trop long" : "OK"}
                              {" "}(cible: {section.target.min}-{section.target.max})
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* B3: Filler details */}
                  {fillers.length > 0 && (
                    <div className="p-3 rounded-lg bg-background border border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-amber-700">Phrases creuses détectées</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-[10px] border-amber-300 text-amber-700"
                          onClick={handleCleanFillers}
                          disabled={inlineEdit.isPending}
                        >
                          Nettoyer tout
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {fillers.slice(0, 10).map((filler, idx) => (
                          <div key={idx} className="text-xs">
                            <p className="text-amber-700 font-medium">&ldquo;{filler.text}&rdquo;</p>
                            <p className="text-muted-foreground">{filler.suggestion}</p>
                          </div>
                        ))}
                        {fillers.length > 10 && (
                          <p className="text-xs text-muted-foreground">...et {fillers.length - 10} autres</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : (
            suggestions.length > 0 && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 350, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="border-l bg-muted/20 flex flex-col"
              >
                <div className="p-3 border-b flex items-center justify-between">
                  <span className="font-medium text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    Suggestions ({suggestions.length})
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSuggestions([])}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {suggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-lg bg-background border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-[10px]">{suggestion.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(suggestion.confidence * 100)}% confiance
                          </span>
                        </div>
                        <p className="text-sm line-through text-muted-foreground mb-1">
                          {suggestion.original_text.slice(0, 100)}
                          {suggestion.original_text.length > 100 && "..."}
                        </p>
                        <p className="text-sm font-medium mb-2">
                          {suggestion.suggested_text.slice(0, 100)}
                          {suggestion.suggested_text.length > 100 && "..."}
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">{suggestion.reason}</p>
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs flex-1" onClick={() => handleApplySuggestion(suggestion)}>
                            <Check className="h-3 w-3 mr-1" />
                            Appliquer
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => setSuggestions(suggestions.filter((s) => s.id !== suggestion.id))}>
                            <X className="h-3 w-3 mr-1" />
                            Ignorer
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
