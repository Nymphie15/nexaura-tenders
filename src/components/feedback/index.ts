/**
 * Feedback Components
 *
 * Interactive UI components for collecting user feedback on generated content.
 *
 * Components:
 * - FeedbackWidget: Main widget with thumbs up/down and edit capabilities
 * - InlineEditor: Editor for correcting generated content
 * - FeedbackHistory: Full correction history view
 *
 * Usage:
 * ```tsx
 * import { FeedbackWidget, InlineEditor, FeedbackHistory } from "@/components/feedback";
 *
 * // Basic widget
 * <FeedbackWidget
 *   elementId="req-123"
 *   originalValue="Generated text..."
 *   phase="extraction"
 *   caseId="case-uuid"
 * />
 *
 * // Standalone editor
 * <InlineEditor
 *   originalValue="Original..."
 *   onSubmit={(corrected) => save(corrected)}
 *   onCancel={() => close()}
 * />
 *
 * // History view
 * <FeedbackHistory />
 * ```
 */

export { FeedbackWidget, type FeedbackWidgetProps } from "./feedback-widget";
export { InlineEditor, type InlineEditorProps } from "./inline-editor";
export { FeedbackHistory, type FeedbackHistoryProps } from "./feedback-history";
