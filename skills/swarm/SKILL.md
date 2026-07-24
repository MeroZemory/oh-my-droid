---
name: swarm
description: N coordinated agents on shared task list with SQLite-based atomic claiming
---

# Swarm Skill

Spawn N coordinated agents working on a shared task list with SQLite-based atomic claiming. Like a dev team tackling multiple files in parallel—fast, reliable, and with full fault tolerance.

## Usage

```
/swarm N:agent-type "task description"
```

### Parameters

- **N** - Number of agents (1-5, enforced by Factory Droid limit)
- **agent-type** - Agent to spawn (e.g., executor, build-fixer, architect)
- **task** - High-level task to decompose and distribute

### Examples

```bash
/swarm 5:executor "fix all TypeScript errors"
/swarm 3:build-fixer "fix build errors in src/"
/swarm 4:designer "implement responsive layouts for all components"
/swarm 2:architect "analyze and document all API endpoints"
```

## Architecture

```
User: "/swarm 5:executor fix all TypeScript errors"
              |
              v
      [SWARM ORCHESTRATOR]
              |
   +--+--+--+--+--+
   |  |  |  |  |
   v  v  v  v  v
  E1 E2 E3 E4 E5
   |  |  |  |  |
   +--+--+--+--+
          |
          v
    [SQLITE DATABASE]
    ┌─────────────────────┐
    │ tasks table         │
    ├─────────────────────┤
    │ id, description     │
    │ status (pending,    │
    │   claimed, done,    │
    │   failed)           │
    │ claimed_by, claimed_at
    │ completed_at, result│
    │ error               │
    ├─────────────────────┤
    │ heartbeats table    │
    │ (agent monitoring)  │
    └─────────────────────┘
```

**Key Features:**
- SQLite transactions ensure only one agent can claim a task
- Lease-based ownership with automatic timeout and recovery
- Heartbeat monitoring for detecting dead agents
- Full ACID compliance for task state

## Workflow

### 1. Parse Input
- Extract N (agent count)
- Extract agent-type
- Extract task description
- Validate N <= 5

### 2. Create Task Pool
- Analyze codebase based on task
- Break into file-specific subtasks
- Initialize SQLite database with task pool
- Each task gets: id, description, status (pending), and metadata columns

### 3. Spawn Agents
- Launch N agents via Task tool
- Set `run_in_background: true` for all
- Each agent connects to the SQLite database
- Agents enter claiming loop automatically

### 3.1. Agent Preamble (IMPORTANT)

When spawning swarm agents, ALWAYS wrap the task with the worker preamble to prevent recursive sub-agent spawning:

```typescript
import { wrapWithPreamble } from '../droids/preamble.js';

// When spawning each agent:
const agentPrompt = wrapWithPreamble(`
Use mcp__t__swarm with cwd ${cwd}
Connect with action "connect"
Claim tasks with action "claim" and agentId "agent-${n}"
Complete work with action "complete" or "fail"
Send action "heartbeat" every 60 seconds
Exit when claim reports no pending tasks
`);

Task({
  subagent_type: 'oh-my-droid:executor',
  prompt: agentPrompt,
  run_in_background: true
});
```

The worker preamble ensures agents:
- Execute tasks directly using tools (Read, Write, Edit, Bash)
- Do NOT spawn sub-agents (prevents recursive agent storms)
- Report results with absolute file paths

### 4. Task Claiming Protocol (SQLite Transactional)
Each agent follows this loop:

```
LOOP:
  1. Call mcp__t__swarm({ action: "claim", cwd, agentId })
  2. SQLite transaction:
     - Find first pending task
     - UPDATE status='claimed', claimed_by=agentId, claimed_at=now
     - INSERT/UPDATE heartbeat record
     - Atomically commit (only one agent succeeds)
  3. Execute task
  4. Call mcp__t__swarm with action "complete" or "fail"
  5. GOTO LOOP until claim reports no pending tasks
```

**Atomic Claiming Details:**
- SQLite `IMMEDIATE` transaction prevents race conditions
- Only agent updating the row successfully gets the task
- Heartbeat automatically updated on claim
- If claim fails (already claimed), agent retries with next task
- Lease Timeout: 5 minutes per task
- If timeout exceeded + no heartbeat, MCP cleanup releases the task back to pending

### 5. Heartbeat Protocol
- Agents call `mcp__t__swarm` with action `heartbeat` every 60 seconds
- Heartbeat records: agent_id, last_heartbeat timestamp, current_task_id
- The connected swarm context runs stale-claim cleanup every 60 seconds
- If heartbeat is stale (>5 minutes old) and task claimed, task auto-releases

### 6. Progress Tracking
- Orchestrator monitors via TaskOutput
- Shows live progress: pending/claimed/done/failed counts
- Active agent and task counts come from the `status` action
- Per-agent task ownership comes from the returned task list
- Detects idle agents (all tasks claimed by others)

