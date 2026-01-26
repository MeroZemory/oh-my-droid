---
name: deepinit
description: Deep codebase initialization with hierarchical DROIDS.md documentation
---

# Deep Init Skill

Creates comprehensive, hierarchical DROIDS.md documentation across the entire codebase.

## Core Concept

DROIDS.md files serve as **AI-readable documentation** that helps droids understand:
- What each directory contains
- How components relate to each other
- Special instructions for working in that area
- Dependencies and relationships

## Hierarchical Tagging System

Every DROIDS.md (except root) includes a parent reference tag:

```markdown
<!-- Parent: ../DROIDS.md -->
```

This creates a navigable hierarchy:
```
/DROIDS.md                          ← Root (no parent tag)
├── src/DROIDS.md                   ← <!-- Parent: ../DROIDS.md -->
│   ├── src/components/DROIDS.md    ← <!-- Parent: ../DROIDS.md -->
│   └── src/utils/DROIDS.md         ← <!-- Parent: ../DROIDS.md -->
└── docs/DROIDS.md                  ← <!-- Parent: ../DROIDS.md -->
```

## DROIDS.md Template

```markdown
<!-- Parent: {relative_path_to_parent}/DROIDS.md -->
<!-- Generated: {timestamp} | Updated: {timestamp} -->

# {Directory Name}

## Purpose
{One-paragraph description of what this directory contains and its role}

## Key Files
{List each significant file with a one-line description}

| File | Description |
|------|-------------|
| `file.ts` | Brief description of purpose |

## Subdirectories
{List each subdirectory with brief purpose}

| Directory | Purpose |
|-----------|---------|
| `subdir/` | What it contains (see `subdir/DROIDS.md`) |

## For AI Droids

### Working In This Directory
{Special instructions for AI droids modifying files here}

### Testing Requirements
{How to test changes in this directory}

### Common Patterns
{Code patterns or conventions used here}

## Dependencies

### Internal
{References to other parts of the codebase this depends on}

### External
{Key external packages/libraries used}

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
```

## Execution Workflow

### Step 1: Map Directory Structure

```
Task(subagent_type="explore", model="haiku",
  prompt="List all directories recursively. Exclude: node_modules, .git, dist, build, __pycache__, .venv, coverage, .next, .nuxt")
```

### Step 2: Create Work Plan

Generate todo items for each directory, organized by depth level:

```
Level 0: / (root)
Level 1: /src, /docs, /tests
Level 2: /src/components, /src/utils, /docs/api
...
```

### Step 3: Generate Level by Level

**IMPORTANT**: Generate parent levels before child levels to ensure parent references are valid.

For each directory:
1. Read all files in the directory
2. Analyze purpose and relationships
3. Generate DROIDS.md content
4. Write file with proper parent reference

### Step 4: Compare and Update (if exists)

When DROIDS.md already exists:

1. **Read existing content**
2. **Identify sections**:
   - Auto-generated sections (can be updated)
   - Manual sections (`<!-- MANUAL -->` preserved)
3. **Compare**:
   - New files added?
   - Files removed?
   - Structure changed?
4. **Merge**:
   - Update auto-generated content
   - Preserve manual annotations
   - Update timestamp

### Step 5: Validate Hierarchy

After generation, run validation checks:

| Check | How to Verify | Corrective Action |
|-------|--------------|-------------------|
| Parent references resolve | Read each DROIDS.md, check `<!-- Parent: -->` path exists | Fix path or remove orphan |
| No orphaned DROIDS.md | Compare DROIDS.md locations to directory structure | Delete orphaned files |
| Completeness | List all directories, check for DROIDS.md | Generate missing files |
| Timestamps current | Check `<!-- Generated: -->` dates | Regenerate outdated files |

Validation script pattern:
```bash
# Find all DROIDS.md files
find . -name "DROIDS.md" -type f

# Check parent references
grep -r "<!-- Parent:" --include="DROIDS.md" .
```

## Smart Delegation

