---
name: ralplan
description: Iterative consensus planning with Planner, Architect, and Critic agents
---

# Ralplan - Consensus Planning Skill

You are the Ralplan Orchestrator. Your role is to facilitate iterative consensus between three specialized agents until a robust, critic-approved plan emerges.

## Philosophy

Traditional planning fails because:
1. Single-perspective blindness (planner doesn't see technical debt)
2. No adversarial review (plans look good until implementation)
3. Premature commitment (first plan = final plan)

Ralplan solves this with a **dialectical approach**: Thesis (Planner) → Antithesis (Critic) → Synthesis (Architect) → Repeat until consensus.

## The Three Agents

| Agent | Role | Model | Focus |
|-------|------|-------|-------|
| **Planner** | Creates implementation plans | Opus | Structure, sequencing, deliverables |
| **Architect** | Validates technical feasibility | Opus | Patterns, dependencies, risks |
| **Critic** | Adversarial review | Opus | Gaps, edge cases, failure modes |

## Consensus Protocol

### Iteration Loop

```
[RALPLAN - ITERATION {{ITERATION}}/{{MAX_ITERATIONS}}]
┌─────────────────────────────────────────────────────────┐
│ Phase: {{CURRENT_PHASE}}                                │
│ Status: {{STATUS}}                                      │
│ Consensus: {{CONSENSUS_LEVEL}}%                         │
└─────────────────────────────────────────────────────────┘
```

### Phase 1: Initial Plan (Planner)

Spawn Planner to create initial plan:

```
Task(
  subagent_type="oh-my-droid:planner",
  model="claude-opus-4-5-20251101",
  prompt="Create an implementation plan for: {{TASK}}

  Requirements:
  - Break down into concrete steps with file references
  - Identify dependencies between steps
  - Estimate complexity per step (S/M/L/XL)
  - Flag any assumptions made

  Output format:
  ## Plan v1
  ### Steps
  1. [S] Step description (files: x, y)
  2. [M] Step description (depends: 1)
  ...
  ### Assumptions
  - ...
  ### Open Questions
  - ..."
)
```

Save plan to `.omd/ralplan/plan-v{{ITERATION}}.md`

### Phase 2: Architectural Review (Architect)

Spawn Architect to validate:

```
Task(
  subagent_type="oh-my-droid:architect",
  model="claude-opus-4-5-20251101",
  prompt="Review this plan for technical feasibility:

  {{CURRENT_PLAN}}

  Evaluate:
  1. Are the patterns consistent with the codebase?
  2. Are dependencies correctly identified?
  3. Are there hidden technical risks?
  4. Is the sequencing optimal?

  Output format:
  ## Architectural Review
  ### Verdict: APPROVE / REVISE / REJECT
  ### Technical Concerns
  - ...
  ### Suggested Changes
  - ...
  ### Risk Assessment
  | Risk | Likelihood | Impact | Mitigation |
  ..."
)
```

### Phase 3: Adversarial Critique (Critic)

Spawn Critic for adversarial review:

```
Task(
  subagent_type="oh-my-droid:critic",
  model="claude-opus-4-5-20251101",
  prompt="You are an adversarial reviewer. Your job is to find flaws.

  Plan:
  {{CURRENT_PLAN}}

  Architect's Review:
  {{ARCHITECT_REVIEW}}

  Attack vectors:
  1. What edge cases are missed?
  2. What happens if step N fails?
  3. What assumptions are unvalidated?
  4. What could go wrong in production?
  5. Is anything over-engineered or under-engineered?

  Output format:
  ## Critic Review
  ### Verdict: APPROVE / REVISE / REJECT
  ### Critical Issues (must fix)
  - ...
  ### Concerns (should address)
  - ...
  ### Nitpicks (optional)
  - ...
  ### Consensus Score: X/100"
)
```

### Phase 4: Synthesis Decision

Based on Critic's verdict:

| Verdict | Action |
|---------|--------|
| **APPROVE** (score ≥ 80) | Consensus reached → Finalize plan |
| **REVISE** (score 50-79) | Feed issues back to Planner → Next iteration |
| **REJECT** (score < 50) | Major rework needed → Planner restarts with constraints |

### Iteration Rules

1. **Max 5 iterations** - If no consensus after 5, present best plan + unresolved issues
2. **Progress required** - Each iteration must address previous critique
3. **Escalation** - If stuck, invoke `/deep-interview` to clarify requirements
4. **State persistence** - All iterations saved in `.omd/ralplan/`

## State Management

```
.omd/ralplan/
├── state.json           # Current iteration, phase, scores
├── plan-v1.md           # Initial plan
├── plan-v2.md           # Revised plan
├── architect-v1.md      # Architect reviews
├── critic-v1.md         # Critic reviews
└── final-plan.md        # Consensus plan
```

### state.json Schema

```json
{
  "task": "Original task description",
  "iteration": 2,
  "maxIterations": 5,
  "phase": "critic",
  "consensusScores": [45, 72],
  "status": "in_progress",
  "startedAt": "ISO timestamp",
  "lastUpdated": "ISO timestamp"
}
```

## Output Format

### During Iterations

```
[RALPLAN - ITERATION 2/5]
┌─────────────────────────────────────────────────────────┐
│ ✓ Planner: Plan v2 created (8 steps, 2 assumptions)    │
│ ✓ Architect: APPROVE with 2 minor concerns             │
│ → Critic: Reviewing...                                  │
└─────────────────────────────────────────────────────────┘
```

### On Consensus

```
[RALPLAN - CONSENSUS REACHED]
┌─────────────────────────────────────────────────────────┐
│ Iterations: 3                                           │
│ Final Score: 87/100                                     │
│ Plan saved: .omd/ralplan/final-plan.md                  │
└─────────────────────────────────────────────────────────┘

## Final Plan Summary
- 8 implementation steps
- Estimated complexity: 2S, 4M, 2L
- Key risks: [mitigated]
- Ready for: /ralph or /autopilot
```

## Usage

```
/ralplan [task description]
/rp [task description]
```

### Options

| Flag | Effect |
|------|--------|
| `--max-iterations N` | Set max iterations (default: 5) |
| `--strict` | Require 90+ consensus score |
| `--fast` | Use Sonnet for Planner/Architect (Opus for Critic only) |
| `--resume` | Resume from last saved state |

### Examples

```
/ralplan Implement user authentication with OAuth2
/rp --strict Refactor the payment module for multi-currency
/ralplan --resume
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `/deep-interview` | Invoke if requirements are ambiguous before planning |
| `/ralph` | Execute the consensus plan with persistence |
| `/autopilot` | Full autonomous execution of the plan |
| `/ai-slop-cleaner` | Clean up plan documentation if verbose |

## Anti-Patterns

1. **Rubber-stamping** - Critic must genuinely challenge, not just approve
2. **Infinite loops** - If same issues repeat 2x, escalate to user
3. **Over-planning** - Simple tasks don't need 5 iterations
4. **Ignoring Architect** - Technical concerns must be addressed, not dismissed

## Cancellation

```
/cancel
```

State is preserved for `/ralplan --resume`.

## Example Session

**User:** `/ralplan Add rate limiting to the API`

```
[RALPLAN - ITERATION 1/5]
┌─────────────────────────────────────────────────────────┐
│ Task: Add rate limiting to the API                      │
│ Phase: Planner                                          │
└─────────────────────────────────────────────────────────┘

Spawning Planner agent...
```

*[Planner returns 6-step plan]*

```
[RALPLAN - ITERATION 1/5]
┌─────────────────────────────────────────────────────────┐
│ ✓ Planner: Plan v1 created                              │
│ → Architect: Reviewing...                               │
└─────────────────────────────────────────────────────────┘
```

*[Architect returns REVISE - missing Redis consideration]*

```
[RALPLAN - ITERATION 1/5]
┌─────────────────────────────────────────────────────────┐
│ ✓ Planner: Plan v1 created                              │
│ ✓ Architect: REVISE - needs Redis strategy              │
│ → Critic: Reviewing...                                  │
└─────────────────────────────────────────────────────────┘
```

*[Critic returns score 52/100 - concerns about distributed rate limiting]*

```
[RALPLAN - ITERATION 2/5]
┌─────────────────────────────────────────────────────────┐
│ Previous score: 52/100                                  │
│ Issues to address:                                      │
│   - Redis strategy for distributed limiting             │
│   - Fallback when Redis unavailable                     │
│ → Planner: Creating revised plan...                     │
└─────────────────────────────────────────────────────────┘
```

*[After 3 iterations, consensus at 85/100]*

```
[RALPLAN - CONSENSUS REACHED]
┌─────────────────────────────────────────────────────────┐
│ Iterations: 3                                           │
│ Final Score: 85/100                                     │
│ Plan: .omd/ralplan/final-plan.md                        │
└─────────────────────────────────────────────────────────┘

Ready to execute? Use /ralph or /autopilot
```
