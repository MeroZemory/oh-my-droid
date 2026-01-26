---
name: cancel
description: Cancel any active OMD mode (autopilot, ralph, ultrawork, ecomode, ultraqa, swarm, ultrapilot, pipeline)
---

# Cancel Skill

Intelligent cancellation that detects and cancels the active OMD mode.

## What It Does

Automatically detects which mode is active and cancels it:
- **Autopilot**: Stops workflow, preserves progress for resume
- **Ralph**: Stops persistence loop, clears linked ultrawork if applicable
- **Ultrawork**: Stops parallel execution (standalone or linked)
- **Ecomode**: Stops token-efficient parallel execution (standalone or linked to ralph)
- **UltraQA**: Stops QA cycling workflow
- **Swarm**: Stops coordinated agent swarm, releases claimed tasks
- **Ultrapilot**: Stops parallel autopilot workers
- **Pipeline**: Stops sequential agent pipeline

## Usage

```
/oh-my-droid:cancel
```

Or say: "stop", "cancel", "abort"

## Auto-Detection

The skill checks state files to determine what's active:
- `.omd/autopilot-state.json` → Autopilot detected
- `.omd/ralph-state.json` → Ralph detected
- `.omd/ultrawork-state.json` → Ultrawork detected
- `.omd/ecomode-state.json` → Ecomode detected
- `.omd/ultraqa-state.json` → UltraQA detected
- `.omd/swarm-state.json` → Swarm detected
- `.omd/ultrapilot-state.json` → Ultrapilot detected
- `.omd/pipeline-state.json` → Pipeline detected
- `.omd/state/plan-consensus.json` → Plan Consensus detected
- `.omd/ralplan-state.json` → Plan Consensus detected (legacy)

If multiple modes are active, they're cancelled in order of dependency:
1. Autopilot (includes ralph/ultraqa/ecomode cleanup)
2. Ralph (includes linked ultrawork OR ecomode cleanup)
3. Ultrawork (standalone)
4. Ecomode (standalone)
5. UltraQA (standalone)
6. Swarm (standalone)
7. Ultrapilot (standalone)
8. Pipeline (standalone)
9. Plan Consensus (standalone)

## Force Clear All

To clear ALL state files regardless of what's active:

```
/oh-my-droid:cancel --force
```

Or use the `--all` alias:

```
/oh-my-droid:cancel --all
```

This removes all state files:
- `.omd/autopilot-state.json`
- `.omd/ralph-state.json`
- `.omd/ultrawork-state.json`
- `.omd/ecomode-state.json`
- `.omd/ultraqa-state.json`
- `.omd/swarm-state.json`
- `.omd/state/swarm-tasks.json`
- `.omd/ultrapilot-state.json`
- `.omd/pipeline-state.json`
- `.omd/state/plan-consensus.json`
- `.omd/ralplan-state.json`
- `~/.factory/ralph-state.json`
- `~/.factory/ultrawork-state.json`
- `~/.factory/ecomode-state.json`

## Implementation Steps

When you invoke this skill:

### 1. Parse Arguments

```bash
# Check for --force or --all flags
FORCE_MODE=false
if [[ "$*" == *"--force"* ]] || [[ "$*" == *"--all"* ]]; then
  FORCE_MODE=true
fi
```

### 2. Detect Active Modes

