# Oh-My-Droid Templates

This directory contains templates for the Factory AI Droid marketplace format.

## Structure

```
templates/
├── commands/    # Slash command definitions
└── droids/      # Droid (agent) definitions
```

## Commands

Slash commands are high-level workflows that orchestrate multiple droids:

- `analyze.md` - Deep analysis and debugging of code, issues, or architecture
- `build-fix.md` - Fix build errors and type issues
- `code-review.md` - Comprehensive code review for quality, security, and maintainability
- `deep-search.md` - Thorough codebase search for patterns and concepts
- `release-notes.md` - Generate release notes from git commits
- `security-review.md` - Comprehensive security audit
- `tdd.md` - Test-Driven Development workflow
- `test-plan.md` - Generate comprehensive test plans

### Command Format

Each command file has YAML frontmatter:

```yaml
---
description: What this command does
argument-hint: <optional-args>
---
```

Followed by the command implementation that orchestrates droids.

## Droids

Droids are specialized AI agents with specific roles. Each droid has:

### Droid Format

```yaml
---
name: droid-name
description: When to use this droid
model: inherit | claude-sonnet-4-5-20250929 | claude-opus-4-5-20251101
tools:
  - Read
  - Edit
  - Bash
  - etc.
version: v1
---
```

### Available Droids

#### Analysis & Architecture
- `architect` (Opus) - Strategic architecture and debugging advisor
- `architect-medium` (Sonnet) - Mid-tier architectural analysis
- `architect-low` (Haiku) - Quick architectural checks
- `analyst` (Opus) - Pre-planning requirements analysis
- `critic` (Opus) - Plan review and critique

#### Execution
- `executor` (Sonnet) - Standard task execution
- `executor-high` (Opus) - Complex implementation work
- `executor-low` (Haiku) - Simple, quick tasks

#### Search & Exploration
- `explore` (Inherit) - Fast codebase search
- `explore-medium` (Sonnet) - Thorough search with reasoning
- `explore-high` (Opus) - Complex architectural search

#### Frontend & Design
- `designer` (Sonnet) - UI/UX design and implementation
- `designer-high` (Opus) - Complex UI architecture and design systems
- `designer-low` (Inherit) - Simple styling tweaks

#### Code Quality
- `code-reviewer` (Opus) - Comprehensive code review
- `code-reviewer-low` (Inherit) - Quick code checks
- `security-reviewer` (Opus) - Security audit
- `security-reviewer-low` (Inherit) - Quick security scan

#### Testing
- `qa-tester` (Sonnet) - Interactive testing and QA
- `qa-tester-high` (Opus) - Advanced testing scenarios
- `tdd-guide` (Sonnet) - Test-Driven Development workflow
- `tdd-guide-low` (Inherit) - Simple TDD guidance

#### Build & Maintenance
- `build-fixer` (Sonnet) - Fix build and type errors
- `build-fixer-low` (Inherit) - Quick build fixes

#### Documentation & Writing
- `writer` (Inherit) - Technical documentation

#### Research & Data
- `researcher` (Sonnet) - Documentation and API research
- `researcher-low` (Inherit) - Quick lookups
- `scientist` (Sonnet) - Data analysis and research
- `scientist-high` (Opus) - Complex research and ML
- `scientist-low` (Inherit) - Quick data inspection

#### Planning
- `planner` (Opus) - Strategic planning and requirements gathering

#### Vision
- `vision` (Sonnet) - Image and diagram analysis

## Model Tiers

- **Haiku** (`inherit` or `claude-3-7-haiku-20250219`) - Fast, simple tasks
- **Sonnet** (`claude-sonnet-4-5-20250929`) - Standard work
- **Opus** (`claude-opus-4-5-20251101`) - Complex reasoning

## Usage in Factory AI

These templates can be imported into Factory AI Droid marketplace to create a full multi-agent system.

Commands provide the user-facing interface, while droids are the specialized workers that commands delegate to.
