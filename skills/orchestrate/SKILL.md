---
name: orchestrate
description: "Coordinate multi-agent task execution by delegating to specialist subagents, managing parallel workflows, and verifying completion through architect review. Handles investigation-to-PR cycles, codebase assessment, todo-driven progress tracking, and failure recovery. Use when a task requires breaking work across multiple agents, delegating frontend/backend/research to specialists, or managing a full GitHub issue-to-PR workflow."
---

# Orchestrate

Multi-agent orchestration workflow: assess codebase, delegate to specialists, verify with architect, ship.

Only implement when the user explicitly requests work. Do not begin implementation unprompted.

## Phase 0 - Intent Gate

On every message, check for matching skill triggers first. If a skill matches, invoke it immediately before any other action.

## Phase 1 - Codebase Assessment

Before following existing patterns, assess whether they are worth following.

**Quick assessment:**
1. Check config files (linter, formatter, type config)
2. Sample 2-3 similar files for consistency
3. Note project age signals (dependencies, patterns)

**Classify codebase state:**
- **Disciplined** (consistent patterns, configs, tests): Follow existing style strictly
- **Transitional** (mixed patterns, some structure): Ask which pattern to follow
- **Legacy/Chaotic** (no consistency): Propose conventions before proceeding
- **Greenfield** (new/empty): Apply modern best practices

Before assuming a codebase is undisciplined, verify: different patterns may be intentional, a migration may be in progress, or you may be looking at the wrong reference files.

## Phase 2A - Exploration & Research

Before every `omc_task` call, declare your reasoning:

```
I will use omc_task with:
- Category/Agent: [name]
- Reason: [why this choice fits]
- Skills (if any): [skill names]
- Expected Outcome: [what success looks like]
```

**Agent selection decision tree:**
1. Skill-triggering pattern? → Invoke skill
2. Visual/frontend? → `visual` category or `frontend-ui-ux-engineer`
3. Backend/architecture/logic? → `business-logic` category or `architect`
4. Documentation/writing? → `writer`
5. Exploration/search? → `explore` (internal) or `researcher` (external)

**Parallel execution is the default.** Explore and researcher agents run in background, never synchronously:

```typescript
// CORRECT: background, parallel, explicit model
Task(subagent_type="explore", model="claude-haiku-4-5-20251001", prompt="Find auth implementations...")
Task(subagent_type="researcher", model="claude-sonnet-4-5-20250929", prompt="Find JWT best practices...")
// Continue working immediately. Collect with background_output when needed.

// WRONG: blocking
result = task(...)  // Never wait synchronously for explore/researcher
```

## Phase 2B - Implementation

**Pre-implementation:**
1. Multi-step task → Create detailed todo list immediately (no announcements)
2. Mark each task `in_progress` before starting, `completed` immediately when done
3. Only create todos when the user has requested implementation

**Delegation prompt structure** (all 7 sections required):

```
1. TASK: Atomic, specific goal (one action per delegation)
2. EXPECTED OUTCOME: Concrete deliverables with success criteria
3. REQUIRED SKILLS: Which skill to invoke
4. REQUIRED TOOLS: Explicit tool whitelist
5. MUST DO: Exhaustive requirements — leave nothing implicit
6. MUST NOT DO: Forbidden actions — anticipate rogue behavior
7. CONTEXT: File paths, existing patterns, constraints
```

### GitHub Issue-to-PR Workflow

When mentioned in issues or asked to "look into" something and "create PR", this means a **complete work cycle**, not just investigation:

1. **Investigate**: Read issue/PR context, search codebase, identify root cause
2. **Implement**: Follow codebase patterns, add tests if applicable, verify with `lsp_diagnostics`
3. **Verify**: Run build and tests, check for regressions
4. **Create PR**: `gh pr create` with meaningful title, reference original issue

"Look into X and create PR" = investigate + implement + ship a PR.

### Code Change Rules
- Match existing patterns in disciplined codebases; propose approach first in chaotic ones
- Never suppress type errors (`as any`, `@ts-ignore`, `@ts-expect-error`)
- Never commit unless explicitly requested
- Bugfix rule: fix minimally, never refactor while fixing

### Verification

Run `lsp_diagnostics` on changed files at end of each logical task unit, before marking todos complete, and before reporting completion.

Run build/test commands at task completion if the project has them.

**Evidence requirements** — a task is not complete without:
- File edits: `lsp_diagnostics` clean on changed files
- Build: exit code 0
- Tests: passing (or explicit note of pre-existing failures)
- Delegation: agent result received and verified

## Phase 2C - Failure Recovery

1. Fix root causes, not symptoms
2. Re-verify after every fix attempt
3. Never shotgun debug (random changes hoping something works)

**After 3 consecutive failures:**
1. STOP all edits
2. REVERT to last known working state
3. DOCUMENT what was attempted and what failed
4. CONSULT Architect with full failure context
5. If Architect cannot resolve → ask the user

Never leave code in a broken state, continue hoping it will work, or delete failing tests.

## Phase 3 - Completion

**Self-check before declaring done:**
- [ ] All todo items marked complete
- [ ] Diagnostics clean on changed files
- [ ] Build passes (if applicable)
- [ ] User's original request fully addressed

**Architect verification is required before completion.** Invoke architect to review:

```
Task(subagent_type="architect", model="claude-opus-4-5-20251101", prompt="VERIFY COMPLETION REQUEST:
Original task: [describe]
What I implemented: [list changes]
Verification done: [tests run, builds checked]

Verify: 1) Fully addresses request? 2) Obvious bugs? 3) Missing edge cases? 4) Code quality?
Return: APPROVED or REJECTED with reasons.")
```

- **APPROVED** → declare complete
- **REJECTED** → address all issues, re-verify with architect

If verification fails on pre-existing issues: fix only your changes, note pre-existing problems separately.

Before delivering the final answer, cancel all running background tasks to conserve resources.

## Todo Management

Create todos before starting any multi-step task. This is the primary coordination mechanism.

**Workflow:**
1. On receiving a request: `todowrite` to plan atomic steps (only for user-requested implementation)
2. Before each step: mark `in_progress` (one at a time)
3. After each step: mark `completed` immediately (never batch)
4. On scope change: update todos before proceeding

**Clarification template** (when needed):

```
I want to make sure I understand correctly.

What I understood: [interpretation]
What I'm unsure about: [specific ambiguity]
Options:
1. [Option A] - [effort/implications]
2. [Option B] - [effort/implications]

My recommendation: [suggestion with reasoning]
```

## General Guidelines

- Prefer existing libraries over new dependencies
- Prefer small, focused changes over large refactors
- When uncertain about scope, ask
- Be concise: no preamble, no flattery, no status updates — just work
- If the user's approach seems problematic, state the concern and alternative concisely
