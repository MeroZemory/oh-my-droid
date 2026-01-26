---
name: ultrapilot
description: Parallel autopilot with file ownership partitioning for Android projects
---

# Ultrapilot Skill

Parallel autopilot that spawns multiple workers with file ownership partitioning for maximum speed.

## Overview

Ultrapilot is the parallel evolution of autopilot. It decomposes your task into independent parallelizable subtasks, assigns non-overlapping file sets to each worker, and runs them simultaneously.

**Key Capabilities:**
1. **Decomposes** task into parallel-safe components
2. **Partitions** files with exclusive ownership (no conflicts)
3. **Spawns** up to 5 parallel workers (Claude Code limit)
4. **Coordinates** progress via TaskOutput
5. **Integrates** changes with sequential handling of shared files
6. **Validates** full system integrity

**Speed Multiplier:** Up to 5x faster than sequential autopilot for suitable tasks.

## Usage

```
/oh-my-droid:ultrapilot <your task>
/oh-my-droid:up "Build a news reader app with Compose"
/oh-my-droid:ultrapilot Refactor the entire data layer
```

## Magic Keywords

These phrases auto-activate ultrapilot:
- "ultrapilot", "ultra pilot"
- "parallel build", "parallel autopilot"
- "swarm build", "swarm mode"
- "fast parallel", "ultra fast"

## When to Use

**Ultrapilot Excels At:**
- Multi-module Android projects (app, data, domain, presentation)
- Independent feature additions across different packages
- Large refactorings with clear module boundaries
- Parallel test file generation
- Multi-screen implementations (HomeScreen, DetailScreen, etc.)

**Autopilot Better For:**
- Single-threaded sequential tasks
- Heavy interdependencies between components
- Tasks requiring constant integration checks
- Small focused features in a single module

## Architecture

```
User Input: "Build a news reader app"
           |
           v
  [ULTRAPILOT COORDINATOR]
           |
   Decomposition + File Partitioning
           |
   +-------+-------+-------+-------+
   |       |       |       |       |
   v       v       v       v       v
[W-1]   [W-2]   [W-3]   [W-4]   [W-5]
data    domain   ui     network  tests
(data/) (domain/) (ui/) (network/) (test/)
   |       |       |       |       |
   +---+---+---+---+---+---+---+---+
       |
       v
  [INTEGRATION PHASE]
  (shared files: build.gradle, AndroidManifest.xml)
       |
       v
  [VALIDATION PHASE]
  (full system build and test)
```

## Phases

### Phase 0: Task Analysis

**Goal:** Determine if task is parallelizable

**Checks:**
- Can task be split into 2+ independent subtasks?
- Are module/package boundaries clear?
- Are dependencies minimal?

**Output:** Go/No-Go decision (falls back to autopilot if unsuitable)

### Phase 1: Decomposition

**Goal:** Break task into parallel-safe subtasks

**Droid:** Architect (Opus)

**Process:**
1. Analyze task requirements
2. Identify independent components (modules, packages, screens)
3. Define subtask boundaries
4. Specify file ownership for each
5. Identify shared files (handled last)

**Output:** `.omd/ultrapilot/decomposition.json`

```json
{
  "subtasks": [
    {
      "id": "worker-1",
      "description": "Data layer with Room database",
      "files": ["app/src/main/java/com/app/data/**"],
      "dependencies": []
    },
    {
      "id": "worker-2",
      "description": "UI layer with Compose screens",
      "files": ["app/src/main/java/com/app/ui/**"],
      "dependencies": []
    }
  ],
  "sharedFiles": [
    "app/build.gradle.kts",
    "app/src/main/AndroidManifest.xml",
    "gradle/libs.versions.toml"
  ]
}
```

### Phase 2: File Ownership Partitioning

**Goal:** Assign exclusive file sets to workers

**Rules:**
1. **Exclusive ownership** - No file in multiple worker sets
2. **Shared files deferred** - Handled sequentially in integration
3. **Boundary files tracked** - Files that import across boundaries

**Data Structure:** `.omd/state/ultrapilot-ownership.json`

```json
{
  "sessionId": "ultrapilot-20260126-1234",
  "workers": {
    "worker-1": {
      "ownedFiles": ["app/src/main/java/com/app/data/AppDatabase.kt"],
      "ownedGlobs": ["app/src/main/java/com/app/data/**"],
      "boundaryImports": ["app/src/main/java/com/app/model/Note.kt"]
    },
    "worker-2": {
      "ownedFiles": ["app/src/main/java/com/app/ui/NoteScreen.kt"],
      "ownedGlobs": ["app/src/main/java/com/app/ui/**"],
      "boundaryImports": ["app/src/main/java/com/app/model/Note.kt"]
    }
  },
  "sharedFiles": ["app/build.gradle.kts", "app/src/main/java/com/app/model/Note.kt"],
  "conflictPolicy": "coordinator-handles"
}
```

### Phase 3: Parallel Execution

**Goal:** Run all workers simultaneously

**Spawn Workers:**
```javascript
// Pseudocode
workers = [];
for (subtask in decomposition.subtasks) {
  workers.push(
    Task(
      subagent_type: "oh-my-droid:executor",
      model: "sonnet",
      prompt: `ULTRAPILOT WORKER ${subtask.id}

