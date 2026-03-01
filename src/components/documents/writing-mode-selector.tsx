"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Eye, Check } from "lucide-react";
import {
  useWritingModes,
  usePreviewMode,
  useApplyModeToDocument,
} from "@/hooks/use-writing-modes";
import type { WritingModeKey } from "@/types/writing-modes";

interface WritingModeSelectorProps {
  documentId: string;
  content: string;
  personaId?: string;
  onApplied?: (newContent: string) => void;
  className?: string;
}

export function WritingModeSelector({
  documentId,
  content,
  personaId,
  onApplied,
  className,
}: WritingModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<WritingModeKey | "">("");
  const [previewContent, setPreviewContent] = useState<string | null>(null);

  const { data: modes } = useWritingModes();
  const previewMutation = usePreviewMode();
  const applyMutation = useApplyModeToDocument();

  const activeModes = modes?.filter((m) => m.is_active) ?? [];

  const handlePreview = async () => {
    if (!selectedMode) return;
    try {
      const result = await previewMutation.mutateAsync({
        content,
        mode: selectedMode,
        persona_id: personaId,
      });
      setPreviewContent(result.preview);
    } catch {
      // Error handled by mutation
    }
  };

  const handleApply = async () => {
    if (!selectedMode) return;
    try {
      const result = await applyMutation.mutateAsync({
        documentId,
        mode: selectedMode,
        personaId,
      });
      setPreviewContent(null);
      onApplied?.(result.content);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Mode de redaction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select
          value={selectedMode}
          onValueChange={(v) => {
            setSelectedMode(v as WritingModeKey);
            setPreviewContent(null);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir un mode..." />
          </SelectTrigger>
          <SelectContent>
            {activeModes.map((mode) => (
              <SelectItem key={mode.key} value={mode.key}>
                <div className="flex items-center gap-2">
                  <span>{mode.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {mode.icon}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={!selectedMode || previewMutation.isPending}
            className="flex-1 gap-1.5"
          >
            {previewMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Eye className="h-3 w-3" />
            )}
            Apercu
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={!selectedMode || applyMutation.isPending}
            className="flex-1 gap-1.5"
          >
            {applyMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Appliquer
          </Button>
        </div>

        {/* Preview diff */}
        {previewContent && (
          <div className="rounded-md border bg-zinc-50 p-3 text-xs max-h-48 overflow-y-auto">
            <p className="text-[10px] uppercase text-zinc-400 mb-1">Apercu</p>
            <div className="whitespace-pre-wrap text-zinc-700">
              {previewContent}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
