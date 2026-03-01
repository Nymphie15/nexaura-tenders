"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, RotateCcw, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface InlineEditorProps {
  /** Original value to edit */
  originalValue: string;
  /** Callback when user submits the edited value */
  onSubmit: (correctedValue: string) => void;
  /** Callback when user cancels editing */
  onCancel: () => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Optional maximum character count */
  maxLength?: number;
  /** Optional minimum rows for textarea */
  minRows?: number;
  /** Additional CSS classes */
  className?: string;
  /** Auto-focus the textarea on mount */
  autoFocus?: boolean;
  /** Label for the editor */
  label?: string;
  /** Show character count */
  showCharCount?: boolean;
  /** Show diff preview */
  showDiff?: boolean;
}

/**
 * Inline editor component for correcting generated content.
 *
 * Features:
 * - Shows original value with ability to edit
 * - Character count (optional)
 * - Diff preview highlighting changes (optional)
 * - Reset to original functionality
 * - Animated transitions
 *
 * Usage:
 * ```tsx
 * <InlineEditor
 *   originalValue="Original generated text..."
 *   onSubmit={(corrected) => handleCorrection(corrected)}
 *   onCancel={() => setShowEditor(false)}
 *   showDiff
 * />
 * ```
 */
export function InlineEditor({
  originalValue,
  onSubmit,
  onCancel,
  placeholder = "Entrez votre correction...",
  isSubmitting = false,
  maxLength,
  minRows = 3,
  className,
  autoFocus = true,
  label,
  showCharCount = true,
  showDiff = false,
}: InlineEditorProps) {
  const [value, setValue] = React.useState(originalValue);
  const [hasChanges, setHasChanges] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Track changes
  React.useEffect(() => {
    setHasChanges(value !== originalValue && value.trim().length > 0);
  }, [value, originalValue]);

  // Auto-focus on mount
  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(value.length, value.length);
    }
  }, [autoFocus, value.length]);

  const handleSubmit = () => {
    if (hasChanges && !isSubmitting) {
      onSubmit(value);
    }
  };

  const handleReset = () => {
    setValue(originalValue);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Escape to cancel
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    }
  };

  const charCount = value.length;
  const isOverLimit = maxLength ? charCount > maxLength : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className
      )}
    >
      {/* Header */}
      {label && (
        <div className="mb-2 flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
      )}

      {/* Diff preview */}
      {showDiff && hasChanges && (
        <div className="mb-3 rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Modifications detectees:
          </p>
          <DiffPreview original={originalValue} modified={value} />
        </div>
      )}

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={minRows}
        disabled={isSubmitting}
        className={cn(
          "resize-y",
          isOverLimit && "border-destructive focus-visible:ring-destructive"
        )}
        aria-label={label || "Editeur de correction"}
        aria-describedby={showCharCount ? "char-count" : undefined}
      />

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {/* Character count */}
        <div className="flex items-center gap-2">
          {showCharCount && (
            <span
              id="char-count"
              className={cn(
                "text-xs",
                isOverLimit ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {charCount}
              {maxLength && ` / ${maxLength}`} caracteres
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Reset button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleReset}
                disabled={!hasChanges || isSubmitting}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reinitialiser</TooltipContent>
          </Tooltip>

          {/* Cancel button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-1 h-4 w-4" />
                Annuler
              </Button>
            </TooltipTrigger>
            <TooltipContent>Appuyez sur Echap</TooltipContent>
          </Tooltip>

          {/* Submit button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={!hasChanges || isSubmitting || isOverLimit}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-1 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Valider
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ctrl + Entree</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-2 text-xs text-muted-foreground">
        Votre correction sera utilisee pour ameliorer les futures suggestions.
      </p>
    </motion.div>
  );
}

/**
 * Simple diff preview component showing changes between original and modified text.
 */
function DiffPreview({
  original,
  modified,
}: {
  original: string;
  modified: string;
}) {
  // Simple word-level diff (for preview purposes)
  const originalWords = original.split(/\s+/);
  const modifiedWords = modified.split(/\s+/);

  // Calculate rough stats
  const addedCount = modifiedWords.filter((w) => !originalWords.includes(w)).length;
  const removedCount = originalWords.filter((w) => !modifiedWords.includes(w)).length;

  return (
    <div className="flex flex-wrap gap-1 text-xs">
      {removedCount > 0 && (
        <span className="inline-flex items-center rounded bg-destructive/10 px-1.5 py-0.5 text-destructive">
          -{removedCount} mot{removedCount > 1 ? "s" : ""}
        </span>
      )}
      {addedCount > 0 && (
        <span className="inline-flex items-center rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">
          +{addedCount} mot{addedCount > 1 ? "s" : ""}
        </span>
      )}
      <span className="text-muted-foreground">
        ({Math.round((Math.abs(modified.length - original.length) / Math.max(original.length, 1)) * 100)}% de changement)
      </span>
    </div>
  );
}

export default InlineEditor;
