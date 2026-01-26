---
name: swarm
description: N coordinated droids on shared task list with atomic claiming for Android development
---

# Swarm Skill

Spawn N coordinated droids working on a shared task list with atomic claiming. Like a dev team tackling multiple files in parallel.

## Usage

```
/swarm N:droid-type "task description"
```

### Parameters

- **N** - Number of droids (1-5, enforced by Claude Code limit)
- **droid-type** - Droid to spawn (e.g., executor, build-fixer, architect)
- **task** - High-level task to decompose and distribute

### Examples

```bash
/swarm 5:executor "fix all Kotlin compilation errors"
/swarm 3:build-fixer "fix all Gradle sync errors"
/swarm 4:designer "implement Material Design 3 for all screens"
/swarm 2:architect "analyze and document all ViewModels"
```

## Architecture

```
User: "/swarm 5:executor fix all Kotlin errors"
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
   [SHARED TASK LIST]
   - Fix MainActivity.kt (claimed E1)
   - Fix NoteViewModel.kt (done E2)
   - Fix AppDatabase.kt (claimed E3)
   - Fix Repository.kt (pending)
   ...
```

## Workflow

### 1. Parse Input
- Extract N (droid count)
- Extract droid-type
- Extract task description
- Validate N <= 5

### 2. Create Task List
- Analyze codebase based on task
- Break into file-specific subtasks
- Initialize shared task list with all subtasks
- Each task gets: id, file, description, status, owner, timestamp

### 3. Spawn Droids
- Launch N droids via Task tool
- Set `run_in_background: true` for all
- Each droid gets:
  - Reference to shared task list
  - Claiming protocol instructions
  - Completion criteria

### 4. Task Claiming Protocol
Each droid follows this loop:

```
LOOP:
  1. Read swarm-tasks.json
  2. Find first pending task
  3. Atomically claim task (check status, set to claimed, add owner)
  4. Execute task
  5. Mark task as done
  6. GOTO LOOP (until no pending tasks)
```

**Atomic Claiming:**
- Read current task status
- If still "pending", claim it
- If someone else claimed, try next task
- Timeout: 5 minutes per task
- If timeout exceeded, task auto-releases to pending

### 5. Progress Tracking
- Orchestrator monitors via TaskOutput
- Shows live progress: claimed/done/pending counts
- Reports which droid is working on which file
- Detects idle droids (all tasks claimed by others)

### 6. Completion
Exit when ANY of:
- All tasks marked "done"
- All droids idle (no pending tasks)
- User cancels via `/cancel-swarm`

## State Files

### `.omd/swarm-state.json`
Session-level state:

```json
{
  "session_id": "swarm-20260126-143022",
  "droid_count": 5,
  "droid_type": "executor",
  "task_description": "fix all Kotlin compilation errors",
  "status": "active",
  "started_at": "2026-01-26T14:30:22Z",
  "droids": [
    {"id": "droid-1", "background_task_id": "task_abc123", "status": "working"},
    {"id": "droid-2", "background_task_id": "task_def456", "status": "working"}
  ]
}
```

### `.omd/state/swarm-tasks.json`
Shared task list with atomic claiming:

```json
{
  "tasks": [
    {
      "id": "task-001",
      "file": "app/src/main/java/com/app/MainActivity.kt",
      "description": "Fix null safety type error",
      "status": "claimed",
      "owner": "droid-1",
      "claimed_at": "2026-01-26T14:30:25Z",
      "timeout_at": "2026-01-26T14:35:25Z"
    },
    {
      "id": "task-002",
      "file": "app/src/main/java/com/app/ui/NoteScreen.kt",
      "description": "Fix missing import",
      "status": "done",
      "owner": "droid-2",
      "claimed_at": "2026-01-26T14:30:26Z",
      "completed_at": "2026-01-26T14:32:15Z"
    },
    {
      "id": "task-003",
      "file": "app/src/main/java/com/app/data/Repository.kt",
      "description": "Add return type annotation",
      "status": "pending",
      "owner": null,
      "claimed_at": null,
      "timeout_at": null
    }
  ],
  "stats": {
    "total": 15,
    "pending": 8,
    "claimed": 5,
    "done": 2
  }
}
```

## Task Claiming Protocol (Detailed)

### Atomic Claim Operation

