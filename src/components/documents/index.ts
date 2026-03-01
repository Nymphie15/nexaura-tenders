/**
 * Documents Components Exports
 * Premium Design System - Appel-Offre-Automation
 * Phase 4 - Document Management Components
 */

// Core document components
export { PDFViewer } from './pdf-viewer';
export {
  DocumentComparison,
  type DocumentData as ComparisonDocumentData,
  type DiffLine,
  type DiffType,
  type ViewMode,
} from './document-comparison';
export { UploadDropzone, type UploadFile } from './upload-dropzone';
export {
  DocumentCard,
  type DocumentData,
  type DocumentStatus,
  type TenderDocument,
} from './document-card';

// Legacy components (for backwards compatibility)
export { DocumentList } from './document-list';
export { DocumentUpload } from './document-upload';
