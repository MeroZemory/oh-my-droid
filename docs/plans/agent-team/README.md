# Agent Team Implementation Plan

See [overview.md](./overview.md) for the full feature design.
See `_ref/docs/` for detailed reference analysis of claude-code and codex team architectures.

## Phase Index

Each phase is self-contained: implement fully, write tests, verify passing before moving on.

| # | Phase | Depends On | Key Deliverables |
|---|-------|-----------|------------------|
| 1 | [Types](./phase-1-types.md) | - | `src/team/types.ts` — interfaces, enums, constants, typed control payloads |
| 2 | [Registry](./phase-2-registry.md) | Phase 1 | `src/team/registry.ts` — team CRUD, member management, spawn graph |
| 3 | [Mailbox](./phase-3-mailbox.md) | Phase 1 | `src/team/mailbox.ts` — typed control channel (messages, permissions, shutdown) |
| 4 | [Shared Context](./phase-4-shared-context.md) | Phase 1, 2 | `src/team/context.ts` — knowledge store, artifacts, per-member transcripts |
| 5 | [Orchestrator](./phase-5-orchestrator.md) | Phase 1-4 | `src/team/orchestrator.ts` — 5-phase lifecycle, permission broker, completion signals |
| 6 | [Hooks](./phase-6-hooks.md) | Phase 5 | `src/hooks/team/index.ts` — spawning, tool policy, completion notifications |
| 7 | [Skill + Keywords](./phase-7-skill.md) | Phase 5, 6 | `skills/team/SKILL.md`, magic keyword registration |
| 8 | [HUD + Status](./phase-8-hud.md) | Phase 5 | Team status display in existing HUD, inline event rendering |
| 9 | [Integration](./phase-9-integration.md) | Phase 7, 8 | Wire into existing modes, regression verification |

## Key Design Principles (from reference analysis)

1. **Mailbox = typed control plane** — not a text channel. Permission requests, approvals, and shutdown are structured messages.
2. **Agent definition = executable policy** — each member gets scoped tools, model, and permission mode, not just a prompt.
3. **Durable transcript storage** — per-member output files survive process restarts. Essential for debugging and future resume.
4. **Spawn graph persistence** — parent-child relationships are stored for subtree-aware shutdown and recovery.
5. **Completion signals ≠ conversation** — background task results are delivered as structured notifications, not inline chat.
6. **Team UI = distributed overlay** — team status is shown in existing HUD/footer, not a separate dashboard.
7. **Permission broker** — members don't decide permissions themselves; destructive operations go through the leader.

## Conventions

- All modules under `src/team/`
- ESM with `.js` extensions in imports
- Types use `export interface` / `export type` / `export enum`
- State files under `.omd/state/team/` via existing `StateManager`
- Tests in `src/team/__tests__/` using vitest (globals enabled)
- Named exports, barrel re-export via `src/team/index.ts`
