---
name: autopilot
description: Full autonomous execution from idea to working Android app
---

# Autopilot Skill

Full autonomous execution from idea to working Android app.

## Overview

Autopilot is the ultimate hands-off mode. Give it a brief product idea (2-3 lines) and it handles everything:

1. **Understands** your requirements (Analyst)
2. **Designs** the technical approach (Architect)
3. **Plans** the implementation (Critic-validated)
4. **Builds** with parallel droids (Ralph + Ultrawork)
5. **Tests** until everything passes (UltraQA)
6. **Validates** quality and security (Multi-architect review)

## Usage

```
/oh-my-droid:autopilot <your idea>
/oh-my-droid:ap "A todo list app with Material Design 3"
/oh-my-droid:autopilot Add offline sync to the app
```

## Magic Keywords

These phrases auto-activate autopilot:
- "autopilot", "auto pilot", "autonomous"
- "build me", "create me", "make me"
- "full auto", "handle it all"
- "I want a/an..."

## Phases

### Phase 0: Expansion

**Goal:** Turn vague idea into detailed spec

**Droids:**
- Analyst (Opus) - Extract requirements
- Architect (Opus) - Technical specification

**Output:** `.omd/autopilot/spec.md`

### Phase 1: Planning

**Goal:** Create implementation plan from spec

**Droids:**
- Architect (Opus) - Create plan (direct mode, no interview)
- Critic (Opus) - Validate plan

**Output:** `.omd/plans/autopilot-impl.md`

### Phase 2: Execution

**Goal:** Implement the plan

**Mode:** Ralph + Ultrawork (persistence + parallelism)

**Droids:**
- Executor-low (Haiku) - Simple tasks
- Executor (Sonnet) - Standard tasks
- Executor-high (Opus) - Complex tasks

### Phase 3: QA

**Goal:** All tests pass and app builds

**Mode:** UltraQA

**Cycle:**
1. Build (./gradlew assembleDebug)
2. Lint (./gradlew lint)
3. Test (./gradlew test)
4. Fix failures
5. Repeat (max 5 cycles)

### Phase 4: Validation

**Goal:** Multi-perspective approval

**Droids (parallel):**
- Architect - Functional completeness
- Security-reviewer - Vulnerability check
- Code-reviewer - Quality review

**Rule:** All must APPROVE or issues get fixed and re-validated.

## Configuration

Optional settings in `.claude/settings.json`:

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

## Cancellation

```
/oh-my-droid:cancel
```

Or say: "stop", "cancel", "abort"

Progress is preserved for resume.

## Resume

If autopilot was cancelled or failed, just run `/oh-my-droid:autopilot` again to resume from where it stopped.

## Examples

**New Project:**
```
/oh-my-droid:autopilot A weather app with location tracking and Material Design 3
```

**Feature Addition:**
```
/oh-my-droid:autopilot Add dark theme support with system preference detection
```

**Enhancement:**
```
/oh-my-droid:ap Add offline-first architecture with Room database
```

## Best Practices

1. **Be specific about the platform** - "Android app", "Jetpack Compose"
2. **Mention key features** - "with Room", "with Retrofit", "Material Design 3"
3. **Specify constraints** - "using Kotlin", "targeting API 26+"
4. **Let it run** - Don't interrupt unless truly needed

## Troubleshooting

**Stuck in a phase?**
- Check TODO list for blocked tasks
- Review `.omd/autopilot-state.json` for state
- Cancel and resume if needed

**Validation keeps failing?**
- Review the specific issues
- Consider if requirements were too vague
- Cancel and provide more detail

**QA cycles exhausted?**
- Same error 3 times = fundamental issue
- Review the error pattern
- May need manual intervention

**Build failures?**
- Check Gradle sync status
- Review build.gradle dependencies
- Verify SDK versions in local.properties
