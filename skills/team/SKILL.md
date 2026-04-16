---
name: team
description: Coordinate named agents as a team with inter-agent communication
---

# Team Skill

Coordinate named agents as a team with inter-agent messaging, shared context, file ownership, and leader-managed lifecycle.

## Usage

```
/team [task description]
/team --roles architect,executor,qa-tester [task description]
/team --max-members 3 [task description]
/team --timeout 15 [task description]
/team --dry-run [task description]
```

### Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--roles` | Comma-separated role list | Auto-determined from task |
| `--max-members` | Override max team size | 5 |
| `--timeout` | Team timeout in minutes | 10 |
| `--dry-run` | Show team plan without executing | false |

## How It Works

You are the team leader. Your job is to orchestrate a coordinated team of specialist agents.

### Phase 1: INIT — Analyze and Compose Team

1. Analyze the user's task description
2. Determine which roles are needed:
   - `architect` — for design, schema, API structure decisions
   - `executor` — for implementation (spawn multiple if independent files)
   - `qa-tester` — for writing tests and verification
   - `code-reviewer` — for review passes
   - Other roles from the existing droid registry as needed
3. If `--roles` is specified, use those roles directly
4. If `--dry-run` is specified, show the plan and stop

### Phase 2: DELEGATE — Assign Work

1. Break the task into concrete assignments with:
   - Clear description of what each member should do
   - File ownership (which files each member is responsible for)
   - **No file overlap** — each file belongs to exactly one member
2. Send task assignments to each member via mailbox
3. Spawn member agents in background with:
   - Role-appropriate subagent type
   - Scoped tool set (via MemberToolPolicy)
   - Shared context injected into prompt
   - File ownership boundaries

### Phase 3: COORDINATE — Monitor and Adjust

1. Poll member status periodically
2. Handle incoming messages from members:
   - **Results**: Update assignment status
   - **Questions**: Answer or route to appropriate member
   - **Permission requests**: Approve read-only tools, review destructive tools
3. Detect stale members (no heartbeat > 5 min) and reassign if needed
4. If a critical member (architect) fails, consider aborting

### Phase 4: COLLECT — Gather Results

1. Collect all completed results
2. Check for file conflicts (shouldn't happen with ownership, but verify)
3. Aggregate findings into shared context

### Phase 5: FINALIZE — Verify and Wrap Up

1. Run verification: `tsc --noEmit`, `npm test`, `npm run lint` (as applicable)
2. Broadcast shutdown to all members
3. Report final summary to user

## Dry-Run Output

When `--dry-run` is specified, show this and stop:

```
[TEAM PLAN]
Task: Add REST API endpoint for user preferences
Members:
  - architect-1 (architect): Design API schema and endpoint structure
  - executor-1 (executor): Implement controller and service layer
  - executor-2 (executor): Implement database migration and model
  - qa-tester-1 (qa-tester): Write integration tests

File Ownership:
  - executor-1: src/controllers/preferences.ts, src/services/preferences.ts
  - executor-2: src/models/preferences.ts, migrations/

Estimated: 4 agents, ~10 min
Proceed? [Y/n]
```

## Team Status Display

During execution, show periodic status updates:

```
[TEAM: api-build]
├ ✓ architect-1 completed — API schema defined
├ → executor-1 working — implementing controller
├ → executor-2 working — implementing migration
└ 1/3 completed
```

## Error Handling

- If a non-critical member fails, skip or reassign
- If architect fails with no replacement, abort team and report to user
- If timeout is reached, collect whatever results are available and finalize

## Integration

- Works with `/ralph` for team-level persistence loops
- Shared context is available to all members without explicit message passing
- File ownership prevents conflicts when multiple executors work in parallel

## Anti-Patterns

1. **Over-staffing** — Don't spawn 5 agents for a task that one executor can handle
2. **Missing architect** — Complex tasks need an architect to design before executors implement
3. **No file ownership** — Without ownership, parallel executors will conflict on the same files
4. **Ignoring stale members** — Always check heartbeats and reassign if a member goes silent
