---
description: Cancel any active OMC mode (autopilot, ralph, ultrawork, ecomode, ultraqa, swarm, ultrapilot, pipeline)
---

# Cancel Command

[UNIFIED CANCEL - INTELLIGENT MODE DETECTION]

You are cancelling the active OMC mode. The cancel skill will automatically detect which mode is running and clean it up properly.

## Auto-Detection

The skill checks state files to determine what's active and cancels in order of dependency:

1. **Autopilot** - Stops workflow, preserves progress for resume, cleans up ralph/ultraqa
2. **Ralph** - Stops persistence loop, cleans up linked ultrawork or ecomode
3. **Ultrawork** - Stops parallel execution (standalone)
4. **Ecomode** - Stops token-efficient execution (standalone)
5. **UltraQA** - Stops QA cycling workflow
6. **Swarm** - Stops coordinated agents, releases claimed tasks
7. **Ultrapilot** - Stops parallel autopilot workers
8. **Pipeline** - Stops sequential agent chain

## Usage

Basic cancellation (auto-detects mode):
```
/oh-my-droid:cancel
```

Force clear ALL state files:
```
/oh-my-droid:cancel --force
/oh-my-droid:cancel --all
```

## User Arguments

{{ARGUMENTS}}

## State Files Checked

- `.omd/state/autopilot-state.json` → Autopilot
- `.omd/state/ralph-state.json` → Ralph
- `.omd/state/ultrawork-state.json` → Ultrawork
- `.omd/state/ecomode-state.json` → Ecomode
- `.omd/state/ultraqa-state.json` → UltraQA
- `.omd/state/swarm.db` (SQLite) or `.omd/state/swarm-active.marker` → Swarm
- `.omd/state/ultrapilot-state.json` → Ultrapilot
- `.omd/state/pipeline-state.json` → Pipeline

## What Gets Preserved

| Mode | Progress Preserved | Resume |
|------|-------------------|--------|
| Autopilot | Yes (phase, spec, plan) | `/oh-my-droid:autopilot` |
| All Others | No | N/A |

## Dependency-Aware Cleanup

- **Autopilot cancellation** → Cleans ralph + ultraqa if active
- **Ralph cancellation** → Cleans linked ultrawork OR ecomode if applicable
- **Force mode** → Clears ALL state files regardless of what's active

## Exit Messages

The skill will report:
- Which mode was cancelled
- What phase/iteration it was in (if applicable)
- What dependent modes were cleaned up
- How to resume (if applicable)

## Implementation

Run the cancel skill which contains the full bash implementation for intelligent mode detection and cleanup.