Your exclusive file ownership: ${subtask.files}

Task: ${subtask.description}

CRITICAL RULES:
1. ONLY modify files in your ownership set
2. If you need to modify a shared file, document the change in your output
3. Do NOT create new files outside your ownership
4. Track all imports from boundary files

Deliver: Code changes + list of boundary dependencies`,
      run_in_background: true
    )
  );
}
```

**Monitoring:**
- Poll TaskOutput for each worker
- Track completion status
- Detect conflicts early
- Accumulate boundary dependencies

**Max Workers:** 5 (Claude Code limit)

### Phase 4: Integration

**Goal:** Merge all worker changes and handle shared files

**Process:**
1. **Collect outputs** - Gather all worker deliverables
2. **Detect conflicts** - Check for unexpected overlaps
3. **Handle shared files** - Sequential updates to build.gradle, AndroidManifest.xml
4. **Integrate boundary files** - Merge model classes, shared utilities
5. **Resolve imports** - Ensure cross-boundary imports are valid

**Droid:** Executor (Sonnet) - sequential processing

**Conflict Resolution:**
- If workers unexpectedly touched same file → manual merge
- If shared file needs multiple changes → sequential apply
- If boundary file changed → validate all dependent workers

### Phase 5: Validation

**Goal:** Verify integrated system works

**Checks (parallel):**
1. **Build** - `./gradlew assembleDebug`
2. **Lint** - `./gradlew lint`
3. **Test** - `./gradlew test`
4. **APK generation** - Verify APK is installable

**Droids (parallel):**
- Build-fixer (Sonnet) - Fix build errors
- Architect (Opus) - Functional completeness
- Security-reviewer (Opus) - Cross-component vulnerabilities

**Retry Policy:** Up to 3 validation rounds. If failures persist, detailed error report to user.

## Configuration

Optional settings in `.claude/settings.json`:

```json
{
  "omd": {
    "ultrapilot": {
      "maxWorkers": 5,
      "maxValidationRounds": 3,
      "conflictPolicy": "coordinator-handles",
      "fallbackToAutopilot": true,
      "parallelThreshold": 2,
      "pauseAfterDecomposition": false,
      "verboseProgress": true
    }
  }
}
```

**Settings Explained:**
- `maxWorkers` - Max parallel workers (5 is Claude Code limit)
- `maxValidationRounds` - Validation retry attempts
- `conflictPolicy` - "coordinator-handles" or "abort-on-conflict"
- `fallbackToAutopilot` - Auto-switch if task not parallelizable
- `parallelThreshold` - Min subtasks to use ultrapilot (else fallback)
- `pauseAfterDecomposition` - Confirm with user before execution
- `verboseProgress` - Show detailed worker progress

## Examples

### Example 1: Multi-Module App

```
/oh-my-droid:ultrapilot Build a note-taking app with Compose, Room, and MVVM
```

**Workers:**
1. Data layer (data/)
2. Domain layer (domain/)
3. UI layer (ui/)
4. Tests (test/)

**Shared Files:** build.gradle.kts, AndroidManifest.xml

**Duration:** ~15 minutes (vs ~75 minutes sequential)

### Example 2: Multi-Screen Implementation

```
/oh-my-droid:up Add Home, Detail, and Settings screens with navigation
```

**Workers:**
1. HomeScreen + ViewModel
2. DetailScreen + ViewModel
3. SettingsScreen + ViewModel
4. Navigation graph

**Shared Files:** MainActivity.kt, NavHost setup

**Duration:** ~8 minutes (vs ~32 minutes sequential)

## Shared File Patterns

Automatically classified as shared:
- `build.gradle.kts`, `build.gradle`, `settings.gradle.kts`
- `gradle.properties`, `gradle/libs.versions.toml`
- `AndroidManifest.xml`
- `proguard-rules.pro`
- `README.md`, `CONTRIBUTING.md`
- Root-level configuration files

## Troubleshooting

**Decomposition fails?**
- Task may be too coupled
- Fallback to autopilot triggered automatically
- Review `.omd/ultrapilot/decomposition.json` for details

**Worker hangs?**
- Check worker logs in `.omd/logs/ultrapilot-worker-N.log`
- Cancel and restart that worker
- May indicate file ownership issue

**Integration conflicts?**
- Review `.omd/ultrapilot-state.json` conflicts array
- Check if shared files were unexpectedly modified
- Adjust ownership rules if needed

**Build failures after integration?**
- Cross-component dependency issue
- Review boundary imports
- May need sequential retry with full context

## Differences from Autopilot

| Feature | Autopilot | Ultrapilot |
|---------|-----------|------------|
| Execution | Sequential | Parallel (up to 5x) |
| Best For | Single-threaded tasks | Multi-component systems |
| Complexity | Lower | Higher |
| Speed | Standard | 3-5x faster (suitable tasks) |
| File Conflicts | N/A | Ownership partitioning |
| Fallback | N/A | Can fallback to autopilot |
| Setup | Instant | Decomposition phase (~1-2 min) |

**Rule of Thumb:** If task has 3+ independent components, use ultrapilot. Otherwise, use autopilot.
