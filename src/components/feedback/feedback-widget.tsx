"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Edit, History, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InlineEditor } from "./inline-editor";
import { useFeedback, useCorrectionHistory, useInlineFeedback, useElementFeedback } from "@/hooks/use-feedback";

export interface FeedbackWidgetProps {
  /** Unique identifier for the element being rated */
  elementId: string;
  /** Original value of the element (for corrections) */
  originalValue: string;
  /** Current workflow phase */
  phase: string;
  /** Case ID / Workflow ID for corrections */
  caseId?: string;
  /** Alias for caseId - Workflow ID for real-time feedback */
  workflowId?: string;
  /** Additional context to include with feedback */
  context?: Record<string, unknown>;
  /** Widget size variant */
  size?: "sm" | "default" | "lg";
  /** Orientation of quick actions */
  orientation?: "horizontal" | "vertical";
  /** Show correction history button */
  showHistory?: boolean;
  /** Use real-time feedback API (new inline feedback system) */
  useRealtimeFeedback?: boolean;
  /** Callback when feedback is submitted */
  onFeedbackSubmit?: (type: "thumbs_up" | "thumbs_down" | "edit", learningTriggered?: boolean) => void;
  /** Additional CSS classes */
  className?: string;
  /** Label for accessibility */
  label?: string;
}

/**
 * Interactive feedback widget for collecting user feedback on generated content.
 *
 * Features:
 * - Quick actions (thumbs up/down) for rapid feedback
 * - Inline editor for corrections
 * - Tooltips explaining the impact of each action
 * - Correction history access
 * - Animated interactions
 *
 * Usage:
 * ```tsx
 * <FeedbackWidget
 *   elementId="requirement-123"
 *   originalValue="The generated requirement text..."
 *   phase="extraction"
 *   caseId="case-uuid"
 *   onFeedbackSubmit={(type) => console.log("Feedback:", type)}
 * />
 * ```
 */