```javascript
// Pseudo-code for droid claiming
function claimTask() {
  const tasks = readJSON('.omd/state/swarm-tasks.json');

  for (const task of tasks.tasks) {
    if (task.status === 'pending') {
      // Attempt atomic claim
      const now = new Date().toISOString();
      const timeout = addMinutes(now, 5).toISOString();

      task.status = 'claimed';
      task.owner = droidId;
      task.claimed_at = now;
      task.timeout_at = timeout;

      writeJSON('.omd/state/swarm-tasks.json', tasks);
      return task;
    }
  }

  return null; // No pending tasks
}
```

### Timeout Auto-Release

Orchestrator periodically checks for timed-out claims:

```javascript
function releaseTimedOutTasks() {
  const tasks = readJSON('.omd/state/swarm-tasks.json');
  const now = new Date();

  for (const task of tasks.tasks) {
    if (task.status === 'claimed' && new Date(task.timeout_at) < now) {
      task.status = 'pending';
      task.owner = null;
      task.claimed_at = null;
      task.timeout_at = null;
      // Log timeout event
    }
  }

  writeJSON('.omd/state/swarm-tasks.json', tasks);
}
```

## Droid Instructions Template

Each spawned droid receives these instructions:

```markdown
You are droid {id} in a swarm of {N} {droid-type} droids.

**Your Task:** {task_description}

**Shared Task List:** .omd/state/swarm-tasks.json

**Your Loop:**
1. Read swarm-tasks.json
2. Find first task with status="pending"
3. Claim it atomically (set status="claimed", owner="{id}", timestamp)
4. Execute the task
5. Mark status="done", set completed_at
6. Repeat until no pending tasks

**Claiming Protocol:**
- Read file, check status="pending"
- Update status="claimed", add your ID
- Set timeout_at = now + 5 minutes
- Write file back
- If file changed between read/write, retry

**Completion:**
When no pending tasks remain, exit cleanly.

**Reporting:**
Update your progress in swarm-state.json under droids[{id}].status
```

## Constraints

- **Max Droids:** 5 (enforced by Claude Code background task limit)
- **Claim Timeout:** 5 minutes per task
- **Heartbeat:** Droids should update heartbeat every 60 seconds
- **Auto-Release:** Timed-out claims automatically released by orchestrator

## Error Handling

- **Droid Crash:** Task auto-releases after timeout
- **State Corruption:** Orchestrator validates and repairs on each cycle
- **No Pending Tasks:** Droid exits cleanly
- **All Droids Idle:** Orchestrator detects and concludes session

## Cancel Swarm

User can cancel via `/cancel-swarm`:
- Stops orchestrator monitoring
- Signals all background droids to exit
- Preserves partial progress in swarm-tasks.json
- Marks session as "cancelled" in swarm-state.json

## Use Cases

### 1. Fix All Compilation Errors
```
/swarm 5:executor "fix all Kotlin compilation errors"
```
Spawns 5 executors, each claiming and fixing individual files.

### 2. Implement UI Components
```
/swarm 3:designer "implement Material Design 3 for all screens"
```
Spawns 3 designers, each styling different screen files.

### 3. Fix Gradle Issues
```
/swarm 4:build-fixer "fix all Gradle sync errors"
```
Spawns 4 build-fixers, each handling different build.gradle files or dependencies.

### 4. Documentation Sprint
```
/swarm 2:writer "add KDoc comments to all ViewModels"
```
Spawns 2 writers, each documenting different ViewModel files.

## Benefits

- **Parallel Execution:** N droids work simultaneously
- **Auto-Balancing:** Fast droids claim more tasks
- **Fault Tolerance:** Timeouts and auto-release prevent deadlocks
- **Progress Visibility:** Live stats on claimed/done/pending
- **Scalable:** Works for 10s to 100s of subtasks

## Implementation Notes

The orchestrator (main skill handler) is responsible for:
1. Initial task decomposition (via explore/architect)
2. Creating state files
3. Spawning N background droids
4. Monitoring progress via TaskOutput
5. Enforcing timeouts and auto-release
6. Detecting completion conditions
7. Reporting final summary

Each droid is a standard Task invocation with:
- `run_in_background: true`
- Droid-specific prompt with claiming instructions
- Reference to shared state files