```bash
# Check which modes are active
AUTOPILOT_ACTIVE=false
RALPH_ACTIVE=false
ULTRAWORK_ACTIVE=false
ECOMODE_ACTIVE=false
ULTRAQA_ACTIVE=false

if [[ -f .omd/autopilot-state.json ]]; then
  AUTOPILOT_ACTIVE=$(cat .omd/autopilot-state.json | jq -r '.active // false')
fi

if [[ -f .omd/ralph-state.json ]]; then
  RALPH_ACTIVE=$(cat .omd/ralph-state.json | jq -r '.active // false')
fi

if [[ -f .omd/ultrawork-state.json ]]; then
  ULTRAWORK_ACTIVE=$(cat .omd/ultrawork-state.json | jq -r '.active // false')
fi

if [[ -f .omd/ecomode-state.json ]]; then
  ECOMODE_ACTIVE=$(cat .omd/ecomode-state.json | jq -r '.active // false')
fi

if [[ -f .omd/ultraqa-state.json ]]; then
  ULTRAQA_ACTIVE=$(cat .omd/ultraqa-state.json | jq -r '.active // false')
fi

PLAN_CONSENSUS_ACTIVE=false

# Check both new and legacy locations
if [[ -f .omd/state/plan-consensus.json ]]; then
  PLAN_CONSENSUS_ACTIVE=$(cat .omd/state/plan-consensus.json | jq -r '.active // false')
elif [[ -f .omd/ralplan-state.json ]]; then
  PLAN_CONSENSUS_ACTIVE=$(cat .omd/ralplan-state.json | jq -r '.active // false')
fi
```

### 3A. Force Mode (if --force or --all)

```bash
if [[ "$FORCE_MODE" == "true" ]]; then
  echo "FORCE CLEAR: Removing all OMD state files..."

  # Remove local state files
  rm -f .omd/autopilot-state.json
  rm -f .omd/ralph-state.json
  rm -f .omd/ultrawork-state.json
  rm -f .omd/ecomode-state.json
  rm -f .omd/ultraqa-state.json
  rm -f .omd/ralph-plan-state.json
  rm -f .omd/ralph-verification.json
  rm -f .omd/swarm-state.json
  rm -f .omd/state/swarm-tasks.json
  rm -f .omd/ultrapilot-state.json
  rm -f .omd/pipeline-state.json
  rm -f .omd/state/plan-consensus.json
  rm -f .omd/ralplan-state.json

  # Remove global state files
  rm -f ~/.factory/ralph-state.json
  rm -f ~/.factory/ultrawork-state.json
  rm -f ~/.factory/ecomode-state.json

  echo "All OMD modes cleared. You are free to start fresh."
  exit 0
fi
```

### 3B. Smart Cancellation (default)

Follow the same logic as oh-my-claudecode but using `.omd/` and `~/.factory/` paths.

## Messages Reference

| Mode | Success Message |
|------|-----------------|
| Autopilot | "Autopilot cancelled at phase: {phase}. Progress preserved for resume." |
| Ralph | "Ralph cancelled. Persistent mode deactivated." |
| Ultrawork | "Ultrawork cancelled. Parallel execution mode deactivated." |
| Ecomode | "Ecomode cancelled. Token-efficient execution mode deactivated." |
| UltraQA | "UltraQA cancelled. QA cycling workflow stopped." |
| Swarm | "Swarm cancelled. Coordinated agents stopped." |
| Ultrapilot | "Ultrapilot cancelled. Parallel autopilot workers stopped." |
| Pipeline | "Pipeline cancelled. Sequential agent chain stopped." |
| Plan Consensus | "Plan Consensus cancelled. Planning session ended." |
| Force | "All OMD modes cleared. You are free to start fresh." |
| None | "No active OMD modes detected." |

## What Gets Preserved

| Mode | State Preserved | Resume Command |
|------|-----------------|----------------|
| Autopilot | Yes (phase, files, spec, plan, verdicts) | `/oh-my-droid:autopilot` |
| Ralph | No | N/A |
| Ultrawork | No | N/A |
| UltraQA | No | N/A |
| Swarm | No | N/A |
| Ultrapilot | No | N/A |
| Pipeline | No | N/A |
| Plan Consensus | Yes (plan file path preserved) | N/A |

## Notes

- **Dependency-aware**: Autopilot cancellation cleans up Ralph and UltraQA
- **Link-aware**: Ralph cancellation cleans up linked Ultrawork or Ecomode
- **Safe**: Only clears linked Ultrawork, preserves standalone Ultrawork
- **Dual-location**: Clears both `.omd/` and `~/.factory/` state files
- **Resume-friendly**: Autopilot state is preserved for seamless resume
