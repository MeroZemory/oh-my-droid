# oh-my-droid Skills

Core execution mode skills for the oh-my-droid plugin.

## Part 1 - Execution Modes (7 Skills)

### 1. ultrawork
**Path:** `skills/ultrawork/SKILL.md`
**Description:** Maximum parallel execution mode with droid orchestration
**Key Features:**
- Parallel execution of multiple droids
- Aggressive delegation to specialists
- Smart model routing (Haiku → Sonnet → Opus)
- Background operations for long tasks
- Verification checklist enforcement

### 2. ralph
**Path:** `skills/ralph/SKILL.md`
**Description:** Self-referential loop until task completion with architect verification
**Key Features:**
- Persistence loop (never stops until verified complete)
- Optional PRD mode (--prd flag)
- Auto-activates Ultrawork for parallelism
- Mandatory architect verification before completion
- Iron law: No completion claims without fresh evidence

### 3. autopilot
**Path:** `skills/autopilot/SKILL.md`
**Description:** Full autonomous execution from idea to working Android app
**Key Features:**
- 5-phase execution (Expansion → Planning → Execution → QA → Validation)
- Handles everything from vague idea to tested code
- Multi-droid orchestration
- Automated QA cycles
- Multi-perspective validation

### 4. ecomode
**Path:** `skills/ecomode/SKILL.md`
**Description:** Token-efficient parallel execution using Haiku and Sonnet droids
**Key Features:**
- Prefers LOW tier (Haiku) by default
- Escalates to MEDIUM (Sonnet) only when needed
- Avoids HIGH tier (Opus) unless essential
- Token-conscious routing rules
- Cost optimization focus

### 5. ultrapilot
**Path:** `skills/ultrapilot/SKILL.md`
**Description:** Parallel autopilot with file ownership partitioning
**Key Features:**
- Decomposes tasks into parallel-safe components
- File ownership partitioning (no conflicts)
- Up to 5 parallel workers
- 3-5x faster than sequential autopilot
- Integration phase for shared files

### 6. swarm
**Path:** `skills/swarm/SKILL.md`
**Description:** N coordinated droids on shared task list with atomic claiming
**Key Features:**
- Spawn 1-5 droids of same type
- Shared task list with atomic claiming
- Auto-balancing (fast droids claim more tasks)
- Timeout enforcement and auto-release
- Progress tracking

### 7. pipeline
**Path:** `skills/pipeline/SKILL.md`
**Description:** Chain droids together in sequential or branching workflows
**Key Features:**
- Sequential pipelines (A → B → C)
- Branching pipelines (conditional routing)
- Parallel-then-merge pipelines
- Built-in presets (review, implement, debug, etc.)
- Data passing between stages

## Skill Comparison

| Skill | Speed | Complexity | Best For |
|-------|-------|------------|----------|
| ultrawork | Fast (parallel) | Medium | Multi-task workflows |
| ralph | Varies | Low | Persistent execution until done |
| autopilot | Slow (sequential) | High | Full autonomous builds |
| ecomode | Fast (parallel) | Medium | Token-efficient execution |
| ultrapilot | Very Fast (5x) | High | Multi-component systems |
| swarm | Very Fast | Medium | Many similar tasks |
| pipeline | Varies | Medium | Staged workflows |

## When to Use Each

- **Need full autonomous build?** → `autopilot`
- **Want maximum speed?** → `ultrapilot` (if parallelizable) or `swarm`
- **Need token efficiency?** → `ecomode`
- **Want persistence until done?** → `ralph`
- **Need parallel execution?** → `ultrawork`
- **Have many similar tasks?** → `swarm`
- **Need staged workflow?** → `pipeline`

## Adaptation Notes

These skills are adapted from oh-my-claudecode with the following changes:

1. **Terminology**: "agent" → "droid", ".omc" → ".omd"
2. **Android-specific**: Added Android build commands (./gradlew, APK/AAB)
3. **File patterns**: Updated for Android project structure
4. **Examples**: Changed to Android-specific use cases
5. **Build verification**: Added Android build success checks

## Directory Structure

