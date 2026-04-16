# Phase 8: HUD + Status Display

## Goal

Integrate team status into the existing oh-my-droid HUD system. The team UI is not a separate dashboard — it's a distributed overlay on the existing conversation interface. Both claude-code and codex render team state inline: footer pills, spinner trees, transcript focus switching, and collaboration event cells.

## Depends On

- Phase 5 (orchestrator — provides team state to display)

## Design Principles (from reference analysis)

1. **No separate team panel** — team status lives in the existing HUD and conversation flow
2. **Inline collaboration events** — spawn, completion, failure are rendered as history cells in the conversation
3. **Compact status affordance** — a footer-level summary showing team name, member count, active/idle breakdown
4. **Member status list** — accessible via HUD expansion, showing per-member role, status, current task, and model
5. **Lifecycle notifications** — spawn and shutdown events are foldable notifications (e.g., "2 agents spawned", "1 agent completed")

## Deliverables

### `src/hud/team-status.ts`

Team status data provider for the HUD system.

```typescript
// Provides team state summary for HUD rendering
function getTeamHudData(teamName: string): TeamHudData | null;

interface TeamHudData {
  teamName: string;
  phase: OrchestratorPhase;
  memberSummary: {
    total: number;
    running: number;
    idle: number;
    completed: number;
    failed: number;
  };
  members: Array<{
    name: string;
    role: string;
    status: MemberStatus;
    currentTask?: string;
    model?: string;
  }>;
  recentEvents: TeamEvent[];
}

interface TeamEvent {
  type: 'spawn' | 'complete' | 'fail' | 'shutdown';
  memberName: string;
  timestamp: string;
  detail?: string;
}
```

### Inline Collaboration Events

When team events occur, they are rendered as compact history cells in the conversation:

```
[TEAM: api-build]
├ Spawned architect-1 (architect, opus)
├ Spawned executor-1 (executor, sonnet)
├ Spawned executor-2 (executor, sonnet)
└ 3 agents working

[TEAM: api-build]
├ ✓ architect-1 completed — API schema defined
├ → executor-1 working — implementing controller
├ → executor-2 working — implementing migration
└ 1/3 completed

[TEAM: api-build]
├ ✓ architect-1 completed
├ ✓ executor-1 completed — 3 files modified
├ ✗ executor-2 failed — type error in migration
└ 2/3 completed, 1 failed
```

### Compact Footer Status

When a team is active, the HUD footer shows:

```
[team: api-build] 3 agents | 2 running, 1 completed | phase: coordinate
```

### Lifecycle Notifications

Foldable notifications for batch events:

```
[TEAM] 3 agents spawned for "api-build"
[TEAM] executor-1 completed (2 files modified)
[TEAM] api-build finished — 2 succeeded, 1 failed
```

## Integration Points

### Existing HUD System

- Hook into `src/hud/` — the existing HUD infrastructure that renders status information
- Team status is one more data source alongside existing ralph/ultrawork/autopilot status

### Hook Bridge

- Team hooks (Phase 6) emit events that the HUD subscribes to
- Events are: member_spawned, member_completed, member_failed, team_phase_changed, team_completed

## Test Plan

### `src/hud/__tests__/team-status.test.ts`

**Data provider:**
- getTeamHudData with active team → returns summary with correct counts
- getTeamHudData with no active team → returns null
- Member status changes → reflected in summary

**Event formatting:**
- Spawn event → correct inline format
- Completion event → includes files modified count
- Failure event → includes error detail
- Multiple events → batched into foldable notification

## Completion Criteria

- [ ] `src/hud/team-status.ts` compiles and exports
- [ ] Team status appears in HUD when team is active
- [ ] Inline collaboration events render in conversation flow
- [ ] Footer shows compact team summary
- [ ] Lifecycle notifications are foldable
- [ ] No HUD changes when no team is active (zero impact on non-team modes)
