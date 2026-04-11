---
name: team
description: N coordinated agents on shared task list using tmux-based parallel workers
argument-hint: "[N:agent-type] [task description]"
aliases: []
level: 4
---

# Team Skill

Spawn N coordinated agents working on a shared task list using **tmux-based parallel workers**. Inspired by oh-my-claudecode's team orchestration, adapted for Factory Droid.

This skill replaces the legacy `/swarm` skill (SQLite-based) with tmux-based worker coordination, enabling true parallel execution with visual monitoring.

## Usage

```
/team N:agent-type "task description"
/team "task description"
/team ralph "task description"
```

### Parameters

- **N** - Number of teammate agents (1-10). Optional; defaults to auto-sizing based on task decomposition.
- **agent-type** - OMD agent to spawn (e.g., executor, debugger, designer). Optional; defaults to executor.
- **task** - High-level task to decompose and distribute among teammates
- **ralph** - Optional modifier. When present, wraps the team pipeline in Ralph's persistence loop.

### Examples

```bash
/team 5:executor "fix all TypeScript errors across the project"
/team 3:debugger "fix build errors in src/"
/team 4:designer "implement responsive layouts for all page components"
/team "refactor the auth module with security review"
/team ralph "build a complete REST API for user management"
```

## Architecture

```
User: "/team 3:executor fix all TypeScript errors"
              |
              v
      [TEAM ORCHESTRATOR (Lead)]
              |
              +-- Create tmux session "omd-team-{slug}"
              |
              +-- Analyze & decompose task into subtasks
              |   -> explore/architect produces subtask list
              |
              +-- Create task files in .omd/team/{slug}/tasks/
              |   -> task-1.json, task-2.json, task-3.json
              |
              +-- Spawn N tmux panes (workers)
              |   -> Each worker claims tasks from pool
              |
              +-- Monitor loop
              |   <- Read worker status files
              |   -> Reassign failed tasks
              |
              +-- Completion
                  -> Kill tmux session
                  -> Cleanup state files
```

**Storage layout:**
```
.omd/team/{slug}/
├── state.json           # Team metadata, phase, worker count
├── tasks/
│   ├── task-1.json      # Task definition + status
│   ├── task-2.json
│   └── task-3.json
├── workers/
│   ├── worker-1.json    # Worker status + current task
│   ├── worker-2.json
│   └── worker-3.json
├── handoffs/
│   ├── plan-to-exec.md  # Stage transition context
│   └── exec-to-verify.md
└── results/
    ├── task-1.md        # Task completion report
    └── task-2.md
```

## Staged Pipeline

Team execution follows a staged pipeline:

`team-plan -> team-exec -> team-verify -> team-fix (loop)`

### Stage Definitions

| Stage | Purpose | Agents |
|-------|---------|--------|
| **team-plan** | Analyze codebase, decompose task | explore (haiku), planner (opus) |
| **team-exec** | Execute subtasks in parallel | executor (sonnet), designer, debugger |
| **team-verify** | Verify all work, run tests | verifier (sonnet), code-reviewer |
| **team-fix** | Fix issues found in verify | executor (sonnet), debugger |

### Stage Entry/Exit Criteria

- **team-plan**
  - Entry: Team invocation is parsed
  - Exit: Task decomposition complete, subtasks created in `.omd/team/{slug}/tasks/`

- **team-exec**
  - Entry: Subtasks exist and workers are spawned
  - Exit: All subtasks reach terminal state (done or failed)

- **team-verify**
  - Entry: Execution pass finishes
  - Exit (pass): All verification checks pass
  - Exit (fail): Issues found, generate fix tasks

- **team-fix**
  - Entry: Verification found defects
  - Exit: Fixes complete, return to team-verify

## tmux Integration

### Session Management

```bash
# Create team session
tmux new-session -d -s "omd-team-{slug}" -n "lead"

# Create worker panes
tmux split-window -t "omd-team-{slug}" -h
tmux split-window -t "omd-team-{slug}" -v
# ... repeat for N workers

# Send commands to workers using droid exec
tmux send-keys -t "omd-team-{slug}:0.1" "droid exec --auto medium --cwd $(pwd) 'Worker 1: claim tasks from .omd/team/{slug}/tasks/'" Enter
```

### Worker Pane Layout

