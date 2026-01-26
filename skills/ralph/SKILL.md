---
name: ralph
description: Self-referential loop until task completion with architect verification
---

# Ralph Skill

[RALPH + ULTRAWORK - ITERATION {{ITERATION}}/{{MAX}}]

Your previous attempt did not output the completion promise. Continue working on the task.

## PRD MODE (OPTIONAL)

If the user provides the `--prd` flag, initialize a PRD (Product Requirements Document) BEFORE starting the ralph loop.

### Detecting PRD Mode

Check if `{{PROMPT}}` contains the flag pattern: `--prd` or `--PRD`

### PRD Initialization Workflow

When `--prd` flag detected:

1. **Create PRD File Structure** (`.omd/prd.json` and `.omd/progress.txt`)
2. **Parse the task** (everything after `--prd` flag)
3. **Break down into user stories** with this structure:

```json
{
  "project": "[Project Name]",
  "branchName": "ralph/[feature-name]",
  "description": "[Feature description]",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Short title]",
      "description": "As a [user], I want to [action] so that [benefit].",
      "acceptanceCriteria": ["Criterion 1", "App builds successfully"],
      "priority": 1,
      "passes": false
    }
  ]
}
```

4. **Create progress.txt**:

```
# Ralph Progress Log
Started: [ISO timestamp]

## Codebase Patterns
(No patterns discovered yet)

---
```

5. **Guidelines for PRD creation**:
   - Right-sized stories: Each completable in one focused session
   - Verifiable criteria: Include "App builds successfully", "Tests pass"
   - Independent stories: Minimize dependencies
   - Priority order: Foundational work (Models, Gradle) before UI

6. **After PRD created**: Proceed to normal ralph loop execution using the user stories as your task list

### Example Usage

User input: `--prd build a todo app with Kotlin and Jetpack Compose`

Your workflow:
1. Detect `--prd` flag
2. Extract task: "build a todo app with Kotlin and Jetpack Compose"
3. Create `.omd/prd.json` with user stories
4. Create `.omd/progress.txt`
5. Begin ralph loop using user stories as task breakdown

## ULTRAWORK MODE (AUTO-ACTIVATED)

Ralph automatically activates Ultrawork for maximum parallel execution. You MUST follow these rules:

### Parallel Execution Rules
- **PARALLEL**: Fire independent calls simultaneously - NEVER wait sequentially
- **BACKGROUND FIRST**: Use Task(run_in_background=true) for long operations (10+ concurrent)
- **DELEGATE**: Route tasks to specialist droids immediately

### Smart Model Routing (SAVE TOKENS)

| Task Complexity | Tier | Examples |
|-----------------|------|----------|
| Simple lookups | LOW (haiku) | "What does this function return?", "Find where X is defined" |
| Standard work | MEDIUM (sonnet) | "Add error handling", "Implement this feature" |
| Complex analysis | HIGH (opus) | "Debug this race condition", "Refactor auth module" |

### Available Droids by Tier

| Domain | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **Analysis** | `architect-low` | `architect-medium` | `architect` |
| **Execution** | `executor-low` | `executor` | `executor-high` |
| **Search** | `explore` | `explore-medium` | - |
| **Research** | `researcher-low` | `researcher` | - |
| **Frontend** | `designer-low` | `designer` | `designer-high` |
| **Docs** | `writer` | - | - |
| **Visual** | - | `vision` | - |
| **Planning** | - | - | `planner` |
| **Critique** | - | - | `critic` |
| **Pre-Planning** | - | - | `analyst` |
| **Testing** | - | `qa-tester` | - |
| **Security** | `security-reviewer-low` | - | `security-reviewer` |
| **Build** | `build-fixer-low` | `build-fixer` | - |
| **TDD** | `tdd-guide-low` | `tdd-guide` | - |
| **Code Review** | `code-reviewer-low` | - | `code-reviewer` |

**CRITICAL: Always pass `model` parameter explicitly!**
```
Task(subagent_type="oh-my-droid:architect-low", model="haiku", prompt="...")
Task(subagent_type="oh-my-droid:executor", model="sonnet", prompt="...")
Task(subagent_type="oh-my-droid:architect", model="opus", prompt="...")
```

### Background Execution Rules

**Run in Background** (set `run_in_background: true`):
- Package installation: npm install, pip install, gradle build
- Build processes: ./gradlew assembleDebug, npm run build
- Test suites: ./gradlew test, npm test, pytest
- APK/AAB builds: ./gradlew assembleRelease, bundleRelease

**Run Blocking** (foreground):
- Quick status checks: git status, ls, pwd
- File reads, edits
- Simple commands

## COMPLETION REQUIREMENTS

Before claiming completion, you MUST:
1. Verify ALL requirements from the original task are met
2. Ensure no partial implementations
3. Check that code compiles/runs without errors
4. Verify tests pass (if applicable)
5. TODO LIST: Zero pending/in_progress tasks
6. APK/AAB: Builds successfully (for Android projects)

## VERIFICATION BEFORE COMPLETION (IRON LAW)

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE**

Before outputting the completion promise:

### Steps (MANDATORY)
1. **IDENTIFY**: What command proves the task is complete?
2. **RUN**: Execute verification (test, build, lint)
3. **READ**: Check output - did it actually pass?
4. **ONLY THEN**: Proceed to Architect verification

### Red Flags (STOP and verify)
- Using "should", "probably", "seems to"
- About to output completion without fresh evidence
- Expressing satisfaction before verification

### Evidence Chain
1. Fresh test run output showing pass
2. Fresh build output showing success (./gradlew assembleDebug for Android)
3. lsp_diagnostics showing 0 errors
4. THEN Architect verification
5. THEN completion promise

**Skipping verification = Task NOT complete**

## ARCHITECT VERIFICATION (MANDATORY)

When you believe the task is complete:
1. **First**, spawn Architect to verify your work (ALWAYS pass model explicitly!):
   ```
   Task(subagent_type="oh-my-droid:architect", model="opus", prompt="Verify this implementation is complete: [describe what you did]")
   ```

2. **Wait for Architect's assessment**

3. **If Architect approves**: Output `<promise>{{PROMISE}}</promise>`
4. **If Architect finds issues**: Fix them, then repeat verification

DO NOT output the completion promise without Architect verification.

## ZERO TOLERANCE

- NO Scope Reduction - deliver FULL implementation
- NO Partial Completion - finish 100%
- NO Premature Stopping - ALL TODOs must be complete
- NO TEST DELETION - fix code, not tests

## INSTRUCTIONS

- Review your progress so far
- Continue from where you left off
- Use parallel execution and background tasks
- When FULLY complete AND Architect verified, output: <promise>{{PROMISE}}</promise>
- Do not stop until the task is truly done

Original task:
{{PROMPT}}
