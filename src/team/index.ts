/**
 * Agent Team — Public API
 *
 * Barrel re-export for the team module.
 */

// Types
export type {
  Team,
  TeamMember,
  TeamConfig,
  TeamStatus,
  MemberStatus,
  MemberToolPolicy,
  Message,
  MessageType,
  MailboxState,
  ControlPayload,
  IsolationMode,
  SpawnEdge,
  SpawnGraph,
  TranscriptRef,
  SharedContext,
  ContextEntry,
  OrchestratorState,
  OrchestratorPhase,
  TaskAssignment,
} from './types.js';
export { DEFAULT_TEAM_CONFIG } from './types.js';

// Registry
export {
  createTeam,
  getTeam,
  deleteTeam,
  listTeams,
  updateTeamStatus,
  addMember,
  removeMember,
  updateMemberStatus,
  getMember,
  heartbeat,
  getActiveMembers,
  getStaleMembers,
  addSpawnEdge,
  closeSpawnEdge,
  getSpawnGraph,
  getOpenChildren,
} from './registry.js';

// Mailbox
export {
  sendMessage,
  readMessages,
  readUnreadMessages,
  markAsRead,
  broadcastMessage,
  getMailboxState,
  clearMailbox,
  pruneReadMessages,
} from './mailbox.js';

// Context
export {
  addContextEntry,
  getContext,
  getContextAsMarkdown,
  writeArtifact,
  readArtifact,
  listArtifacts,
  appendTranscript,
  getTranscriptPath,
  listTranscripts,
  clearContext,
} from './context.js';

// Orchestrator
export {
  initTeam,
  delegateWork,
  pollTeamStatus,
  collectResults,
  finalizeTeam,
  getOrchestratorState,
  advancePhase,
  handleMemberFailure,
  handlePermissionRequest,
  notifyMemberComplete,
  cleanupTeam,
} from './orchestrator.js';