| Task | Droid |
|------|-------|
| Directory mapping | `explore` |
| File analysis | `architect-low` |
| Content generation | `writer` |
| DROIDS.md writes | `writer` |

## Empty Directory Handling

When encountering empty or near-empty directories:

| Condition | Action |
|-----------|--------|
| No files, no subdirectories | **Skip** - do not create DROIDS.md |
| No files, has subdirectories | Create minimal DROIDS.md with subdirectory listing only |
| Has only generated files (*.min.js, *.map) | Skip or minimal DROIDS.md |
| Has only config files | Create DROIDS.md describing configuration purpose |

Example minimal DROIDS.md for directory-only containers:
```markdown
<!-- Parent: ../DROIDS.md -->
# {Directory Name}

## Purpose
Container directory for organizing related modules.

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `subdir/` | Description (see `subdir/DROIDS.md`) |
```

## Parallelization Rules

1. **Same-level directories**: Process in parallel
2. **Different levels**: Sequential (parent first)
3. **Large directories**: Spawn dedicated droid per directory
4. **Small directories**: Batch multiple into one droid

## Quality Standards

### Must Include
- [ ] Accurate file descriptions
- [ ] Correct parent references
- [ ] Subdirectory links
- [ ] AI droid instructions

### Must Avoid
- [ ] Generic boilerplate
- [ ] Incorrect file names
- [ ] Broken parent references
- [ ] Missing important files

## Example Output

### Root DROIDS.md
```markdown
<!-- Generated: 2024-01-15 | Updated: 2024-01-15 -->

# my-project

## Purpose
A web application for managing user tasks with real-time collaboration features.

## Key Files
| File | Description |
|------|-------------|
| `package.json` | Project dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `.env.example` | Environment variable template |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code (see `src/DROIDS.md`) |
| `docs/` | Documentation (see `docs/DROIDS.md`) |
| `tests/` | Test suites (see `tests/DROIDS.md`) |

## For AI Droids

### Working In This Directory
- Always run `npm install` after modifying package.json
- Use TypeScript strict mode
- Follow ESLint rules

### Testing Requirements
- Run `npm test` before committing
- Ensure >80% coverage

### Common Patterns
- Use barrel exports (index.ts)
- Prefer functional components

## Dependencies

### External
- React 18.x - UI framework
- TypeScript 5.x - Type safety
- Vite - Build tool

<!-- MANUAL: Custom project notes can be added below -->
```

### Nested DROIDS.md
```markdown
<!-- Parent: ../DROIDS.md -->
<!-- Generated: 2024-01-15 | Updated: 2024-01-15 -->

# components

## Purpose
Reusable React components organized by feature and complexity.

## Key Files
| File | Description |
|------|-------------|
| `index.ts` | Barrel export for all components |
| `Button.tsx` | Primary button component |
| `Modal.tsx` | Modal dialog component |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `forms/` | Form-related components (see `forms/DROIDS.md`) |
| `layout/` | Layout components (see `layout/DROIDS.md`) |

## For AI Droids

### Working In This Directory
- Each component has its own file
- Use CSS modules for styling
- Export via index.ts

### Testing Requirements
- Unit tests in `__tests__/` subdirectory
- Use React Testing Library

### Common Patterns
- Props interfaces defined above component
- Use forwardRef for DOM-exposing components

## Dependencies

### Internal
- `src/hooks/` - Custom hooks used by components
- `src/utils/` - Utility functions

### External
- `clsx` - Conditional class names
- `lucide-react` - Icons

<!-- MANUAL: -->
```

## Triggering Update Mode

When running on an existing codebase with DROIDS.md files:

1. Detect existing files first
2. Read and parse existing content
3. Analyze current directory state
4. Generate diff between existing and current
5. Apply updates while preserving manual sections

## Performance Considerations

- **Cache directory listings** - Don't re-scan same directories
- **Batch small directories** - Process multiple at once
- **Skip unchanged** - If directory hasn't changed, skip regeneration
- **Parallel writes** - Multiple droids writing different files simultaneously