For 3 workers:
```
┌─────────────────────────────────────┐
│              LEAD (0.0)             │
├─────────────────┬───────────────────┤
│  WORKER-1 (0.1) │   WORKER-2 (0.2)  │
├─────────────────┴───────────────────┤
│           WORKER-3 (0.3)            │
└─────────────────────────────────────┘
```

### Worker Command

Workers are spawned using `droid exec` (non-interactive mode):

```bash
# Basic worker (read-only analysis)
droid exec "Worker 1: claim and execute tasks from .omd/team/{slug}/tasks/"

# Worker with file editing capability
droid exec --auto medium "Worker 1: claim and execute tasks..."

# Worker that can commit/push
droid exec --auto high "Worker 1: claim, fix, and commit..."

# Worker with specific model
droid exec --auto medium --model claude-sonnet-4-6 "Worker 1: ..."
```

**Autonomy levels for workers:**
- `--auto low` - Safe file operations (create, edit, format)
- `--auto medium` - Development tasks (npm install, git commit local)
- `--auto high` - Full operations (git push, deployments)

### Attach to Monitor

```bash
tmux attach -t "omd-team-{slug}"
```

User can watch all workers in real-time!

## Workflow

### Phase 1: Parse Input

- Extract **N** (agent count), validate 1-10
- Extract **agent-type**, validate it maps to a known OMD subagent
- Extract **task** description
- Generate team slug from task (e.g., "fix-ts-errors")

### Phase 2: Initialize Team

1. Create tmux session:
   ```bash
   tmux new-session -d -s "omd-team-{slug}" -n "lead"
   ```

2. Create state directory:
   ```bash
   mkdir -p .omd/team/{slug}/{tasks,workers,handoffs,results}
   ```

3. Write initial state:
   ```json
   {
     "slug": "fix-ts-errors",
     "task": "fix all TypeScript errors",
     "phase": "team-plan",
     "agentCount": 3,
     "agentType": "executor",
     "startedAt": "2026-04-11T12:00:00Z",
     "linkedRalph": false
   }
   ```

### Phase 3: Analyze & Decompose (team-plan)

Use explore/architect to analyze codebase and create subtasks:

```
Task(
  subagent_type="oh-my-droid:architect",
  prompt="Analyze the codebase and decompose this task into N independent subtasks:
  Task: {task}
  
  Output JSON array of subtasks:
  [
    { \"id\": \"task-1\", \"description\": \"...\", \"files\": [\"...\"], \"dependencies\": [] },
    ...
  ]"
)
```

Write each subtask to `.omd/team/{slug}/tasks/task-{n}.json`:
```json
{
  "id": "task-1",
  "description": "Fix type errors in src/auth/",
  "files": ["src/auth/login.ts", "src/auth/session.ts"],
  "dependencies": [],
  "status": "pending",
  "assignedTo": null,
  "claimedAt": null,
  "completedAt": null,
  "result": null,
  "error": null
}
```

### Phase 4: Spawn Workers (team-exec)

Create N tmux panes and start workers using `droid exec`:

```bash
# For each worker 1..N:
tmux split-window -t "omd-team-{slug}"

# Write worker prompt to file (cleaner than inline)
cat > .omd/team/{slug}/workers/worker-{n}-prompt.md << 'EOF'
You are WORKER-{n} in team "{slug}".
Working directory: {cwd}
Team state: .omd/team/{slug}/
...
EOF

# Spawn worker with droid exec
tmux send-keys -t "omd-team-{slug}:0.{n}" \
  "droid exec --auto medium --cwd {cwd} -f .omd/team/{slug}/workers/worker-{n}-prompt.md" Enter
```

**Worker Prompt Template** (saved to `.omd/team/{slug}/workers/worker-{n}-prompt.md`):
```
You are WORKER-{n} in team "{slug}".
Working directory: {cwd}
Team state: .omd/team/{slug}/

== WORK PROTOCOL ==

1. CLAIM: Read .omd/team/{slug}/tasks/ to find pending tasks.
   Pick one where status="pending" and dependencies are met.
   Write your worker ID to the task's assignedTo field.

2. WORK: Execute the task using your tools (Read, Edit, Execute).
   Do NOT spawn sub-agents (no Task tool). Work directly.

3. COMPLETE: Update the task file:
   - Set status="done" or status="failed"
   - Set completedAt to current timestamp
   - Write result to .omd/team/{slug}/results/task-{id}.md

4. UPDATE STATUS: Write your status to .omd/team/{slug}/workers/worker-{n}.json:
   {
     "workerId": "worker-{n}",
     "status": "idle" | "working" | "done",
     "currentTask": "task-1" | null,
     "lastHeartbeat": "ISO timestamp",
     "completedTasks": ["task-1", "task-2"]
   }

5. NEXT: Check for more pending tasks. If none, set status="done".

== RULES ==
- NEVER spawn sub-agents (no Task tool)
- ALWAYS use absolute file paths
- UPDATE worker status after each task
- EXIT when all tasks are done or no pending tasks remain
```