### 7. Completion
Exit when ANY of:
- `status` reports no pending or claimed tasks
- All agents idle (no pending tasks, no claimed tasks)
- User cancels via `/cancel`

## Storage

### SQLite Database (`.omd/state/swarm.db`)

The swarm uses a single SQLite database stored at `.omd/state/swarm.db`. This provides:
- **ACID compliance** - All task state transitions are atomic
- **Concurrent access** - Multiple agents query/update safely
- **Persistence** - State survives agent crashes
- **Query efficiency** - Fast status lookups and filtering

#### `tasks` Table Schema
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending: waiting to be claimed
    -- claimed: claimed by an agent, in progress
    -- done: completed successfully
    -- failed: completed with error
  claimed_by TEXT,                  -- agent ID that claimed this task
  claimed_at INTEGER,               -- Unix timestamp when claimed
  completed_at INTEGER,             -- Unix timestamp when completed
  result TEXT,                      -- Optional result/output from task
  error TEXT                        -- Error message if task failed
);
```

#### `heartbeats` Table Schema
```sql
CREATE TABLE heartbeats (
  agent_id TEXT PRIMARY KEY,
  last_heartbeat INTEGER NOT NULL,  -- Unix timestamp of last heartbeat
  current_task_id TEXT              -- Task agent is currently working on
);
```

#### `swarm_session` Table Schema
```sql
CREATE TABLE swarm_session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  session_id TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  agent_count INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER
);
```

## Task Claiming Protocol (Detailed)

The implementation uses `node:sqlite` `DatabaseSync` and a shared
`runImmediateTransaction()` helper that issues `BEGIN IMMEDIATE`, `COMMIT`, and
`ROLLBACK`. Workers never access the database directly. They use
`mcp__t__swarm`, which serializes actions and returns `retryable: true` when
SQLite lock contention should be retried.

Stale claims are released by the connected project's cleanup timer and whenever
a project is reconnected. Coordinators can also invoke the `cleanup` action
explicitly.

## API Reference

Agents interact with the swarm through the shipped `mcp__t__swarm` tool:

### Initialization

Workers and coordinators interact with the swarm through the `mcp__t__swarm` MCP tool.
This tool is available to executor, executor-low, and executor-high agents.

```typescript
// Orchestrator starts the swarm via the MCP tool
await mcp__t__swarm({
  action: 'start',
  cwd: process.cwd(),
  agentCount: 5,
  tasks: ['fix a.ts', 'fix b.ts', ...],
});

// Agents connect to the existing swarm
await mcp__t__swarm({ action: 'connect', cwd: process.cwd() });
```

### Agent Loop Pattern

```typescript
// Claim a task
const claim = await mcp__t__swarm({ action: 'claim', cwd: process.cwd(), agentId: 'agent-1' });

// Complete the task
await mcp__t__swarm({
  action: 'complete',
  cwd: process.cwd(),
  agentId: 'agent-1',
  taskId: claim.taskId,
  result: 'Fixed the bug',
});

const agentId = 'agent-1';

// Main work loop
while (true) {
  const claim = await mcp__t__swarm({
    action: 'claim',
    cwd: process.cwd(),
    agentId,
  });

  if (!claim.success) {
    if (claim.retryable) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    console.log('No tasks available:', claim.reason);
    break;
  }

  const { taskId, description } = claim;
  console.log(`Agent ${agentId} working on: ${description}`);

  try {
    // Do the work...
    const result = await executeTask(description);

    await mcp__t__swarm({
      action: 'complete',
      cwd: process.cwd(),
      agentId,
      taskId,
      result,
    });
    console.log(`Agent ${agentId} completed task ${taskId}`);

  } catch (error) {
    await mcp__t__swarm({
      action: 'fail',
      cwd: process.cwd(),
      agentId,
      taskId,
      error: error.message,
    });
    console.error(`Agent ${agentId} failed on ${taskId}:`, error);
  }

  // Send heartbeat every 60 seconds (while working on long tasks)
  await mcp__t__swarm({
    action: 'heartbeat',
    cwd: process.cwd(),
    agentId,
  });
}
```

### Configuration (SwarmConfig)

```typescript
interface SwarmConfig {
  agentCount: number;           // Number of agents (1-5)
  tasks: string[];              // Task descriptions
  agentType?: string;           // Agent type (default: 'executor')
  leaseTimeout?: number;        // Milliseconds (default: 5 min)
  heartbeatInterval?: number;   // Milliseconds (default: 60 sec)
  cwd?: string;                 // Working directory
}
```

### Types

```typescript
interface SwarmTask {
  id: string;
  description: string;
  status: 'pending' | 'claimed' | 'done' | 'failed';
  claimedBy: string | null;
  claimedAt: number | null;
  completedAt: number | null;
  error?: string;
  result?: string;
}

interface ClaimResult {
  success: boolean;
  taskId: string | null;
  description?: string;
  reason?: string;
}

