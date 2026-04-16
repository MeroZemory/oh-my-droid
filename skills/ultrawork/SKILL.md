---
name: ultrawork
description: "Decompose multi-step tasks into parallel sub-agent workloads, route each sub-task to the cheapest capable model tier (Haiku/Sonnet/Opus), run long-running commands in the background, and verify all deliverables before stopping. Use when the user asks to 'go fast', 'parallelize', 'ultrawork', or when a request contains 3+ independent sub-tasks that benefit from concurrent execution."
---

# Ultrawork

Orchestrate parallel sub-agents across model tiers to complete multi-part tasks faster and cheaper.

## Workflow

Follow these steps in order for every ultrawork session:

1. **Decompose** -- Break the user request into independent sub-tasks. List each task with its domain (Analysis, Execution, Search, etc.).
2. **Route** -- Assign each sub-task to the cheapest sufficient agent tier using the routing table below (LOW first, escalate only when needed).
3. **Dispatch** -- Launch independent sub-tasks in parallel via `Task()`. Set `run_in_background: true` for any command expected to take longer than a few seconds (builds, installs, test suites, Docker operations).
4. **Monitor** -- Track each sub-agent to completion. If a sub-task fails or returns incomplete results, escalate to the next tier and retry.
5. **Verify** -- Run the verification checklist (below). If any item fails, continue working until all pass.
6. **Clean up** -- Delete ``.omd/state/ultrawork-state.json`` so no stale state persists.

## Smart Model Routing

Always start at the lowest tier that can handle the task. Escalate only on failure or when complexity demands it: **LOW (Haiku) -> MEDIUM (Sonnet) -> HIGH (Opus)**.

### Available Agents by Tier

| Domain | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **Analysis** | `architect-low` | `architect-medium` | `architect` |
| **Execution** | `executor-low` | `executor` | `executor-high` |
| **Search** | `explore` | `explore-medium` | - |
| **Research** | `researcher-low` | `researcher` | - |
| **Frontend** | `designer-low` | `designer` | `designer-high` |
| **Docs** | `writer` | - | - |
| **Visual** | - | `vision` | - |
| **Planning** | - | - | `planner`, `critic`, `analyst` |
| **Testing** | - | `qa-tester` | - |
| **Security** | `security-reviewer-low` | - | `security-reviewer` |
| **Build** | `build-fixer-low` | `build-fixer` | - |
| **TDD** | `tdd-guide-low` | `tdd-guide` | - |
| **Code Review** | `code-reviewer-low` | - | `code-reviewer` |

### Tier Selection Guide

| Task Complexity | Tier | Examples |
|-----------------|------|----------|
| Simple lookups | LOW | "What does this function return?", "Find where X is defined" |
| Standard work | MEDIUM | "Add error handling", "Implement this feature" |
| Complex analysis | HIGH | "Debug this race condition", "Refactor auth module across 5 files" |

### Routing Examples

OMD auto-injects the correct `model` for built-in tiered agents when missing.

If you *do* specify `model`, use full model IDs (e.g. `claude-haiku-4-5-20251001`), not shorthands.

```
// Simple question → LOW tier (saves tokens!)
Task(subagent_type="oh-my-droid:architect-low", model="claude-haiku-4-5-20251001", prompt="What does this function return?")

// Standard implementation → MEDIUM tier
Task(subagent_type="oh-my-droid:executor", model="claude-sonnet-4-5-20250929", prompt="Add error handling to login")

// Complex refactoring → HIGH tier
Task(subagent_type="oh-my-droid:executor-high", model="claude-opus-4-5-20251101", prompt="Refactor auth module using JWT across 5 files")

// Quick file lookup → LOW tier
Task(subagent_type="oh-my-droid:explore", model="claude-haiku-4-5-20251001", prompt="Find where UserService is defined")

// Thorough search → MEDIUM tier
Task(subagent_type="oh-my-droid:explore-medium", model="claude-sonnet-4-5-20250929", prompt="Find all authentication patterns in the codebase")
```

## Background vs Foreground Execution

Set `run_in_background: true` for any command that typically takes more than a few seconds:

| Background (`run_in_background: true`) | Foreground (blocking) |
|-----------------------------------------|-----------------------|
| `npm install`, `pip install`, `cargo build` | `git status`, `ls`, `pwd` |
| `npm run build`, `make`, `tsc` | File reads and edits |
| `npm test`, `pytest`, `cargo test` | Short single-file commands |
| `docker build`, `docker pull` | |

## Verification Checklist

Before stopping, every item must pass. If any fails, continue working.

- [ ] **Tasks complete** -- Zero pending or in-progress sub-tasks remain
- [ ] **Functionality** -- All requested features work as specified
- [ ] **Tests** -- All tests pass (when applicable)
- [ ] **Errors** -- Zero unaddressed errors in output

## State Cleanup

On completion, delete state files -- do not leave them with `active: false`:

```bash
rm -f .omd/state/ultrawork-state.json
```
