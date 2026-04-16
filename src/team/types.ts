/**
 * Agent Team Type Definitions
 *
 * Foundation types for the agent team system.
 * All subsequent team modules depend on these types.
 */

// --- Team Status ---

export type TeamStatus = 'active' | 'completed' | 'failed';
export type MemberStatus = 'pending' | 'running' | 'idle' | 'completed' | 'failed';
export type MessageType =
  | 'task'
  | 'result'
  | 'question'
  | 'feedback'
  | 'shutdown_request'
  | 'shutdown_response'
  | 'permission_request'
  | 'permission_response';
export type IsolationMode = 'shared' | 'worktree';

// --- Team Config ---

export interface TeamConfig {
  maxMembers: number;
  timeout: number;
  memberTimeout: number;
  isolationMode: IsolationMode;
}

export const DEFAULT_TEAM_CONFIG: TeamConfig = {
  maxMembers: 5,
  timeout: 600_000,
  memberTimeout: 300_000,
  isolationMode: 'shared',
};

// --- Member Tool Policy ---

export interface MemberToolPolicy {
  allowedTools?: string[];
  disallowedTools?: string[];
  model?: string;
  permissionMode?: 'leader-brokered' | 'autonomous';
}

// --- Team Member ---

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: MemberStatus;
  currentTask?: string;
  lastHeartbeat?: string;
  toolPolicy?: MemberToolPolicy;
}

// --- Team ---

export interface Team {
  name: string;
  leader: string;
  members: TeamMember[];
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
  config: TeamConfig;
}

// --- Message ---

export interface Message {
  id: number;
  from: string;
  to: string;
  type: MessageType;
  payload: unknown;
  timestamp: string;
  read: boolean;
}

export interface MailboxState {
  nextId: number;
  messages: Message[];
}

// --- Typed Control Message Payloads ---

export type ControlPayload =
  | { kind: 'text'; text: string }
  | { kind: 'task_assignment'; description: string; files?: string[] }
  | { kind: 'task_result'; summary: string; filesModified?: string[] }
  | { kind: 'permission_request'; requestId: string; tool: string; args: unknown }
  | { kind: 'permission_response'; requestId: string; approved: boolean; reason?: string }
  | { kind: 'shutdown_request'; reason?: string }
  | { kind: 'shutdown_response'; acknowledged: boolean };

// --- Spawn Graph ---

export interface SpawnEdge {
  parentName: string;
  childName: string;
  status: 'open' | 'closed';
  spawnedAt: string;
}

export interface SpawnGraph {
  teamName: string;
  edges: SpawnEdge[];
}

// --- Transcript Reference ---

export interface TranscriptRef {
  memberName: string;
  path: string;
  startedAt: string;
}

// --- Shared Context ---

export interface SharedContext {
  teamName: string;
  entries: ContextEntry[];
  updatedAt: string;
}

export interface ContextEntry {
  author: string;
  content: string;
  category: 'decision' | 'finding' | 'constraint' | 'risk';
  timestamp: string;
}

// --- Orchestrator ---

export type OrchestratorPhase = 'init' | 'delegate' | 'coordinate' | 'collect' | 'finalize';

export interface OrchestratorState {
  teamName: string;
  phase: OrchestratorPhase;
  taskDescription: string;
  startedAt: string;
  assignments: TaskAssignment[];
}

export interface TaskAssignment {
  memberName: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  files?: string[];
}
