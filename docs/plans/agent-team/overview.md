# Agent Team Feature Plan

## Background

Current multi-agent execution models in oh-my-droid:

| Mode | Characteristics | Limitations |
|------|----------------|-------------|
| **Swarm** | SQLite-based atomic task claiming, N workers | No inter-worker communication. Each runs independently |
| **Ralph** | Single-agent persistence loop | Single agent, no parallelism |
| **Ultrawork** | Parallel agent execution | Fire-and-forget. No coordination after result collection |
| **Autopilot** | 5-phase sequential pipeline | Fixed agents per phase, no dynamic collaboration |

Common limitation: **no real-time communication or coordination between agents.** A team abstraction is needed to address this. The design references the subagent/team structures of claude-code and codex.

Key architectural insight from both references: the team UI is not a separate dashboard — it's a distributed overlay on the existing conversation UI. Claude Code uses transcript focus switching and footer pills; Codex renders collaboration events as inline history cells. The mailbox is not a simple text channel but a typed control plane (permissions, approvals, shutdown). Agent definitions are executable policy objects (tools, model, permissions), not just prompts.

---

## Goals

1. Named agents with roles operating as a single team
2. Message-based inter-agent communication
3. Leader-member hierarchy with task delegation and result collection
4. Team-level state management and lifecycle

Non-goals:
- Replacing existing Swarm/Ralph/Autopilot (coexistence, gradual migration)
- Remote agent execution (local-first, remote in a later phase)

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Team Orchestrator               │
│  (Leader agent - distributes work, collects      │
│   results, makes decisions)                      │
├─────────────────────────────────────────────────┤
│                   Team Registry                  │
│  (.omd/state/team/{name}.json)                   │
│  Member list, status, metadata                   │
├─────────┬──────────┬──────────┬─────────────────┤
│ Agent A │ Agent B  │ Agent C  │ ...             │
│ (role)  │ (role)   │ (role)   │                 │
├─────────┴──────────┴──────────┴─────────────────┤
│                    Mailbox                       │
│  (.omd/state/team/{name}/mailbox.json)           │
│  Inter-agent message queue                       │
├─────────────────────────────────────────────────┤
│               Shared Context                     │
│  (.omd/state/team/{name}/context.md)             │
│  Shared context, decisions, findings             │
└─────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Team Registry

Team CRUD and member management.

```typescript
// src/team/registry.ts
interface Team {
  name: string;
  leader: string;              // Leader agent taskId
  members: TeamMember[];
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  config: TeamConfig;
}

interface TeamMember {
  id: string;                  // taskId
  name: string;                // Human-readable name (e.g., "architect-1")
  role: string;                // Agent type (e.g., "architect", "executor")
  status: 'pending' | 'running' | 'idle' | 'completed' | 'failed';
  currentTask?: string;        // Description of current work
}

interface TeamConfig {
  maxMembers: number;          // Default 5
  timeout: number;             // Team-wide timeout (ms)
  memberTimeout: number;       // Per-member timeout (ms)
  isolationMode: 'shared' | 'worktree';  // Filesystem isolation level
}
```

**State file:** `.omd/state/team/{name}.json`

Why JSON files instead of Swarm's SQLite:
- Small team size (max 5-10) — low concurrency pressure
- Easy to inspect and debug — both humans and LLMs can read and diagnose immediately
- Swarm needs SQLite for atomic claiming across N anonymous workers, but teams have a leader that assigns explicitly — no contention

### 2. Mailbox

Asynchronous message delivery between agents.

```typescript
// src/team/mailbox.ts
interface Message {
  id: string;                  // Monotonic sequence
  from: string;                // Sender name
  to: string;                  // Recipient name or '*' (broadcast)
  type: 'task' | 'result' | 'question' | 'feedback' | 'shutdown';
  payload: unknown;
  timestamp: string;
  read: boolean;
}

// API
function sendMessage(teamName: string, msg: Omit<Message, 'id' | 'timestamp' | 'read'>): void;
function readMessages(teamName: string, agentName: string): Message[];
function broadcastMessage(teamName: string, from: string, type: string, payload: unknown): void;
```

**State file:** `.omd/state/team/{name}/mailbox.json`

oh-my-droid runs agents as separate processes (Tasks), so a file-based mailbox is a natural fit. Reuses Swarm's heartbeat pattern, extended to message-level granularity.

### 3. Team Orchestrator (Leader Logic)

Manages the full lifecycle: team creation → member spawn → task distribution → result collection → final judgment.

```
Phase 1: INIT
  - Analyze request, determine required roles
  - Create team in Team Registry
  - Spawn member agents (via Task tool)

Phase 2: DELEGATE
  - Assign work to each member via Mailbox
  - Dependent tasks run sequentially, independent tasks in parallel

Phase 3: COORDINATE
  - Poll member status (heartbeat-based)
  - Handle question/feedback messages
  - Spawn additional members or reassign tasks as needed

Phase 4: COLLECT
  - Gather completed results
  - Detect conflicts (e.g., same file modified by multiple members)
  - Integrate results

Phase 5: FINALIZE
  - Verify integrated results (tsc, test, lint)
  - Record decisions in Shared Context
  - Transition team status to 'completed'
  - Broadcast shutdown to members
```

### 4. Shared Context

Knowledge store shared across the entire team.

