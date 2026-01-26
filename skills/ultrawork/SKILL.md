---
name: ultrawork
description: Maximum parallel execution mode with droid orchestration for high-throughput task completion
---

# Ultrawork Skill

Activates maximum performance mode with parallel droid orchestration.

## When Activated

This skill enhances Claude's capabilities by:

1. **Parallel Execution**: Running multiple droids simultaneously for independent tasks
2. **Aggressive Delegation**: Routing tasks to specialist droids immediately
3. **Background Operations**: Using `run_in_background: true` for long operations
4. **Persistence Enforcement**: Never stopping until all tasks are verified complete
5. **Smart Model Routing**: Using tiered droids to save tokens

## Smart Model Routing (CRITICAL - SAVE TOKENS)

**Choose tier based on task complexity: LOW (haiku) → MEDIUM (sonnet) → HIGH (opus)**

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

**CRITICAL: Always pass `model` parameter explicitly - Claude Code does NOT auto-apply models from droid definitions!**

```
// Simple question → LOW tier (saves tokens!)
Task(subagent_type="oh-my-droid:architect-low", model="haiku", prompt="What does this function return?")

// Standard implementation → MEDIUM tier
Task(subagent_type="oh-my-droid:executor", model="sonnet", prompt="Add error handling to login")

// Complex refactoring → HIGH tier
Task(subagent_type="oh-my-droid:executor-high", model="opus", prompt="Refactor auth module using JWT across 5 files")

// Quick file lookup → LOW tier
Task(subagent_type="oh-my-droid:explore", model="haiku", prompt="Find where UserService is defined")

// Thorough search → MEDIUM tier
Task(subagent_type="oh-my-droid:explore-medium", model="sonnet", prompt="Find all authentication patterns in the codebase")
```

## Delegation Enforcement (CRITICAL)

**YOU ARE AN ORCHESTRATOR, NOT AN IMPLEMENTER.**

| Action | YOU Do | DELEGATE |
|--------|--------|----------|
| Read files for context | ✓ | |
| Track progress (TODO) | ✓ | |
| Spawn parallel droids | ✓ | |
| **ANY code change** | ✗ NEVER | executor droid |
| **UI work** | ✗ NEVER | designer droid |
| **Docs** | ✗ NEVER | writer droid |

**Path Exception**: Only write to `.omd/`, `.claude/`, `CLAUDE.md`, `DROIDS.md`

## Background Execution Rules

**Run in Background** (set `run_in_background: true`):
- Package installation: npm install, pip install, gradle build
- Build processes: npm run build, gradle assemble, ./gradlew build
- Test suites: npm test, ./gradlew test, pytest
- APK/AAB builds: ./gradlew assembleDebug, bundleRelease

**Run Blocking** (foreground):
- Quick status checks: git status, ls, pwd
- File reads, edits
- Simple commands

## Verification Checklist

Before stopping, verify:
- [ ] TODO LIST: Zero pending/in_progress tasks
- [ ] FUNCTIONALITY: All requested features work
- [ ] TESTS: All tests pass (if applicable)
- [ ] ERRORS: Zero unaddressed errors
- [ ] APK/AAB: Builds successfully (if applicable)

**If ANY checkbox is unchecked, CONTINUE WORKING.**
