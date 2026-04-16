# Phase 6: Hooks

## Goal

Bridge the orchestrator's data layer to the Factory Droid runtime. Hooks handle actual agent spawning, heartbeat polling, and lifecycle events.

## Depends On

- Phase 5 (orchestrator)

## Deliverables

### `src/hooks/team/index.ts`

### Hook Events

| Event | Trigger | Action |
|-------|---------|--------|
| `UserPromptSubmit` | User invokes `/team` or magic keyword | Parse request, call `initTeam`, spawn member agents |
| `PostToolUse` (Agent tool) | A member agent completes | Update member status, send result to mailbox |
| `PreCompact` | Context window compaction | Preserve team state in shared context |

### Core Functions

```typescript
// Main hook entry point (called by bridge.ts)
export function processTeamHook(event: HookEvent): HookResult;

// Agent spawning — translates orchestrator assignments into Task tool calls
function spawnTeamMembers(teamName: string): SpawnResult[];

// Member completion handler
function handleMemberCompletion(teamName: string, memberName: string, result: string): void;

// Heartbeat checker — called periodically during COORDINATE phase
function checkHeartbeats(teamName: string): StaleCheckResult;

// Shutdown handler
function shutdownTeam(teamName: string): void;
```

### Integration with Existing Hook System

The hook follows the same pattern as `src/hooks/ralph/index.ts` and `src/hooks/ultrawork/index.ts`:

1. **Registration**: Add `team` to the hook registry in `src/hooks/bridge.ts`
2. **Event filtering**: Only process events relevant to an active team
3. **State check**: Read orchestrator state to determine current phase
4. **Prompt injection**: Append shared context markdown to member agent prompts

### Member Agent Spawning

When `spawnTeamMembers` is called, it:

1. Reads assignments from orchestrator state
2. For each member, constructs agent spawn parameters:
   - `subagent_type`: member's role (e.g., `architect`, `executor`)
   - `prompt`: assignment description + shared context markdown
   - `name`: member name (e.g., `architect-1`)
   - `run_in_background`: true
3. Returns spawn results (taskIds) for registry update

### Tool Policy Enforcement

Each member's spawn parameters include a scoped tool set based on their `MemberToolPolicy`:
- `allowedTools`: only these tools are available to the member
- `disallowedTools`: these tools are blocked even if otherwise allowed
- `permissionMode: 'leader-brokered'` (default): destructive tools require leader approval via mailbox permission_request/response flow

This prevents members from running arbitrary destructive operations without the leader's knowledge.

### Prompt Injection Template

```
You are {memberName}, a {role} agent working as part of team "{teamName}".

## Your Assignment
{assignmentDescription}

## File Ownership
You are responsible for: {ownedFiles}
Do NOT modify files outside your ownership.

## Team Context
{sharedContextMarkdown}

## Communication
When you complete your task, output your results clearly.
If you have questions or findings, state them explicitly.
When you need permission for destructive operations, request it explicitly.
```

### Completion Notification

When a member finishes (success or failure), the hook captures the result and delivers it as a structured completion notification — not as inline conversation text. This keeps the orchestrator's message stream clean and parseable.

```typescript
// Injected into leader's message queue, not into regular conversation
{
  type: 'task-notification',
  taskId: memberTaskId,
  status: 'completed' | 'failed',
  summary: '...',
  filesModified: ['src/api/users.ts'],
}
```

## Test Plan

### `src/hooks/team/__tests__/index.test.ts`

**Hook processing:**
- UserPromptSubmit with `/team` → triggers team initialization
- PostToolUse for team member → updates member status

**Spawning:**
- spawnTeamMembers → generates correct agent parameters for each assignment
- Prompt includes shared context and file ownership

**Heartbeat:**
- checkHeartbeats → identifies stale members correctly

**Integration:**
- Hook registered in bridge.ts → processes team events
- Non-team events → passes through unchanged

## Completion Criteria

- [ ] `src/hooks/team/index.ts` compiles
- [ ] Hook is registered in the hook bridge
- [ ] `src/hooks/team/__tests__/index.test.ts` — all tests pass
- [ ] Member prompts include shared context and file ownership
- [ ] Follows existing hook patterns (ralph, ultrawork)