```
skills/
├── README.md (this file)
├── autopilot/
│   └── SKILL.md
├── build-fix/
│   └── SKILL.md
├── code-review/
│   └── SKILL.md
├── ecomode/
│   └── SKILL.md
├── frontend-ui-ux/
│   └── SKILL.md
├── git-master/
│   └── SKILL.md
├── pipeline/
│   └── SKILL.md
├── ralph/
│   └── SKILL.md
├── ralph-init/
│   └── SKILL.md
├── security-review/
│   └── SKILL.md
├── swarm/
│   └── SKILL.md
├── tdd/
│   └── SKILL.md
├── ultrapilot/
│   └── SKILL.md
├── ultraqa/
│   └── SKILL.md
└── ultrawork/
    └── SKILL.md
```

## Part 3 - Development Workflow (8 Skills)

### 1. ultraqa
**Path:** `skills/ultraqa/SKILL.md`
**Description:** QA cycling workflow - test, verify, fix, repeat until goal met
**Key Features:**
- Autonomous QA cycles (test → diagnose → fix → repeat)
- Supports tests, build, lint, typecheck, custom goals
- Architect-guided diagnosis on failures
- Max 5 cycles with early exit on repeated failures
- State tracking and cancellation support

### 2. tdd
**Path:** `skills/tdd/SKILL.md`
**Description:** Test-Driven Development enforcement skill - write tests first, always
**Key Features:**
- Iron law: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
- Red-Green-Refactor cycle enforcement
- Strict discipline enforcement (deletes code written before tests)
- Verification after each phase
- Educational output format

### 3. frontend-ui-ux
**Path:** `skills/frontend-ui-ux/SKILL.md`
**Description:** Designer-turned-developer who crafts stunning UI/UX
**Key Features:**
- Bold aesthetic direction selection
- Anti-generic design principles
- Typography, color, motion guidelines
- Spatial composition techniques
- Avoids AI slop patterns (purple gradients, Inter font, etc.)

### 4. git-master
**Path:** `skills/git-master/SKILL.md`
**Description:** Git expert for atomic commits, rebasing, and history management
**Key Features:**
- Multiple commits by default (ONE COMMIT = FAILURE)
- Commit style detection (Korean/English, Semantic/Plain)
- Atomic commit splitting rules
- History search commands
- Rebase safety protocols

### 5. ralph-init
**Path:** `skills/ralph-init/SKILL.md`
**Description:** Initialize a PRD (Product Requirements Document) for structured ralph-loop
**Key Features:**
- Creates `.omc/prd.json` with user stories
- Creates `.omc/progress.txt` for tracking
- Right-sized, verifiable stories
- Priority ordering guidance
- Integration with ralph-loop

### 6. build-fix
**Path:** `skills/build-fix/SKILL.md`
**Description:** Fix build and TypeScript errors with minimal changes
**Key Features:**
- Delegates to build-fixer droid (Sonnet)
- Minimal diff strategy (no refactoring)
- Error categorization and prioritization
- Verification after each fix
- Stops when build passes

### 7. code-review
**Path:** `skills/code-review/SKILL.md`
**Description:** Run a comprehensive code review
**Key Features:**
- Delegates to code-reviewer droid (Opus)
- Multi-category review (security, quality, performance, best practices)
- Severity rating (CRITICAL, HIGH, MEDIUM, LOW)
- Specific file:line locations
- Approval recommendations

### 8. security-review
**Path:** `skills/security-review/SKILL.md`
**Description:** Run a comprehensive security review on code
**Key Features:**
- Delegates to security-reviewer droid (Opus)
- OWASP Top 10 scan
- Secrets detection (hardcoded keys, passwords, tokens)
- Input validation review
- Dependency vulnerability scan (npm audit)
- Remediation priority guidance

## Next Steps

To complete the oh-my-droid plugin, create:

1. **Part 2 - Planning & Analysis Skills**: planner, critic, analyst, deepsearch, etc.
2. **Part 4 - Utility Skills**: cancel, note, doctor, help, etc.
3. **Droids**: Implement the 28 specialized droids
4. **Integration**: Wire skills and droids into the plugin system

## References

- Original oh-my-claudecode skills: `/Users/merozemory/projects/t-soft/oh-my-droid/oh-my-claudecode/skills/`
- Claude Code documentation: https://github.com/anthropics/claude-code
