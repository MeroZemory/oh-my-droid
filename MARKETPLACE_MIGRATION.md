# Factory AI Droid Marketplace Migration

This document describes the conversion of oh-my-droid to Factory AI Droid marketplace format.

## Changes Made

### 1. Created templates/ Directory Structure

```
templates/
├── commands/     # Slash commands (8 files)
└── droids/       # Droid definitions (32 files)
```

### 2. Droid Format Updates

All droids in `templates/droids/` have been converted to marketplace format:

**Before (oh-my-droid format):**
```yaml
---
name: executor
description: Focused task executor
model: claude-sonnet-4-5-20250929
reasoningEffort: medium
tools: ["Read", "Edit", "Write", "Bash"]
---
```

**After (marketplace format):**
```yaml
---
name: executor
description: Focused task executor
model: claude-sonnet-4-5-20250929
tools:
  - Read
  - Edit
  - Write
  - Bash
version: v1
---
```

**Key changes:**
- ❌ Removed `reasoningEffort` field
- ✅ Added `version: v1` field
- ✅ Converted `tools` from JSON array to YAML list format

### 3. Created Slash Commands

Converted key skills to slash command format in `templates/commands/`:

| Command | Source Skill | Description |
|---------|--------------|-------------|
| `analyze.md` | analyze | Deep analysis and debugging |
| `build-fix.md` | build-fix | Fix build and type errors |
| `code-review.md` | code-review | Comprehensive code review |
| `deep-search.md` | deepsearch | Thorough codebase search |
| `release-notes.md` | release | Generate release notes |
| `security-review.md` | security-review | Security audit |
| `tdd.md` | tdd | Test-Driven Development |
| `test-plan.md` | - | Test plan generation |

Each command has:
- YAML frontmatter with `description` and `argument-hint`
- Orchestration logic that delegates to specialized droids
- Structured output format
- Clear workflow and verification steps

## Directory Layout

```
oh-my-droid/
├── droids/              # Original droids (unchanged)
├── templates/           # NEW: Marketplace format
│   ├── commands/        # 8 slash commands
│   ├── droids/          # 32 droids (marketplace format)
│   └── README.md        # Template documentation
├── skills/              # Original skills (unchanged)
└── scripts/             # Conversion scripts
    ├── convert-droids-format.js
    └── convert-remaining-droids.sh
```

## Droids Available

### By Model Tier

**Opus (claude-opus-4-5-20251101)** - 11 droids
- architect, analyst, critic, planner
- executor-high, designer-high, qa-tester-high, scientist-high
- code-reviewer, security-reviewer, explore-high

**Sonnet (claude-sonnet-4-5-20250929)** - 12 droids
- executor, architect-medium, designer, explore-medium
- researcher, scientist, qa-tester, tdd-guide, build-fixer
- vision

**Inherit/Haiku** - 9 droids
- executor-low, architect-low, designer-low, explore
- researcher-low, scientist-low, security-reviewer-low
- code-reviewer-low, build-fixer-low, tdd-guide-low, writer

### By Domain

**Analysis:** architect, architect-medium, architect-low, analyst, critic
**Execution:** executor, executor-high, executor-low
**Search:** explore, explore-medium, explore-high
**Frontend:** designer, designer-high, designer-low
**Code Quality:** code-reviewer, code-reviewer-low, security-reviewer, security-reviewer-low
**Testing:** qa-tester, qa-tester-high, tdd-guide, tdd-guide-low
**Build:** build-fixer, build-fixer-low
**Documentation:** writer
**Research:** researcher, researcher-low, scientist, scientist-high, scientist-low
**Planning:** planner
**Vision:** vision

## Usage in Factory AI

### Import Droids

Copy droids from `templates/droids/` to your Factory AI project's droid directory.

### Import Commands

Copy commands from `templates/commands/` to your Factory AI project's command directory.

### Reference Droids in Commands

Commands orchestrate droids using the Task tool:

```
Task(
  subagent_type="oh-my-droid:executor",
  model="sonnet",
  prompt="Implement feature X..."
)
```

## Verification

All droids have been verified to have:
- ✅ Proper YAML frontmatter with `---` delimiters
- ✅ `name` field matching filename
- ✅ `description` field
- ✅ `model` field (inherit, sonnet, or opus)
- ✅ `tools` as YAML list (not JSON array)
- ✅ `version: v1` field
- ✅ No `reasoningEffort` field

## Backward Compatibility

The original `droids/` and `skills/` directories are **unchanged**. The `templates/` directory is a new addition that can coexist with the original structure.

This allows:
1. Continued use of oh-my-droid in its current form
2. Export to Factory AI marketplace using `templates/`
3. Future migration path without breaking existing setups

## Next Steps

To publish to Factory AI marketplace:

1. Test droids and commands in Factory AI environment
2. Add example usage and screenshots
3. Create marketplace listing with:
   - Description
   - Use cases
   - Installation instructions
   - Pricing model (if applicable)

## Scripts Used

Conversion was automated using:

1. **convert-droids-format.js** - Converted droids with standard YAML frontmatter
2. **convert-remaining-droids.sh** - Handled droids with non-standard format (explore, scientist, designer variants)

These scripts are preserved in `scripts/` for reference and future updates.
