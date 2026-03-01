/**
 * Test Utils Index
 * Central export point for all test utilities
 */

// Re-export everything from test-utils
export * from './test-utils';

// Re-export mock data
export * from './mock-data';

// Re-export test server utilities
export * from './test-server';

// Re-export query helpers
export * from './query-helpers';

// Export type-safe test IDs (for data-testid attributes)
export const testIds = {
  // Navigation
  navLogo: 'nav-logo',
  navDashboard: 'nav-dashboard',
  navTenders: 'nav-tenders',
  navWorkflows: 'nav-workflows',
  navSettings: 'nav-settings',
  userMenu: 'user-menu',
  userMenuTrigger: 'user-menu-trigger',
  logoutButton: 'logout-button',

  // Dashboard
  dashboardStats: 'dashboard-stats',
  dashboardTendersList: 'dashboard-tenders-list',
  dashboardWorkflowsList: 'dashboard-workflows-list',

  // Tenders
  tendersList: 'tenders-list',
  tenderCard: 'tender-card',
  tenderTitle: 'tender-title',
  tenderReference: 'tender-reference',
  tenderDeadline: 'tender-deadline',
  tenderStatus: 'tender-status',
  tenderDetailsButton: 'tender-details-button',
  tenderImportButton: 'tender-import-button',

  // Workflows
  workflowsList: 'workflows-list',
  workflowCard: 'workflow-card',
  workflowPhase: 'workflow-phase',
  workflowProgress: 'workflow-progress',
  workflowStatus: 'workflow-status',
  workflowTimeline: 'workflow-timeline',

  // HITL Checkpoints
  checkpointCard: 'checkpoint-card',
  checkpointType: 'checkpoint-type',
  checkpointStatus: 'checkpoint-status',
  checkpointApproveButton: 'checkpoint-approve-button',
  checkpointRejectButton: 'checkpoint-reject-button',
  checkpointModifyButton: 'checkpoint-modify-button',

  // Forms
  loginForm: 'login-form',
  emailInput: 'email-input',
  passwordInput: 'password-input',
  submitButton: 'submit-button',
  cancelButton: 'cancel-button',

  // Loading states
  loadingSpinner: 'loading-spinner',
  loadingSkeleton: 'loading-skeleton',

  // Errors
  errorMessage: 'error-message',
  errorBoundary: 'error-boundary',

  // Notifications
  notificationToast: 'notification-toast',
  notificationsList: 'notifications-list',

  // Modals
  modal: 'modal',
  modalHeader: 'modal-header',
  modalContent: 'modal-content',
  modalFooter: 'modal-footer',
  modalCloseButton: 'modal-close-button',
} as const;

export type TestId = typeof testIds[keyof typeof testIds];
