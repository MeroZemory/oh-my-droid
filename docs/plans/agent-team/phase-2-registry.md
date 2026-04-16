# Phase 2: Team Registry

## Goal

Implement team CRUD operations and member management. The registry is the source of truth for team state.

## Depends On

- Phase 1 (types)

## Deliverables

### `src/team/registry.ts`

Uses the existing `StateManager` pattern from `src/features/state-manager/`. Team state is stored at `.omd/state/team/{name}.json`.

### API

```typescript
// Team lifecycle
function createTeam(name: string, leaderId: string, config?: Partial<TeamConfig>): Team;
function getTeam(name: string): Team | undefined;
function deleteTeam(name: string): boolean;
function listTeams(): string[];

// Status transitions
function updateTeamStatus(name: string, status: TeamStatus): boolean;

// Member management
function addMember(teamName: string, member: Omit<TeamMember, 'status' | 'lastHeartbeat'>): TeamMember;
function removeMember(teamName: string, memberName: string): boolean;
function updateMemberStatus(teamName: string, memberName: string, status: MemberStatus, currentTask?: string): boolean;
function getMember(teamName: string, memberName: string): TeamMember | undefined;

// Heartbeat
function heartbeat(teamName: string, memberName: string): boolean;

// Queries
function getActiveMembers(teamName: string): TeamMember[];
function getStaleMembers(teamName: string, thresholdMs: number): TeamMember[];

// Spawn graph (parent-child relationships for recovery)
function addSpawnEdge(teamName: string, parentName: string, childName: string): void;
function closeSpawnEdge(teamName: string, childName: string): void;
function getSpawnGraph(teamName: string): SpawnGraph;
function getOpenChildren(teamName: string, parentName: string): string[];
```

### State File Layout

```
.omd/state/team/
├── my-team.json         # Team "my-team" state
└── api-build.json       # Team "api-build" state
```

Each file contains a serialized `Team` object. A separate `spawn-graph.json` stores parent-child spawn relationships for recovery and subtree-aware shutdown.

### Implementation Notes

- Use `fs.mkdirSync(dir, { recursive: true })` for `.omd/state/team/` directory creation
- JSON read/write follows the same pattern as existing state-manager (`readFileSync`, `writeFileSync`, `JSON.stringify(data, null, 2)`)
- Member name uniqueness enforced within a team
- Auto-generate member name if collision (e.g., "architect-1", "architect-2")
- `updatedAt` is refreshed on every write

## Test Plan

### `src/team/__tests__/registry.test.ts`

Use a temp directory (vitest `beforeEach`/`afterEach` with `fs.mkdtempSync`) to avoid polluting the project.

**Team lifecycle:**
- Create a team → verify JSON file exists with correct structure
- Get a team → returns the team object
- Get a non-existent team → returns undefined
- Delete a team → file is removed
- List teams → returns all team names

**Member management:**
- Add a member → appears in team.members
- Add duplicate name → auto-increments (architect-1 → architect-2)
- Remove a member → no longer in members array
- Update member status → persisted correctly

**Heartbeat:**
- Heartbeat updates lastHeartbeat timestamp
- getStaleMembers returns members past threshold

**Spawn graph:**
- Add spawn edge → appears in getSpawnGraph
- Close spawn edge → status changes to 'closed'
- getOpenChildren → returns only open children

**Edge cases:**
- Create team with same name twice → throws or returns error
- Operations on non-existent team → returns false/undefined

## Completion Criteria

- [ ] `src/team/registry.ts` compiles and all functions are exported
- [ ] `src/team/__tests__/registry.test.ts` — all tests pass
- [ ] State files are valid JSON, readable by `cat`
- [ ] No dependency on anything outside Phase 1 types + node fs
