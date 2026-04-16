# Phase 5: Orchestrator

## Goal

Implement the team orchestrator — the leader logic that manages the 5-phase team lifecycle. This is the core coordination layer that ties registry, mailbox, and shared context together.

## Depends On

- Phase 1 (types)
- Phase 2 (registry)
- Phase 3 (mailbox)
- Phase 4 (shared context)

## Deliverables

### `src/team/orchestrator.ts`

### API

```typescript
// Lifecycle
function initTeam(options: {
  name: string;
  taskDescription: string;
  roles: Array<{ role: string; count?: number }>;  // e.g., [{ role: 'architect' }, { role: 'executor', count: 2 }]
  config?: Partial<TeamConfig>;
}): OrchestratorState;

function delegateWork(teamName: string, assignments: Array<{
  memberName: string;
  description: string;
  files?: string[];
}>): void;

function pollTeamStatus(teamName: string): {
  phase: OrchestratorPhase;
  members: TeamMember[];
  pendingMessages: Message[];
  staleMembers: TeamMember[];
};

function collectResults(teamName: string): {
  completed: TaskAssignment[];
  failed: TaskAssignment[];
  pending: TaskAssignment[];
};

function finalizeTeam(teamName: string): {
  success: boolean;
  summary: string;
};

// State management
function getOrchestratorState(teamName: string): OrchestratorState | undefined;
function advancePhase(teamName: string, phase: OrchestratorPhase): void;

// Error handling
function handleMemberFailure(teamName: string, memberName: string, error: string): {
  action: 'reassign' | 'skip' | 'abort';
  reassignedTo?: string;
};

// Permission broker — members don't decide permissions themselves
function handlePermissionRequest(teamName: string, request: {
  memberName: string;
  requestId: string;
  tool: string;
  args: unknown;
}): { approved: boolean; reason?: string };

// Completion notification — separate from regular conversation
function notifyMemberComplete(teamName: string, memberName: string, result: {
  summary: string;
  filesModified: string[];
  success: boolean;
}): void;

function cleanupTeam(teamName: string): void;  // Shutdown all members, clear state
```

### Lifecycle Phases

```
INIT ──→ DELEGATE ──→ COORDINATE ──→ COLLECT ──→ FINALIZE
  │                        │                         │
  │                        ↓                         │
  │                   (loop: poll,                    │
  │                    handle messages,               │
  │                    reassign if needed)            │
  │                                                  │
  └──── (abort on critical failure) ─────────────────┘
```

#### INIT
1. Validate role requirements against available agent definitions
2. Create team via registry (`createTeam`)
3. Generate member names from roles (architect-1, executor-1, executor-2)
4. Add members to registry (status: `pending`)
5. Initialize mailbox and shared context
6. Save orchestrator state
7. Advance to DELEGATE

#### DELEGATE
1. For each assignment, send a `task` message via mailbox
2. Update member status to `running`
3. Record file ownership in assignments (conflict prevention)
4. Validate no file ownership overlap between members
5. Advance to COORDINATE

#### COORDINATE
1. Poll member heartbeats — detect stale members
2. Read incoming messages (results, questions, feedback, permission requests)
3. For `question` messages: route to appropriate member or escalate to user
4. For `result` messages: update assignment status
5. For `permission_request` messages: leader decides and sends `permission_response`
6. For stale members: attempt recovery or reassign
7. Emit completion notifications as structured signals (not inline conversation)
8. Stay in COORDINATE until all assignments resolved → advance to COLLECT

#### COLLECT
1. Gather all `result` messages
2. Check for file conflicts (multiple members modified same file)
3. Aggregate results into shared context
4. If conflicts detected: flag for leader resolution
5. Advance to FINALIZE

#### FINALIZE
1. Update team status to `completed` (or `failed`)
2. Broadcast `shutdown_request` to all members, wait for `shutdown_response`
3. Close all spawn edges (subtree-aware: close children before parents)
4. Write final summary to shared context
5. Return summary to caller

### State File

`.omd/state/team/{name}/orchestrator.json` containing `OrchestratorState`.

### Implementation Notes

- The orchestrator does NOT spawn agents itself — it prepares the data structures and assignments. The hooks layer (Phase 6) or skill (Phase 7) handles actual agent spawning via the Task tool.
- File ownership is enforced at the data level: `delegateWork` rejects overlapping file lists.
- `handleMemberFailure` strategy:
  - If another idle member exists with the same role → reassign
  - If no idle member but under maxMembers → flag for new spawn
  - If critical (architect failed) → abort team
- `cleanupTeam` sends shutdown broadcast, then clears all state files under `.omd/state/team/{name}/`

## Test Plan

### `src/team/__tests__/orchestrator.test.ts`

**Lifecycle:**
- `initTeam` → creates team, members, mailbox, context, orchestrator state
- `delegateWork` → sends task messages, updates member status
- `pollTeamStatus` → returns current phase, member states, pending messages
- `collectResults` → categorizes assignments by status
- `finalizeTeam` → updates team status, broadcasts shutdown

**Phase transitions:**
- Init → Delegate → Coordinate → Collect → Finalize (happy path)
- Abort from any phase on critical failure

**Error handling:**
- Member failure with available replacement → reassign
- Member failure with no replacement → skip or abort
- File ownership conflict in delegateWork → throws

**Permission broker:**
- Member sends permission_request → leader responds with permission_response
- Permission response is routed back to the requesting member

**Completion notifications:**
- notifyMemberComplete → structured signal separate from conversation
- Completion signal includes files modified for conflict detection

**Subtree shutdown:**
- cleanupTeam closes spawn edges bottom-up (children before parents)
- No zombie members after cleanup

**Edge cases:**
- Team with single member
- All members fail
- Empty assignments

## Completion Criteria

- [ ] `src/team/orchestrator.ts` compiles and all functions are exported
- [ ] `src/team/__tests__/orchestrator.test.ts` — all tests pass
- [ ] Orchestrator state is persisted and recoverable
- [ ] File ownership conflicts are detected and rejected
- [ ] No dependency on actual agent spawning (pure data/state management)
