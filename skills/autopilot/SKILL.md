---
name: autopilot
description: "Expand a product idea into a spec, plan implementation with critic validation, execute code across parallel agents, run iterative QA cycles, and perform multi-reviewer validation. Use when the user provides a feature description or project idea and wants end-to-end autonomous implementation without manual phase transitions."
---

# Autopilot

Take a product idea or feature description and autonomously expand it into a specification, plan the implementation, execute code generation with parallel agents, run QA cycles until tests pass, and validate with multi-perspective review.

## Trigger Phrases

Activate via command or natural language:

```
/autopilot <description>
/ap <description>
```

Also activates on: "autopilot", "auto pilot", "autonomous", "build me", "create me", "make me", "full auto", "handle it all", "I want a/an..."

## Workflow

### Phase 0: Expansion — Idea to Spec

1. Analyst agent (Opus) extracts functional requirements, user stories, constraints, and acceptance criteria from the user's input
2. Architect agent (Opus) produces a technical specification with stack choices, data models, API contracts, and component boundaries
3. Write combined spec to `.omd/autopilot/spec.md`

**Checkpoint:** Verify spec contains at least: functional requirements list, technical stack decision, data model outline, and API surface. If any are missing, loop Analyst and Architect until complete. If `pauseAfterExpansion` is true, present the spec to the user and wait for confirmation before proceeding.

### Phase 1: Planning — Spec to Implementation Plan

1. Architect agent (Opus) reads the spec from `.omd/autopilot/spec.md` and generates a task-level implementation plan with dependency ordering and complexity labels (low/standard/high)
2. Critic agent (Opus) reviews the plan for gaps, circular dependencies, missing edge cases, and unrealistic task scoping
3. Architect revises based on Critic feedback
4. Write final plan to `.omd/plans/autopilot-impl.md`

**Checkpoint:** Verify plan contains: ordered task list with complexity labels, no circular dependencies flagged by Critic, and all spec requirements mapped to at least one task. If `pauseAfterPlanning` is true, present the plan to the user and wait for confirmation.

### Phase 2: Execution — Plan to Code

Route tasks from the plan to agents by complexity using Ralph (persistence) + Ultrawork (parallelism):

| Complexity | Agent | Model |
|-----------|-------|-------|
| Low | Executor-low | Haiku |
| Standard | Executor | Sonnet |
| High | Executor-high | Opus |

Each agent implements its assigned tasks, writes files, and marks tasks complete in the plan state.

**Checkpoint:** After all tasks complete, verify every task in `.omd/plans/autopilot-impl.md` is marked done. If any remain incomplete after `maxIterations` (default: 10), report which tasks failed and why.

### Phase 3: QA — Iterative Test Cycles

Run UltraQA cycles (max `maxQaCycles`, default: 5):

1. Run the project build command. On failure, fix build errors and restart cycle.
2. Run linter. On failure, fix lint issues and restart cycle.
3. Run test suite. On failure, analyze test output, fix failing code, and restart cycle.
4. If all three pass, proceed to Phase 4.

**Checkpoint:** If the same error recurs 3 consecutive times, stop cycling — this indicates a design-level issue. Report the recurring error pattern and suggest the user refine requirements. Skip this phase if `skipQa` is true.

### Phase 4: Validation — Multi-Reviewer Approval

Run three reviewers in parallel:

- **Architect reviewer** — checks all spec requirements are implemented, no missing features
- **Security reviewer** — scans for common vulnerabilities (injection, auth bypass, secrets in code, insecure defaults)
- **Code reviewer** — evaluates code quality, naming consistency, error handling, test coverage

**Gate:** All three must return APPROVE. On rejection:
1. Collect all rejection reasons
2. Fix the identified issues
3. Re-run only the reviewers that rejected
4. Repeat up to `maxValidationRounds` (default: 3)

Skip this phase if `skipValidation` is true.

## State Cleanup on Completion

When all phases complete successfully (validation passed), delete state files to ensure clean future sessions:

```bash
rm -f .omd/state/autopilot-state.json
rm -f .omd/state/ralph-state.json
rm -f .omd/state/ultrawork-state.json
rm -f .omd/state/ultraqa-state.json
```

**Safeguard:** Only delete state files when the final phase status is `complete` with all reviewers approved. Never delete state files on cancellation, failure, or partial completion — the user may want to resume.

## Configuration

Optional settings in `.factory/settings.json`:

```json
{
  "omd": {
    "autopilot": {
      "maxIterations": 10,
      "maxQaCycles": 5,
      "maxValidationRounds": 3,
      "pauseAfterExpansion": false,
      "pauseAfterPlanning": false,
      "skipQa": false,
      "skipValidation": false
    }
  }
}
```

## Cancel and Resume

Cancel with `/cancel` or by saying "stop", "cancel", "abort". State is preserved automatically.

Resume by running `/autopilot` again — execution continues from the last completed phase.

## Examples

**New project:**
```
/autopilot A REST API for a bookstore inventory with CRUD operations, using TypeScript and PostgreSQL
```

**Feature addition to existing codebase:**
```
/autopilot Add user authentication with JWT tokens, refresh token rotation, and role-based access control
```

**Enhancement:**
```
/ap Add dark mode support with system preference detection and manual toggle persistence
```

## Input Tips

- Include the domain ("bookstore inventory" not just "store")
- List key capabilities ("with CRUD, search, and pagination")
- Specify technology constraints ("using TypeScript", "with PostgreSQL")
- Mention non-obvious requirements ("with rate limiting", "WCAG 2.1 AA compliant")

## Troubleshooting

| Symptom | Likely Cause | Action |
|---------|-------------|--------|
| Stuck in a phase | Blocked task or missing dependency | Check `.omd/autopilot-state.json` for current state, then `/cancel` and `/autopilot` to resume |
| Validation keeps failing | Requirements too vague for reviewers to verify | Cancel, add specific acceptance criteria, and restart |
| QA cycles exhausted | Same error 3 times indicates design issue | Review the error pattern in QA output; may need to refine the spec or add missing constraints |
