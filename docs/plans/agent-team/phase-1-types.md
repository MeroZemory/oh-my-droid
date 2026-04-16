# Phase 1: Types

## Goal

Define all type definitions for the agent team system. This is the foundation that all subsequent phases depend on.

## Deliverables

### `src/team/types.ts`

All interfaces, enums, and constants in a single types file.

### Type Definitions

```typescript
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
  maxMembers: number;          // Default 5
  timeout: number;             // Team-wide timeout in ms. Default 600_000 (10min)
  memberTimeout: number;       // Per-member timeout in ms. Default 300_000 (5min)
  isolationMode: IsolationMode;
}

export const DEFAULT_TEAM_CONFIG: TeamConfig = {
  maxMembers: 5,
  timeout: 600_000,
  memberTimeout: 300_000,
  isolationMode: 'shared',
};

// --- Team Member ---

export interface TeamMember {
  id: string;                  // taskId from background task system
  name: string;                // Human-readable (e.g., "architect-1")
  role: string;                // Agent type (e.g., "architect", "executor")
  status: MemberStatus;
  currentTask?: string;        // Description of current work
  lastHeartbeat?: string;      // ISO timestamp
  toolPolicy?: MemberToolPolicy;
}

// --- Member Tool Policy ---
// Agent definition is an executable policy object, not just a prompt.
// Each member gets a scoped tool set based on their role.

export interface MemberToolPolicy {
  allowedTools?: string[];     // Whitelist (e.g., ["Read", "Glob", "Grep", "Edit"])
  disallowedTools?: string[];  // Blacklist (overrides allowed)
  model?: string;              // Model override for this member
  permissionMode?: 'leader-brokered' | 'autonomous';  // Default: leader-brokered
}

// --- Team ---

export interface Team {
  name: string;
  leader: string;              // Leader agent taskId
  members: TeamMember[];
  status: TeamStatus;
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
  config: TeamConfig;
}

// --- Message ---

export interface Message {
  id: number;                  // Monotonic sequence (auto-increment)
  from: string;                // Sender name
  to: string;                  // Recipient name or '*' (broadcast)
  type: MessageType;
  payload: unknown;
  timestamp: string;           // ISO timestamp
  read: boolean;
}

export interface MailboxState {
  nextId: number;
  messages: Message[];
}

// --- Typed Control Message Payloads ---
// The mailbox is a typed control plane, not a simple text channel.

export type ControlPayload =
  | { kind: 'text'; text: string }
  | { kind: 'task_assignment'; description: string; files?: string[] }
  | { kind: 'task_result'; summary: string; filesModified?: string[] }
  | { kind: 'permission_request'; requestId: string; tool: string; args: unknown }
  | { kind: 'permission_response'; requestId: string; approved: boolean; reason?: string }
  | { kind: 'shutdown_request'; reason?: string }
  | { kind: 'shutdown_response'; acknowledged: boolean };

// --- Spawn Graph ---
// Persisted parent-child relationships for recovery and subtree close.

export interface SpawnEdge {
  parentName: string;          // Parent member name (or 'leader')
  childName: string;           // Child member name
  status: 'open' | 'closed';
  spawnedAt: string;           // ISO timestamp
}

export interface SpawnGraph {
  teamName: string;
  edges: SpawnEdge[];
}

// --- Transcript Reference ---
// Per-member transcript storage for debugging and resume.

export interface TranscriptRef {
  memberName: string;
  path: string;                // Relative path to transcript file
  startedAt: string;
}

// --- Shared Context ---

export interface SharedContext {
  teamName: string;
  entries: ContextEntry[];
  updatedAt: string;           // ISO timestamp
}

export interface ContextEntry {
  author: string;              // Member name who added this
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
  files?: string[];            // Files this member owns (conflict prevention)
}
```

## Test Plan

### `src/team/__tests__/types.test.ts`

- Verify `DEFAULT_TEAM_CONFIG` has expected values
- Verify all type unions are exhaustive (compile-time check via satisfies)
- Verify a `Team` object can be serialized to JSON and back without loss

## Completion Criteria

- [ ] `src/team/types.ts` compiles without errors
- [ ] `src/team/__tests__/types.test.ts` passes
- [ ] No circular dependencies
- [ ] All types are exported and importable
