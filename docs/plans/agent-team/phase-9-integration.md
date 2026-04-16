# Phase 9: Integration

## Goal

Wire the team system into the existing oh-my-droid ecosystem. Verify coexistence with existing modes. Update documentation.

## Depends On

- Phase 7 (skill + keywords)
- Phase 8 (HUD + status)

## Deliverables

### 1. Barrel Export

`src/team/index.ts` — re-exports the public API:

```typescript
// Types
export type { Team, TeamMember, TeamConfig, ... } from './types.js';
export { DEFAULT_TEAM_CONFIG } from './types.js';

// Registry
export { createTeam, getTeam, deleteTeam, ... } from './registry.js';

// Mailbox
export { sendMessage, readMessages, broadcastMessage, ... } from './mailbox.js';

// Context
export { addContextEntry, getContext, getContextAsMarkdown, ... } from './context.js';

// Orchestrator
export { initTeam, delegateWork, collectResults, finalizeTeam, ... } from './orchestrator.js';
```

### 2. Existing Skill Integration

#### `/plan` → Team suggestion

When `/plan` detects a task that benefits from parallel work across multiple domains, suggest team mode:

```
This task spans API design, implementation, and testing.
Consider running `/team --roles architect,executor,qa-tester` for coordinated parallel execution.
```

Add a paragraph to `skills/plan/SKILL.md` under the existing interview/delegation section.

#### `/ralph` → Team persistence

Ralph can wrap team mode for persistence. When ralph detects an active team, it monitors team status instead of single-agent completion.

No code changes in Phase 8 — document the pattern for future implementation.

### 3. FACTORY.md Updates

Add team to the skill invocation table:

```markdown
| "team", "collaborate", "together" | `team` |
```

Add team to the agent count (32 → 33 with team-orchestrator).

### 4. CHANGELOG.md

Add under `[Unreleased]`:
```markdown
### Added
- **Agent Team Mode** — Coordinate named agents as a team with inter-agent messaging,
  shared context, and leader-managed lifecycle. Invoke via `/team` or magic keywords
  (team, collaborate, together).
```

### 5. README.md

Add team to the magic keywords table.

### 6. Regression Verification

Verify existing modes are unaffected:

| Mode | Verification |
|------|-------------|
| **Swarm** | Create and run a swarm task → completes normally |
| **Ralph** | Start ralph mode → persistence loop works |
| **Ultrawork** | Parallel execution → fire-and-forget works |
| **Autopilot** | 5-phase pipeline → all phases execute |
| **Regular** | Normal agent delegation → no interference |

### 7. E2E Smoke Test

Manual verification scenario:

1. `/team Add a health check endpoint to the Express API`
2. Verify: team created with appropriate roles
3. Verify: members receive task messages
4. Verify: members report results
5. Verify: leader collects and integrates
6. Verify: team shuts down cleanly
7. Verify: `.omd/state/team/` is populated with readable JSON

## Completion Criteria

- [ ] `src/team/index.ts` barrel export compiles
- [ ] `/plan` suggests team mode for multi-domain tasks
- [ ] FACTORY.md, CHANGELOG.md, README.md updated
- [ ] Existing modes (swarm, ralph, ultrawork, autopilot) unaffected
- [ ] E2E smoke test passes
- [ ] All 9 phase test suites pass: `npm test`
