/**
 * Autopilot Hook Module
 *
 * Main entry point for the /autopilot command - autonomous execution
 * from idea to working code.
 */

// Types
export type {
  AutopilotPhase,
  AutopilotState,
  AutopilotConfig,
  AutopilotResult,
  AutopilotSummary,
  AutopilotExpansion,
  AutopilotPlanning,
  AutopilotExecution,
  AutopilotQA,
  AutopilotValidation,
  ValidationResult,
  ValidationVerdictType,
  ValidationVerdict,
  QAStatus,
  AutopilotSignal
} from './types.js';

export { DEFAULT_CONFIG } from './types.js';

// State management & phase transitions
export {
  readAutopilotState,
  writeAutopilotState,
  clearAutopilotState,
  isAutopilotActive,
  initAutopilot,
  transitionPhase,
  incrementAgentCount,
  updateExpansion,
  updatePlanning,
  updateExecution,
  updateQA,
  updateValidation,
  ensureAutopilotDir,
  getSpecPath,
  getPlanPath,
  transitionRalphToUltraQA,
  transitionUltraQAToValidation,
  transitionToComplete,
  transitionToFailed,
  getTransitionPrompt,
  type TransitionResult
} from './state.js';

// Prompt generation
export {
  getExpansionPrompt,
  getDirectPlanningPrompt,
  getExecutionPrompt,
  getQAPrompt,
  getValidationPrompt,
  getPhasePrompt
} from './prompts.js';

// Validation coordination & summary generation
export {
  recordValidationVerdict,
  getValidationStatus,
  startValidationRound,
  shouldRetryValidation,
  getIssuesToFix,
  getValidationSpawnPrompt,
  formatValidationResults,
  generateSummary,
  formatSummary,
  formatCompactSummary,
  formatFailureSummary,
  formatFileList,
  type ValidationCoordinatorResult
} from './validation.js';

// Cancellation
export {
  cancelAutopilot,
  clearAutopilot,
  canResumeAutopilot,
  resumeAutopilot,
  formatCancelMessage,
  type CancelResult
} from './cancel.js';

// Signal detection & enforcement
export {
  detectSignal,
  getExpectedSignalForPhase,
  detectAnySignal,
  checkAutopilot,
  type AutopilotEnforcementResult
} from './enforcement.js';