**droid exec options used:**
- `--auto medium` - Allows file edits, npm install, local git commits
- `--cwd {cwd}` - Ensures worker runs in correct directory
- `-f <file>` - Read prompt from file (cleaner for long prompts)

### Phase 5: Monitor

Lead monitors progress by:

1. **Polling task files** - Check `.omd/team/{slug}/tasks/*.json` for status changes
2. **Reading worker status** - Check `.omd/team/{slug}/workers/*.json` for heartbeats
3. **Detecting stuck workers** - If no heartbeat for 5 minutes, reassign tasks

**Progress Display:**
```
[TEAM: fix-ts-errors - PHASE: team-exec]
┌─────────────────────────────────────────────────────────┐
│ Tasks: 2/5 done, 1 in-progress, 2 pending              │
│ Workers: 3 active                                       │
├─────────────────────────────────────────────────────────┤
│ worker-1: [working] task-3 - Fix auth types             │
│ worker-2: [idle] completed task-1, task-2               │
│ worker-3: [working] task-4 - Fix API types              │
└─────────────────────────────────────────────────────────┘

Attach to watch: tmux attach -t omd-team-fix-ts-errors
```

### Phase 6: Verify (team-verify)

When all exec tasks complete:

1. Spawn verifier agent:
   ```
   Task(
     subagent_type="oh-my-droid:verifier",
     prompt="Verify all changes made by the team:
     - Run typecheck: tsc --noEmit
     - Run tests: npm test
     - Review changes in .omd/team/{slug}/results/
     
     Output: PASS or FAIL with issues list"
   )
   ```

2. If PASS → Phase 7 (Completion)
3. If FAIL → Phase 6.5 (Fix)

### Phase 6.5: Fix (team-fix)

For each issue found:

1. Create fix task in `.omd/team/{slug}/tasks/fix-{n}.json`
2. Respawn workers to claim fix tasks
3. Return to Phase 6 (Verify)

**Max fix loops:** 3 (configurable)

### Phase 7: Completion

1. Kill tmux session:
   ```bash
   tmux kill-session -t "omd-team-{slug}"
   ```

2. Generate summary report

3. Clean up state (optional, preserve for inspection):
   ```bash
   rm -rf .omd/team/{slug}
   ```

4. If linked to Ralph, signal completion

## Handoff Documents

Each stage transition writes a handoff to `.omd/team/{slug}/handoffs/`:

```markdown
## Handoff: team-plan → team-exec
- **Decided**: Decomposed into 5 file-scoped tasks
- **Rejected**: Module-level decomposition (too coarse)
- **Risks**: task-3 and task-4 may conflict on shared types
- **Files**: .omd/team/fix-ts-errors/tasks/*.json
- **Remaining**: Execute all tasks, verify results
```

## Configuration

Optional settings in `.omd/config.json`:

```json
{
  "team": {
    "maxWorkers": 10,
    "defaultAgentType": "executor",
    "heartbeatTimeoutMs": 300000,
    "maxFixLoops": 3,
    "preserveStateOnComplete": false
  }
}
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `/ralph` | Team can be wrapped in Ralph persistence loop |
| `/deep-interview` | Invoke if task requirements are unclear |
| `/ai-slop-cleaner` | Run on completed work before verify |
| `/ralplan` | Use for complex planning before team-exec |

## Team + Ralph Composition

When invoked with `ralph` modifier:

```
/team ralph "build REST API"
```

The execution becomes:
1. Ralph outer loop starts
2. Team pipeline runs inside Ralph
3. If team-verify fails after max fix loops, Ralph retries entire team
4. Ralph's architect verification runs after team completion

## Cancellation

```
/cancel
```

Cancellation:
1. Sends SIGTERM to all worker panes
2. Waits 5 seconds for graceful shutdown
3. Kills tmux session
4. Preserves state files for inspection
5. Marks state.json as `phase: "cancelled"`

## Comparison: Team vs Swarm

| Feature | Team (tmux) | Swarm (SQLite) |
|---------|-------------|----------------|
| **Parallelism** | True parallel (tmux panes) | Background agents (limited) |
| **Visibility** | Real-time (tmux attach) | Logs only |
| **Coordination** | File-based | SQLite transactions |
| **Max workers** | 10 | 5 |
| **Worker type** | `droid exec` sessions | Task subagents |
| **Crash recovery** | Heartbeat + reassign | Lease timeout |
| **Autonomy control** | `--auto low/medium/high` | None (inherits lead) |
| **Model control** | `--model <id>` per worker | Inherits lead model |

**When to use Team:** Complex tasks needing visual monitoring, many workers, or long-running execution.

**When to use Swarm:** Simple parallelization, quick tasks, or when tmux is unavailable.

## droid exec Reference

Workers use `droid exec` for non-interactive execution:

```bash
# Syntax
droid exec [options] [prompt]
droid exec [options] -f <prompt-file>
droid exec [options] - < prompt.txt

# Key options
--auto <level>        # low|medium|high - autonomy level
--cwd <path>          # Working directory
--model <id>          # Model to use (claude-opus-4-6, claude-sonnet-4-6, etc.)
-f, --file <path>     # Read prompt from file
--session-id <id>     # Continue existing session
--skip-permissions-unsafe  # Bypass all checks (CI/isolated only)

# Autonomy levels
# (none)      Read-only - analysis, planning, no modifications
# --auto low  Safe file ops - create, edit, format
# --auto medium  Dev tasks - npm install, git commit (local), build
# --auto high  Full ops - git push, deployments, production changes
```

## Requirements

- **tmux** must be installed (`brew install tmux` on macOS)
- Factory Droid CLI must be in PATH

## Example Session

**User:** `/team 3:executor "fix all TypeScript errors in src/"`

```
[TEAM INITIALIZED]
┌─────────────────────────────────────────────────────────┐
│ Slug: fix-ts-errors                                     │
│ Workers: 3 (executor)                                   │
│ tmux session: omd-team-fix-ts-errors                    │
└─────────────────────────────────────────────────────────┘

[PHASE: team-plan]
Analyzing codebase...
Found 12 files with TypeScript errors.
Decomposed into 5 subtasks:
  - task-1: Fix errors in src/auth/ (3 files)
  - task-2: Fix errors in src/api/ (4 files)
  - task-3: Fix errors in src/utils/ (2 files)
  - task-4: Fix errors in src/types/ (2 files)
  - task-5: Fix errors in src/components/ (1 file)

[PHASE: team-exec]
Spawning 3 workers in tmux...

Attach to watch: tmux attach -t omd-team-fix-ts-errors

[MONITORING]
┌─────────────────────────────────────────────────────────┐
│ Tasks: 0/5 done, 3 in-progress, 2 pending              │
│ Workers: 3 active                                       │
├─────────────────────────────────────────────────────────┤
│ worker-1: [working] task-1 - Fix auth errors            │
│ worker-2: [working] task-2 - Fix API errors             │
│ worker-3: [working] task-3 - Fix utils errors           │
└─────────────────────────────────────────────────────────┘

... (time passes) ...

[PHASE: team-verify]
Running verification...
  ✓ tsc --noEmit: PASS (0 errors)
  ✓ npm test: PASS (42/42)

[COMPLETE]
┌─────────────────────────────────────────────────────────┐
│ Team "fix-ts-errors" completed successfully             │
│ Duration: 4m 32s                                        │
│ Tasks: 5/5 done                                         │
│ Workers used: 3                                         │
└─────────────────────────────────────────────────────────┘

Cleaned up tmux session and state files.
```

## Gotchas

1. **tmux required** - Skill fails gracefully if tmux not installed
2. **Worker isolation** - Workers should not modify same files concurrently
3. **Heartbeat important** - Workers must update status regularly
4. **File locking** - Use atomic writes for task status updates
5. **Cleanup on crash** - If lead crashes, run `/cancel` to clean up orphaned session