```
.omd/state/team/{name}/
├── team.json           # Team Registry
├── spawn-graph.json    # Parent-child spawn relationships (for recovery)
├── mailbox.json        # Typed control message queue
├── orchestrator.json   # Orchestrator phase state
├── context.json        # Shared context (decisions, findings, constraints)
├── transcripts/        # Per-member durable transcript logs
│   ├── architect-1.log
│   └── executor-1.log
└── artifacts/          # Intermediate outputs (analysis results, review comments, etc.)
    ├── analysis.md
    └── review.md
```

`context.md` is injected into each member's system prompt. When a member makes an important discovery, it appends to the context and broadcasts, keeping the entire team in sync.

---

## Skill Integration

### `/team` Skill

```
/team [task description]
```

Activates team execution mode. Magic keywords: `team`, `collaborate`, `together`.

Relationship to existing modes:

| Existing Mode | Difference from Team Mode |
|---------------|--------------------------|
| **Swarm** | Anonymous workers + task claiming → Team has named agents + explicit assignment + communication |
| **Ultrawork** | Fire-and-forget parallel → Team allows mid-flight coordination |
| **Autopilot** | Fixed 5-phase → Team has dynamic phases, leader-driven decisions |
| **Ralplan** | 3-agent consensus → Can be reimplemented as a special case of team mode |

### Integration with Existing Skills

- **`/plan`** → Can generate team composition plans ("This task needs a team of architect + 2 executors + qa-tester")
- **`/ralph`** → Combine with team mode for team-level persistence loop
- **`/ai-slop-cleaner`** → Auto-invoke during final cleanup of team output

---

## Implementation Phases

### Phase 1: Foundation (Team Registry + Mailbox)

**Files:**
- `src/team/types.ts` — Team, TeamMember, TeamConfig, Message types
- `src/team/registry.ts` — Team CRUD, member management
- `src/team/mailbox.ts` — Send/receive messages, broadcast

**Verification:**
- Unit tests: team create/delete, member add/remove, message send/receive
- State file creation/read consistency

### Phase 2: Orchestrator

**Files:**
- `src/team/orchestrator.ts` — 5-phase lifecycle
- `src/hooks/team/index.ts` — Team-related hooks (member spawn, state change detection)

**Verification:**
- Integration tests: simple task with a 2-3 member team
- Timeout and failed member handling

### Phase 3: Skill + Integration

**Files:**
- `skills/team/SKILL.md` — `/team` skill definition
- `src/features/magic-keywords.ts` — Add team keywords
- `src/droids/definitions.ts` — Register team orchestrator agent

**Verification:**
- E2E: real scenarios like "team: add an API endpoint with architect + executor"
- Regression check on existing modes (swarm, ralph)

### Phase 4: Advanced Features (Follow-up)

- Worktree isolation mode (per-member git worktree)
- Team templates (presets for common team compositions)
- Team chaining (pass Team A's output to Team B)
- Reimplement Ralplan as a special case of team mode

---

## Technical Decisions

### File-Based State vs SQLite

| | JSON Files | SQLite |
|---|---|---|
| Team size 5-10 | Sufficient | Overkill |
| Debugging | `cat team.json` — both humans and LLMs can read and diagnose immediately | Requires SQL queries |
| Concurrency | Leader is sole writer — no contention | Unnecessary complexity |
| Existing patterns | Reuses state-manager.ts | Only used by swarm |

**Decision: JSON files.** The leader is the sole writer, so there is no contention. Consistent with the existing state-manager pattern.

### Communication Model: Mailbox vs Direct

| | Mailbox (async) | Direct (sync) |
|---|---|---|
| Agent independence | High — each processes at own pace | Low — blocks waiting for peer |
| Implementation complexity | Simple with file-based approach | Requires IPC, more complex |
| Fault isolation | Messages persist even if an agent dies | Lost on disconnect |

**Decision: Async Mailbox.** oh-my-droid runs agents as separate Task processes, making file-based async the natural choice.

### Member Execution: In-Process vs Background Task

| | In-process | Background Task |
|---|---|---|
| Isolation | Requires custom implementation (e.g., AsyncLocalStorage) | Process-level isolation built-in |
| Existing infra | Must build from scratch | Reuses BackgroundManager, ConcurrencyManager |
| Features | Must implement timeout, status tracking manually | Already supported by Task tool |

**Decision: Background Task.** Reuses existing `BackgroundManager` + `ConcurrencyManager`.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mailbox file contention (concurrent read/write) | Low (leader is primary writer) | Medium | Members read-only, leader writes exclusively |
| Zombie members on team timeout | Medium | High | Reuse Swarm's heartbeat + stale claim cleanup pattern |
| Hitting maxBackgroundTasks limit | High | Medium | Pre-check available slots at team creation, fall back to sequential execution |
| Multiple members modifying same file | Medium | High | File ownership assignment (ref: ultrapilot's file ownership pattern) |
| Context sync delay | Low | Low | Adjust polling interval, broadcast critical changes immediately |

---

## Success Criteria

1. A 3-member team (architect + executor + qa-tester) can complete an API endpoint addition
2. Messages are delivered between members, and the leader collects and integrates results
3. If one member fails, the team doesn't die — the leader handles it
4. Existing swarm, ralph, and autopilot continue to work without impact
5. `/team` skill is invocable via magic keyword or explicit command
