---
name: pipeline
description: Chain droids together in sequential or branching workflows with data passing for Android development
---

# Pipeline Skill

## Overview

The pipeline skill enables chaining multiple droids together in defined workflows where the output of one droid becomes the input to the next. This creates powerful droid pipelines similar to Unix pipes but designed for AI droid orchestration.

## Core Concepts

### 1. Sequential Pipelines

The simplest form: Droid A's output flows to Droid B, which flows to Droid C.

```
explore -> architect -> executor
```

**Flow:**
1. Explore droid searches codebase and produces findings
2. Architect receives findings and produces analysis/recommendations
3. Executor receives recommendations and implements changes

### 2. Branching Pipelines

Route to different droids based on output conditions.

```
explore -> {
  if "complex refactoring" -> architect -> executor-high
  if "simple change" -> executor-low
  if "UI work" -> designer -> executor
}
```

### 3. Parallel-Then-Merge Pipelines

Run multiple droids in parallel, merge their outputs.

```
parallel(explore, researcher) -> architect -> executor
```

## Built-in Pipeline Presets

### Review Pipeline
**Purpose:** Comprehensive code review and implementation

```
/pipeline review <task>
```

**Stages:**
1. `explore` - Find relevant code and patterns
2. `architect` - Analyze architecture and design implications
3. `critic` - Review and critique the analysis
4. `executor` - Implement with full context

**Use for:** Major features, refactorings, complex changes

---

### Implement Pipeline
**Purpose:** Planned implementation with testing

```
/pipeline implement <task>
```

**Stages:**
1. `planner` - Create detailed implementation plan
2. `executor` - Implement the plan
3. `tdd-guide` - Add/verify tests

**Use for:** New features with clear requirements

---

### Debug Pipeline
**Purpose:** Systematic debugging workflow

```
/pipeline debug <issue>
```

**Stages:**
1. `explore` - Locate error locations and related code
2. `architect` - Analyze root cause
3. `build-fixer` - Apply fixes and verify

**Use for:** Bugs, build errors, test failures, Gradle issues

---

### Research Pipeline
**Purpose:** External research + internal analysis

```
/pipeline research <topic>
```

**Stages:**
1. `parallel(researcher, explore)` - External docs + internal code
2. `architect` - Synthesize findings
3. `writer` - Document recommendations

**Use for:** Technology decisions, API integrations, library evaluations

---

### Refactor Pipeline
**Purpose:** Safe, verified refactoring

```
/pipeline refactor <target>
```

**Stages:**
1. `explore` - Find all usages and dependencies
2. `architect-medium` - Design refactoring strategy
3. `executor-high` - Execute refactoring
4. `qa-tester` - Verify no regressions

**Use for:** Architectural changes, API redesigns, module restructuring

---

### Security Pipeline
**Purpose:** Security audit and fixes

```
/pipeline security <scope>
```

**Stages:**
1. `explore` - Find potential vulnerabilities
2. `security-reviewer` - Audit and identify issues
3. `executor` - Implement fixes
4. `security-reviewer-low` - Re-verify

**Use for:** Security reviews, vulnerability fixes, permission audits

---

### Build Pipeline
**Purpose:** Fix build issues systematically

```
/pipeline build <issue>
```

**Stages:**
1. `explore` - Identify build configuration issues
2. `build-fixer` - Fix Gradle and dependency issues
3. `qa-tester` - Verify build succeeds

**Use for:** Gradle sync errors, dependency conflicts, build configuration

---

## Custom Pipeline Syntax

### Basic Sequential

```
/pipeline droid1 -> droid2 -> droid3 "task description"
```

**Example:**
```
/pipeline explore -> architect -> executor "add offline sync"
```

### With Model Specification

```
/pipeline explore:haiku -> architect:opus -> executor:sonnet "optimize performance"
```

### With Branching

```
/pipeline explore -> (
  complexity:high -> architect:opus -> executor-high:opus
  complexity:medium -> executor:sonnet
  complexity:low -> executor-low:haiku
) "fix reported issues"
```

### With Parallel Stages

```
/pipeline [explore, researcher] -> architect -> executor "implement GraphQL"
```

## Data Passing Protocol

Each droid in the pipeline receives structured context from the previous stage:

```json
{
  "pipeline_context": {
    "original_task": "user's original request",
    "previous_stages": [
      {
        "droid": "explore",
        "model": "haiku",
        "findings": "...",
        "files_identified": ["app/src/main/java/com/app/MainActivity.kt"]
      }
    ],
    "current_stage": "architect",
    "next_stage": "executor"
  },
  "task": "specific task for this droid"
}
```

## Error Handling

### Retry Logic

When a droid fails, the pipeline can:

1. **Retry** - Re-run the same droid (up to 3 times)
2. **Skip** - Continue to next stage with partial output
3. **Abort** - Stop entire pipeline
4. **Fallback** - Route to alternative droid

