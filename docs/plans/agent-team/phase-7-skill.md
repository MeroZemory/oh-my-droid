# Phase 7: Skill + Keywords

## Goal

Create the `/team` skill and register magic keywords so users can invoke team mode naturally.

## Depends On

- Phase 5 (orchestrator)
- Phase 6 (hooks)

## Deliverables

### `skills/team/SKILL.md`

The skill definition that the Factory Droid runtime loads. Follows the standard frontmatter format.

```markdown
---
name: team
description: Coordinate named agents as a team with inter-agent communication
---
```

The skill body instructs the orchestrator to:

1. Analyze the user's request and determine required roles
2. Call `initTeam` with the role composition
3. Spawn members via hooks
4. Enter the COORDINATE loop (poll, handle messages, reassign)
5. Collect results and finalize

### Skill Invocation

```
/team [task description]
/team --roles architect,executor,qa-tester [task description]
/team --template api-crud [task description]
```

### Argument Parsing

| Argument | Description | Default |
|----------|-------------|---------|
| `--roles` | Comma-separated role list | Auto-determined from task |
| `--max-members` | Override maxMembers config | 5 |
| `--timeout` | Team timeout in minutes | 10 |
| `--dry-run` | Show team plan without executing | false |

### Magic Keywords

Add to `src/features/magic-keywords.ts`:

| Keyword | Triggers |
|---------|----------|
| `team` | `/team` skill |
| `collaborate` | `/team` skill |
| `together` | `/team` skill |

### Agent Registration

Add team orchestrator agent to `src/droids/definitions.ts`:

```typescript
{
  name: 'team-orchestrator',
  description: 'Coordinates a team of agents with communication and shared context',
  model: 'opus',
  tools: ['Agent', 'Bash', 'Read', 'Glob', 'Grep'],
}
```

### Dry-Run Output

When `--dry-run` is specified:

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

## Test Plan

### Skill file
- SKILL.md has valid frontmatter (name, description)
- Skill body covers all orchestrator phases

### Magic keywords
- `team` keyword triggers team skill
- `collaborate` keyword triggers team skill
- Keywords are not detected inside code blocks

### Agent definition
- team-orchestrator is registered in definitions.ts
- Has correct model and tool list

## Completion Criteria

- [ ] `skills/team/SKILL.md` exists with valid frontmatter
- [ ] Magic keywords registered in magic-keywords.ts
- [ ] team-orchestrator agent registered in definitions.ts
- [ ] `--dry-run` output format is defined
- [ ] Argument parsing covers roles, max-members, timeout, dry-run