interface SwarmStats {
  totalTasks: number;
  pendingTasks: number;
  claimedTasks: number;
  doneTasks: number;
  failedTasks: number;
  activeAgents: number;
  elapsedTime: number;
}
```

## Key Parameters

- **Max Agents:** 5 (enforced by Factory Droid background task limit)
- **Lease Timeout:** 5 minutes (default, configurable)
  - Tasks claimed longer than this without heartbeat are auto-released
- **Heartbeat Interval:** 60 seconds (recommended)
  - Agents should call the MCP `heartbeat` action at least this often
  - Prevents false timeout while working on long tasks
- **Cleanup Interval:** 60 seconds
  - The connected swarm context releases orphaned tasks automatically
- **Database:** SQLite (stored at `.omd/state/swarm.db`)
  - One database per swarm session
  - Survives agent crashes
  - Provides ACID guarantees

## Error Handling & Recovery

### Agent Crash
- Task is claimed but agent stops sending heartbeats
- After 5 minutes of no heartbeat, stale-claim cleanup releases the task
- Task returns to 'pending' status for another agent to claim
- Original agent's incomplete work is safely abandoned

### Task Completion Failure
- Agent calls the MCP `complete` action but is no longer the owner
- The update silently fails (no agent matches in WHERE clause)
- Agent can detect this by checking return value
- Agent should log error and continue to next task

### Database Unavailable
- The MCP `start` or `connect` action returns an error if initialization fails
- The MCP `claim` action reports the database error without assigning a task
- Retry only responses marked `retryable: true`

### All Agents Idle
- Orchestrator detects this from `status` task and heartbeat counts
- Triggers final cleanup and marks swarm as complete
- Remaining failed tasks are preserved in database

### No Tasks Available
- The MCP `claim` action returns `success: false` with a reason
- Agent should exit when the response is not retryable
- Safe for agent to exit cleanly when no work remains

## Cancel Swarm

User can cancel via `/cancel`:
- Stops orchestrator monitoring
- Signals all background agents to exit
- Preserves partial progress in SQLite database
- Marks session as "cancelled" in database

## Use Cases

### 1. Fix All Type Errors
```
/swarm 5:executor "fix all TypeScript type errors"
```
Spawns 5 executors, each claiming and fixing individual files.

### 2. Implement UI Components
```
/swarm 3:designer "implement Material-UI styling for all components in src/components/"
```
Spawns 3 designers, each styling different component files.

### 3. Security Audit
```
/swarm 4:security-reviewer "review all API endpoints for vulnerabilities"
```
Spawns 4 security reviewers, each auditing different endpoints.

### 4. Documentation Sprint
```
/swarm 2:writer "add JSDoc comments to all exported functions"
```
Spawns 2 writers, each documenting different modules.

## Benefits of SQLite-Based Implementation

### Atomicity & Safety
- **Race-Condition Free:** SQLite transactions guarantee only one agent claims each task
- **No Lost Updates:** ACID compliance means state changes are durable
- **Orphan Prevention:** Expired claims are automatically released without manual intervention

### Performance
- **Fast Queries:** Indexed lookups on task status and agent ID
- **Concurrent Access:** Multiple agents read/write without blocking
- **Minimal Lock Time:** Transactions are microseconds, not seconds

### Reliability
- **Crash Recovery:** Database survives agent failures
- **Automatic Cleanup:** Stale claims don't block progress
- **Lease-Based:** Time-based expiration prevents indefinite hangs

### Developer Experience
- **Simple API:** One `mcp__t__swarm` tool with action-specific inputs
- **Full Visibility:** Query any task or agent status at any time
- **Easy Debugging:** SQL queries show exact state without decoding JSON

### Scalability
- **10s to 1000s of Tasks:** SQLite handles easily
- **Full Task Retention:** Complete history in database for analysis
- **Extensible Schema:** Add custom columns for task metadata

## STATE CLEANUP ON COMPLETION

**IMPORTANT:** Stop the swarm through the MCP tool so the SQLite session,
cleanup timer, marker, and connection are closed consistently.

When all tasks are done:

```typescript
await mcp__t__swarm({
  action: 'stop',
  cwd: process.cwd(),
  deleteDatabase: true,
});
```

## Implementation Notes

The orchestrator (main skill handler) is responsible for:
1. Initial task decomposition (via explore/architect)
2. Creating the swarm with the MCP `start` action
3. Spawning N background agents
4. Monitoring progress with the MCP `status` action
5. Running the MCP `cleanup` action when an explicit sweep is needed
6. Detecting completion from task counts
7. Reporting the final summary from MCP status

Each agent is a standard Task invocation with:
- `run_in_background: true`
- Agent-specific prompt with work loop instructions
- MCP tool: `mcp__t__swarm` (available to executor, executor-low, executor-high)
- Connection: `mcp__t__swarm({ action: 'connect', cwd })` to join existing swarm
- Loop: `mcp__t__swarm({ action: 'claim', ... })` → do work → `mcp__t__swarm({ action: 'complete', ... })` or `mcp__t__swarm({ action: 'fail', ... })`