**Configuration:**

```
/pipeline explore -> architect -> executor --retry=3 --on-error=abort
```

### Error Recovery Patterns

**Pattern 1: Fallback to Higher Tier**
```
executor-low -> on-error -> executor:sonnet
```

**Pattern 2: Consult Architect**
```
executor -> on-error -> architect -> executor
```

**Pattern 3: Human-in-the-Loop**
```
any-stage -> on-error -> pause-for-user-input
```

## Pipeline State Management

Pipelines maintain state in `.omd/pipeline-state.json`:

```json
{
  "pipeline_id": "uuid",
  "name": "review",
  "active": true,
  "current_stage": 2,
  "stages": [
    {
      "name": "explore",
      "droid": "explore",
      "model": "haiku",
      "status": "completed",
      "output": "..."
    },
    {
      "name": "architect",
      "droid": "architect",
      "model": "opus",
      "status": "in_progress",
      "started_at": "2026-01-26T10:30:00Z"
    },
    {
      "name": "executor",
      "droid": "executor",
      "model": "sonnet",
      "status": "pending"
    }
  ],
  "task": "original user task",
  "created_at": "2026-01-26T10:25:00Z"
}
```

## Verification Rules

Before pipeline completion, verify:

- [ ] All stages completed successfully
- [ ] Output from final stage addresses original task
- [ ] No unhandled errors in any stage
- [ ] All files modified pass lsp_diagnostics
- [ ] Tests pass (if applicable)
- [ ] App builds successfully (./gradlew assembleDebug)

## Advanced Features

### Conditional Branching

Based on droid output, route to different paths:

```
explore -> {
  if files_found > 5 -> architect:opus -> executor-high:opus
  if files_found <= 5 -> executor:sonnet
}
```

### Loop Constructs

Repeat stages until condition met:

```
repeat_until(tests_pass) {
  executor -> qa-tester
}
```

### Merge Strategies

When parallel droids complete:

- **concat**: Concatenate all outputs
- **summarize**: Use architect to summarize findings
- **vote**: Use critic to choose best output

## Usage Examples

### Example 1: Feature Implementation
```
/pipeline review "add pull-to-refresh with Material Design"
```
→ Triggers: explore → architect → critic → executor

### Example 2: Bug Fix
```
/pipeline debug "app crashes on rotation"
```
→ Triggers: explore → architect → build-fixer

### Example 3: Custom Chain
```
/pipeline explore:haiku -> architect:opus -> executor:sonnet -> tdd-guide:sonnet "refactor ViewModel layer"
```

### Example 4: Research-Driven Implementation
```
/pipeline research "implement WorkManager for background sync"
```
→ Triggers: parallel(researcher, explore) → architect → writer

## Cancellation

Stop active pipeline:

```
/pipeline cancel
```

Or use the general cancel command which detects active pipeline.

## Integration with Other Skills

Pipelines can be used within other skills:

- **Ralph**: Loop pipelines until verified complete
- **Ultrawork**: Run multiple pipelines in parallel
- **Autopilot**: Use pipelines as building blocks

## Best Practices

1. **Start with presets** - Use built-in pipelines before creating custom ones
2. **Match model to complexity** - Don't waste opus on simple tasks
3. **Keep stages focused** - Each droid should have one clear responsibility
4. **Use parallel stages** - Run independent work simultaneously
5. **Verify at checkpoints** - Use architect or critic to verify progress
6. **Document custom pipelines** - Save successful patterns for reuse

## Troubleshooting

### Pipeline Hangs

**Check:** `.omd/pipeline-state.json` for current stage
**Fix:** Resume with `/pipeline resume` or cancel and restart

### Droid Fails Repeatedly

**Check:** Retry count and error messages
**Fix:** Route to higher-tier droid or add architect consultation

### Output Not Flowing

**Check:** Data passing structure in droid prompts
**Fix:** Ensure each droid is prompted with `pipeline_context`

## Technical Implementation

The pipeline orchestrator:

1. **Parses pipeline definition** - Validates syntax and droid names
2. **Initializes state** - Creates pipeline-state.json
3. **Executes stages sequentially** - Spawns droids with Task tool
4. **Passes context between stages** - Structures output for next droid
5. **Handles branching logic** - Evaluates conditions and routes
6. **Manages parallel execution** - Spawns concurrent droids and merges
7. **Persists state** - Updates state file after each stage
8. **Enforces verification** - Runs checks before completion

## Skill Invocation

This skill activates when:

- User types `/pipeline` command
- User mentions "droid chain", "workflow", "pipe droids"
- Pattern detected: "X then Y then Z" with droid names

**Explicit invocation:**
```
/oh-my-droid:pipeline review "task"
```

**Auto-detection:**
```
"First explore the codebase, then architect should analyze it, then executor implements"
```
→ Automatically creates pipeline: explore → architect → executor