export function FeedbackWidget({
  elementId,
  originalValue,
  phase,
  caseId,
  workflowId,
  context,
  size = "default",
  orientation = "horizontal",
  showHistory = true,
  useRealtimeFeedback = false,
  onFeedbackSubmit,
  className,
  label,
}: FeedbackWidgetProps) {
  const [showEdit, setShowEdit] = React.useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = React.useState(false);
  const [submitted, setSubmitted] = React.useState<"thumbs_up" | "thumbs_down" | null>(null);
  const [learningTriggered, setLearningTriggered] = React.useState(false);

  // Use the appropriate feedback hook based on useRealtimeFeedback prop
  const { mutate: submitLegacyFeedback, isPending: isLegacySubmitting } = useFeedback();
  const { mutate: submitInlineFeedback, isPending: isInlineSubmitting } = useInlineFeedback();
  const { data: history } = useCorrectionHistory({ limit: 5 });

  // Get effective workflow ID
  const effectiveWorkflowId = workflowId || caseId;

  // Combined pending state
  const isSubmitting = useRealtimeFeedback ? isInlineSubmitting : isLegacySubmitting;

  // Reset submitted state after a delay
  React.useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        setSubmitted(null);
        setLearningTriggered(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const handleQuickFeedback = (type: "thumbs_up" | "thumbs_down") => {
    if (useRealtimeFeedback && effectiveWorkflowId) {
      // Use new real-time feedback API
      submitInlineFeedback(
        {
          workflow_id: effectiveWorkflowId,
          phase: phase.toUpperCase(),
          element_id: elementId,
          feedback_type: type,
          original_value: originalValue,
          metadata: context,
        },
        {
          onSuccess: (response) => {
            setSubmitted(type);
            setLearningTriggered(response.learning_triggered);
            onFeedbackSubmit?.(type, response.learning_triggered);
          },
        }
      );
    } else {
      // Use legacy feedback API
      submitLegacyFeedback(
        {
          type,
          elementId,
          phase,
          context,
        },
        {
          onSuccess: () => {
            setSubmitted(type);
            onFeedbackSubmit?.(type);
          },
        }
      );
    }
  };

  const handleEditSubmit = (correctedValue: string) => {
    if (!effectiveWorkflowId) {
      console.error("workflowId or caseId is required for edit feedback");
      return;
    }

    if (useRealtimeFeedback) {
      // Use new real-time feedback API for edits
      submitInlineFeedback(
        {
          workflow_id: effectiveWorkflowId,
          phase: phase.toUpperCase(),
          element_id: elementId,
          feedback_type: "edit",
          original_value: originalValue,
          corrected_value: correctedValue,
          metadata: context,
        },
        {
          onSuccess: (response) => {
            setShowEdit(false);
            setLearningTriggered(response.learning_triggered);
            onFeedbackSubmit?.("edit", response.learning_triggered);
          },
        }
      );
    } else {
      // Use legacy feedback API
      submitLegacyFeedback(
        {
          type: "edit",
          elementId,
          caseId: effectiveWorkflowId,
          original: originalValue,
          corrected: correctedValue,
          phase,
          context,
        },
        {
          onSuccess: () => {
            setShowEdit(false);
            onFeedbackSubmit?.("edit");
          },
        }
      );
    }
  };

  const sizeClasses = {
    sm: "gap-1",
    default: "gap-2",
    lg: "gap-3",
  };

  const buttonSizes = {
    sm: "icon-sm" as const,
    default: "icon" as const,
    lg: "icon-lg" as const,
  };

  return (
    <div
      className={cn("feedback-widget", className)}
      role="group"
      aria-label={label || `Feedback pour ${elementId}`}
    >
      {/* Quick actions */}
      <div
        className={cn(
          "quick-actions flex items-center",
          sizeClasses[size],
          orientation === "vertical" && "flex-col"
        )}
      >
        {/* Thumbs up */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={submitted === "thumbs_up" ? "default" : "outline"}
              size={buttonSizes[size]}
              onClick={() => handleQuickFeedback("thumbs_up")}
              disabled={isSubmitting || submitted !== null}
              className={cn(
                "transition-all",
                submitted === "thumbs_up" && "bg-emerald-500 hover:bg-emerald-600"
              )}
              aria-label="J'aime cette suggestion"
            >
              <AnimatePresence mode="wait">
                {submitted === "thumbs_up" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="thumb"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Valider cette suggestion</p>
              <p className="text-xs text-muted-foreground">
                Ce feedback renforce la confiance du système dans ce type de
                génération. Les futures suggestions similaires seront privilégiées.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Thumbs down */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={submitted === "thumbs_down" ? "default" : "outline"}
              size={buttonSizes[size]}
              onClick={() => handleQuickFeedback("thumbs_down")}
              disabled={isSubmitting || submitted !== null}
              className={cn(
                "transition-all",
                submitted === "thumbs_down" && "bg-orange-500 hover:bg-orange-600"
              )}
              aria-label="Cette suggestion peut être améliorée"
            >
              <AnimatePresence mode="wait">
                {submitted === "thumbs_down" ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="thumb"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Signaler une amélioration possible</p>
              <p className="text-xs text-muted-foreground">
                Le système apprendra à éviter ce type de formulation. Pour plus de
                précision, utilisez l'option Modifier.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Edit button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={showEdit ? "default" : "outline"}
              size={buttonSizes[size]}
              onClick={() => setShowEdit(!showEdit)}
              disabled={isSubmitting}
              aria-label="Modifier cette suggestion"
              aria-expanded={showEdit}
            >
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Edit className="h-4 w-4" />
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">Modifier et corriger</p>
              <p className="text-xs text-muted-foreground">
                Votre correction sera analysée pour détecter les patterns de
                préférence. Le système apprendra de vos modifications pour
                personnaliser les futures générations.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {/* History button */}
        {showHistory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showHistoryPanel ? "secondary" : "ghost"}
                size={buttonSizes[size]}
                onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                aria-label="Historique des corrections"
                aria-expanded={showHistoryPanel}
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Voir l'historique des corrections</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Learning triggered indicator */}
        <AnimatePresence>
          {learningTriggered && submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Apprentissage lance</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">Apprentissage automatique déclenché</p>
                    <p className="text-xs text-muted-foreground">
                      Suite à plusieurs feedbacks négatifs, le système va apprendre de vos
                      corrections pour améliorer les générations futures sur cette phase.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Inline editor */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <InlineEditor
              originalValue={originalValue}
              onSubmit={handleEditSubmit}
              onCancel={() => setShowEdit(false)}
              isSubmitting={isSubmitting}
              label="Corriger la suggestion"
              showDiff
              showCharCount
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* History panel */}
      <AnimatePresence>
        {showHistoryPanel && history && history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <CorrectionHistoryPanel
              history={history}
              onClose={() => setShowHistoryPanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Panel displaying recent correction history.
 */
function CorrectionHistoryPanel({
  history,
  onClose,
}: {
  history: Array<{
    id: string;
    section_id: string;
    section_type: string;
    correction_types: string[];
    change_ratio: number;
    original_preview?: string;
    modified_preview?: string;
    created_at: string;
  }>;
  onClose: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getCorrectionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      style: "Style",
      structure: "Structure",
      terminology: "Terminologie",
      addition: "Ajout",
      deletion: "Suppression",
      reformulation: "Reformulation",
    };
    return labels[type] || type;
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Historique des corrections</h4>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <span className="sr-only">Fermer</span>
          &times;
        </Button>
      </div>

      <div className="space-y-3">
        {history.map((item) => (
          <div
            key={item.id}
            className="rounded-md border border-border/50 bg-muted/20 p-2"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">
                {item.section_type}
              </span>
              <span className="text-muted-foreground">
                {formatDate(item.created_at)}
              </span>
            </div>

            <div className="mb-2 flex flex-wrap gap-1">
              {item.correction_types.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                >
                  {getCorrectionTypeLabel(type)}
                </span>
              ))}
              <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {Math.round(item.change_ratio * 100)}% modifie
              </span>
            </div>

            {item.original_preview && item.modified_preview && (
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground line-through">
                  {item.original_preview}
                </p>
                <p className="text-foreground">{item.modified_preview}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <Info className="h-3 w-3" />
        <span>Ces corrections ameliorent les futures suggestions.</span>
      </div>
    </div>
  );
}

export default FeedbackWidget;
