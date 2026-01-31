<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-01-28 | Updated: 2026-01-28 -->

# hooks

30+ event-driven hooks that power execution modes and behaviors.

## Purpose

Hooks intercept Factory Droid events to enable:
- **Execution modes**: autopilot, ultrawork, ralph, ultrapilot, swarm, pipeline
- **Validation**: thinking blocks, empty messages, comments
- **Recovery**: edit errors, session recovery, context window
- **Enhancement**: rules injection, directory READMEs, notepad
- **Detection**: keywords, think mode, slash commands

## Key Files

| File | Description |
|------|-------------|
| `index.ts` | Re-exports all hooks |

## Subdirectories

### Execution Mode Hooks

| Directory | Purpose | Trigger |
|-----------|---------|---------|
| `autopilot/` | Full autonomous execution | "autopilot", "build me" |
| `ultrawork/` | Maximum parallel execution | "ulw", "ultrawork" |
| `ralph/` | Persistence until verified | "ralph", "don't stop" |
| `ultrapilot/` | Parallel autopilot with file ownership | "ultrapilot" |
| `swarm/` | N coordinated agents with task claiming | "swarm N agents" |
| `ultraqa/` | QA cycling until goal met | test failures |
| `mode-registry/` | Tracks active execution mode | internal |

### Validation Hooks

| Directory | Purpose |
|-----------|---------|
| `thinking-block-validator/` | Validates thinking blocks in responses |
| `empty-message-sanitizer/` | Handles empty/whitespace messages |
| `comment-checker/` | Checks code comment quality |

### Recovery Hooks

| Directory | Purpose |
|-----------|---------|
| `recovery/` | Edit error recovery, session recovery |
| `preemptive-compaction/` | Prevents context overflow |

### Enhancement Hooks

| Directory | Purpose |
|-----------|---------|
| `rules-injector/` | Injects matching rule files |
| `directory-readme-injector/` | Injects directory READMEs |
| `notepad/` | Persists notes for compaction resilience |
| `learner/` | Skill extraction from conversations |
| `agent-usage-reminder/` | Reminds about agent delegation |

### Detection Hooks

| Directory | Purpose |
|-----------|---------|
| `keyword-detector/` | Magic keyword detection |
| `think-mode/` | Extended thinking detection |
| `auto-slash-command/` | Slash command expansion |
| `non-interactive-env/` | Non-interactive environment detection |

### Coordination Hooks

| Directory | Purpose |
|-----------|---------|
| `todo-continuation/` | Enforces task completion |
| `omd-orchestrator/` | Orchestrator behavior |

## For AI Agents

### Working In This Directory

#### Hook Structure

Each hook follows a standard pattern:
```
hook-name/
├── index.ts     # Main hook implementation
├── types.ts     # TypeScript interfaces
├── constants.ts # Configuration constants
└── *.ts         # Supporting modules
```

#### Hook Implementation

```typescript
// index.ts
export interface HookConfig {
  enabled: boolean;
  // hook-specific config
}

export function createHook(config: HookConfig) {
  return {
    name: 'hook-name',
    event: 'UserPromptSubmit',  // or 'Stop', 'PreToolUse', 'PostToolUse'
    handler: async (context) => {
      // Hook logic
      return { modified: false };
    }
  };
}
```

#### Key Hooks Explained

**autopilot/** - Full autonomous execution:
- Validates goals and creates plans
- Manages execution state
- Handles cancellation
- Enforces completion

**ralph/** - Persistence mechanism:
- Tracks progress via PRD
- Spawns architect for verification
- Loops until verified complete
- Supports structured PRD format

**ultrapilot/** - Parallel autopilot:
- Decomposes tasks into subtasks
- Assigns file ownership to workers
- Coordinates parallel execution
- Integrates results

**swarm/** - Coordinated multi-agent:
- SQLite-based task claiming
- 5-minute timeout per task
- Atomic claim/release
- Clean completion detection

**learner/** - Skill extraction:
- Detects skill patterns in conversation
- Extracts to local skill files
- Auto-invokes matching skills
- Manages skill lifecycle

### Common Patterns

**State management:**
```typescript
import { readState, writeState } from '../features/state-manager';

const state = readState('autopilot-state');
state.phase = 'executing';
writeState('autopilot-state', state);
```

**Event handling:**
```typescript
// UserPromptSubmit - Before prompt is sent
// Stop - Before session ends
// PreToolUse - Before tool execution
// PostToolUse - After tool execution
```

### Testing Requirements

```bash
# Test specific hook
npm test -- --grep "autopilot"

# Test all hooks
npm test -- --grep "hooks"
```

## Dependencies

### Internal
- `features/state-manager/` for state persistence
- `features/verification/` for verification protocol
- `agents/` for spawning sub-agents

### External
| Package | Purpose |
|---------|---------|
| `better-sqlite3` | Swarm task coordination |
| `fs`, `path` | State file operations |

## Hook Events

| Event | When Fired | Common Uses |
|-------|------------|-------------|
| `UserPromptSubmit` | Before prompt processing | Keyword detection, mode activation |
| `Stop` | Before session ends | Continuation enforcement |
| `PreToolUse` | Before tool execution | Permission validation |
| `PostToolUse` | After tool execution | Error recovery, rules injection |

## State Files

| Hook | State File |
|------|------------|
| autopilot | `.omd/state/autopilot-state.json` |
| ultrapilot | `.omd/state/ultrapilot-state.json` |
| ralph | `.omd/state/ralph-state.json` |
| swarm | `.omd/state/swarm-tasks.db` (SQLite) |
| learner | `~/.factory/local-skills/` |

<!-- MANUAL: -->
