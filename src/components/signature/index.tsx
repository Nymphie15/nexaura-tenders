/**
 * Signature Components
 *
 * DocuSign integration components for electronic signatures.
 *
 * Usage:
 * ```tsx
 * import { SignatureRequest, SignatureStatusCard, EmbeddedSigning } from "@/components/signature";
 *
 * // Create signature request dialog
 * <SignatureRequest
 *   caseId="case-123"
 *   tenderReference="DCE_2025_0286"
 *   onSuccess={(envelopeId) => console.log("Created:", envelopeId)}
 * />
 *
 * // Display signature status
 * <SignatureStatusCard
 *   envelopeId="env-xyz"
 *   onDownload={(id) => downloadDocuments(id)}
 * />
 *
 * // Embedded signing for in-app signature
 * <EmbeddedSigning
 *   envelopeId="env-xyz"
 *   signerEmail="user@example.com"
 *   signerName="Jean Dupont"
 *   returnUrl="/signatures/complete"
 * />
 * ```
 */

export {
  SignatureRequest,
  SignatureStatusCard,
  EmbeddedSigning,
} from "./signature-request";

export type {
  // Re-export types if needed in the future
} from "./signature-request";
