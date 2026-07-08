---
description: Cancel any active OMD mode (autopilot, ralph, ultrawork, ecomode, ultraqa, swarm, ultrapilot, pipeline)
---

# OMD Cancel Command

[UNIFIED CANCEL - INTELLIGENT MODE DETECTION]

This is an alias for `/cancel`, provided to reduce the chance of command name collisions with other plugins.

You are cancelling the active OMD mode. The cancel skill will automatically detect which mode is running and clean it up properly.

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

Preferred (collision-resistant):
```
/omd-cancel
```

Also supported:
```
/cancel
```

Force clear ALL state files:
```
/omd-cancel --force
/omd-cancel --all
```

## User Arguments

$ARGUMENTS

## Implementation

Run the cancel skill which contains the full implementation for intelligent mode detection and cleanup.
