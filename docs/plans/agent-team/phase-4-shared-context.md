# Phase 4: Shared Context

## Goal

Implement the team-wide knowledge store. Members write findings, decisions, and constraints here. The context is injected into each member's prompt so the team stays in sync.

## Depends On

- Phase 1 (types)
- Phase 2 (registry — to validate team existence)

## Deliverables

### `src/team/context.ts`

### API

```typescript
// Context entries
function addContextEntry(teamName: string, entry: Omit<ContextEntry, 'timestamp'>): void;
function getContext(teamName: string): SharedContext;
function getContextAsMarkdown(teamName: string): string;  // For prompt injection

// Artifacts
function writeArtifact(teamName: string, name: string, content: string): string;  // Returns path
function readArtifact(teamName: string, name: string): string | undefined;
function listArtifacts(teamName: string): string[];

// Cleanup
function clearContext(teamName: string): void;

// Per-member transcript storage (durable, separate from UI state)
function appendTranscript(teamName: string, memberName: string, entry: string): void;
function getTranscriptPath(teamName: string, memberName: string): string;
function listTranscripts(teamName: string): TranscriptRef[];
```

### State Files

```
.omd/state/team/{name}/
├── context.json          # SharedContext object
├── transcripts/          # Per-member durable transcript logs
│   ├── architect-1.log
│   └── executor-1.log
└── artifacts/            # Intermediate team outputs
    ├── analysis.md
    └── review.md
```

Per-member transcripts are append-only log files that capture each member's tool calls, outputs, and decisions. This is essential for:
- Debugging failed members without rerunning
- Post-mortem analysis of team execution
- Future resume/replay capabilities

Transcripts are stored as durable files, not in UI state — a background agent's output must survive process restarts.

### `getContextAsMarkdown` Output Format

```markdown
## Team Context: {teamName}

### Decisions
- [architect-1] Use REST over GraphQL for this endpoint
- [leader] Max 3 retries on external API calls

### Findings
- [executor-1] The users table has no index on email column

### Constraints
- [leader] Must not modify the auth middleware

### Risks
- [architect-1] External payment API has no sandbox mode
```

This string is appended to each member agent's system prompt so they share knowledge without explicit message passing.

### Implementation Notes

- `context.json` stores structured `SharedContext` — the markdown is derived on read
- Artifacts are plain files (typically markdown) for intermediate team outputs
- Artifact names are sanitized (alphanumeric, hyphens, dots only)
- `clearContext` removes context.json and artifacts directory

## Test Plan

### `src/team/__tests__/context.test.ts`

**Context entries:**
- Add an entry → appears in getContext()
- Add multiple entries from different authors → all present
- Categories are preserved (decision, finding, constraint, risk)

**Markdown generation:**
- getContextAsMarkdown → grouped by category with author attribution
- Empty context → returns minimal header only

**Artifacts:**
- Write an artifact → file exists at expected path
- Read artifact → returns content
- Read non-existent artifact → returns undefined
- List artifacts → returns names

**Cleanup:**
- Clear context → context.json removed, artifacts directory removed

## Completion Criteria

- [ ] `src/team/context.ts` compiles and all functions are exported
- [ ] `src/team/__tests__/context.test.ts` — all tests pass
- [ ] Markdown output is clean and parseable
- [ ] Artifact names are sanitized (no path traversal)
