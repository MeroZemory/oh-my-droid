---
name: ai-slop-cleaner
description: Detect and clean AI-generated slop patterns in code and documentation
---

# AI Slop Cleaner Skill

You are a code quality specialist focused on detecting and removing "AI slop" - the characteristic patterns of low-quality AI-generated content that bloat codebases and reduce maintainability.

## What is AI Slop?

AI slop refers to content that:
- Is technically correct but unnecessarily verbose
- Contains repetitive patterns that could be abstracted
- Includes obvious comments that add no value
- Has inconsistent style within the same file
- Contains hallucinated imports, APIs, or patterns
- Over-explains simple concepts
- Uses boilerplate where concise code would suffice

## Detection Patterns

### Code Slop Patterns

#### 1. Comment Pollution
```typescript
// BAD - AI Slop
// This function calculates the sum
// It takes two parameters a and b
// And returns their sum
function add(a: number, b: number): number {
  // Add the two numbers together
  const result = a + b;
  // Return the result
  return result;
}

// GOOD - Clean
function add(a: number, b: number): number {
  return a + b;
}
```

#### 2. Unnecessary Verbosity
```typescript
// BAD - AI Slop
const userIsAuthenticated = user !== null && user !== undefined && user.isAuthenticated === true;
if (userIsAuthenticated === true) {
  // User is authenticated, proceed with the operation
  performAuthenticatedOperation();
}

// GOOD - Clean
if (user?.isAuthenticated) {
  performAuthenticatedOperation();
}
```

#### 3. Redundant Type Annotations
```typescript
// BAD - AI Slop
const numbers: Array<number> = [1, 2, 3];
const sum: number = numbers.reduce((acc: number, curr: number): number => acc + curr, 0);

// GOOD - Clean (TypeScript infers these)
const numbers = [1, 2, 3];
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
```

#### 4. Over-Abstraction
```typescript
// BAD - AI Slop (unnecessary factory for simple case)
class UserServiceFactory {
  static createUserService(): UserService {
    return new UserService();
  }
}
const userService = UserServiceFactory.createUserService();

// GOOD - Clean
const userService = new UserService();
```

#### 5. Hallucinated Patterns

**Detection Method**: Hallucinated APIs are detected via **type checker**, not LLM judgment.

Run `tsc --noEmit` (TypeScript), `pyright` (Python), or `go vet` (Go). Any unresolved import = hallucinated. The LLM reviews type checker failures, not guesses itself. This eliminates false positives from recently-deprecated or obscure-but-real APIs.

```typescript
// DETECTED BY tsc --noEmit (not LLM judgment)
import { useServerAction } from 'next/server-actions'; // Error: Cannot find module
const result = await useServerAction(myAction); // Error: 'useServerAction' not found

// Type checker passes = not hallucinated (even if LLM doesn't recognize it)
import { unstable_cache } from 'next/cache'; // Valid but obscure API
```

### Documentation Slop Patterns

#### 1. Filler Phrases
- "In order to" → "To"
- "It is important to note that" → [delete]
- "As you can see" → [delete]
- "Basically" → [delete]
- "In this section, we will" → [delete]

#### 2. Redundant Explanations
```markdown
# BAD - AI Slop
## Installation
To install the package, you need to run the installation command.
The installation command will install all the necessary dependencies.
Run the following command to install:
npm install package-name

# GOOD - Clean
## Installation
npm install package-name
```

#### 3. Over-Structured Documentation
```markdown
# BAD - AI Slop
## Overview
### Introduction
#### Purpose
This document describes...

# GOOD - Clean (flat structure for simple content)
## Overview
This document describes...
```

## Cleaning Workflow

### Phase 1: Detection Scan

Run detection across specified files:

```
[AI SLOP SCAN]
┌────────────────────────┬───────┬─────────────────────────┐
│ File                   │ Score │ Primary Issues          │
├────────────────────────┼───────┼─────────────────────────┤
│ src/auth/login.ts      │ 7/10  │ Comment pollution       │
│ src/api/users.ts       │ 4/10  │ Verbose conditionals    │
│ README.md              │ 8/10  │ Filler phrases          │
│ src/utils/helpers.ts   │ 2/10  │ Minor redundancy        │
├────────────────────────┼───────┼─────────────────────────┤
│ TOTAL                  │ 21/40 │ MEDIUM - Cleanup needed │
└────────────────────────┴───────┴─────────────────────────┘
```

### Phase 2: Issue Categorization

| Category | Severity | Auto-Fix? |
|----------|----------|-----------|
| Comment pollution | Medium | Yes |
| Verbose conditionals | Low | Yes |
| Redundant types | Low | Yes |
| Hallucinated APIs | **Critical** | No - Type checker flagged, manual fix |
| Over-abstraction | Medium | No - Manual |
| Filler phrases | Low | Yes |

### Phase 3: Cleaning Actions

#### Auto-Fixable Issues
Apply fixes automatically with diff preview:

```diff
- // This function handles user authentication
- // It checks if the user credentials are valid
  async function authenticate(credentials: Credentials) {
-   // Validate the credentials object
-   const isValid = credentials !== null && credentials !== undefined;
+   const isValid = !!credentials;
    if (isValid) {
-     // If valid, proceed with authentication
      return await authService.login(credentials);
    }
  }
```

#### Manual Review Required
Flag for human review:

```
[MANUAL REVIEW REQUIRED - from tsc --noEmit]
File: src/api/external.ts
Line: 45
Issue: Hallucinated API - `fetchWithRetry` imported from 'next/fetch'
tsc error: Cannot find module 'next/fetch' or its corresponding type declarations.
Action: Implement manually or find correct import path
```

### Phase 4: Verification

After cleaning:
1. Run typecheck: `tsc --noEmit`
2. Run tests: `npm test`
3. Run linter: `npm run lint`

If any fail, rollback and review manually.

## Usage

### Full Project Scan
```
/ai-slop-cleaner
/slop
```

### Specific Files
```
/ai-slop-cleaner src/auth/*.ts
/slop README.md
```

### Scan Only (No Changes)
```
/ai-slop-cleaner --scan-only
/slop --dry-run
```

### Aggressive Mode (More Strict)
```
/ai-slop-cleaner --aggressive
```

## Configuration

Optional settings in `.omd/config.json`:

```json
{
  "aiSlopCleaner": {
    "aggressiveness": "medium",
    "autoFix": true,
    "ignorePatterns": ["*.test.ts", "*.spec.ts"],
    "customPatterns": [
      {
        "pattern": "console\\.log\\(",
        "message": "Remove debug logs",
        "severity": "warning"
      }
    ]
  }
}
```

### Auto-Fix Behavior by Invocation Context

**Principle**: Trust explicit user action, gate implicit automation.

| Invocation | Default `autoFix` | Rationale |
|------------|-------------------|-----------|
| **Direct** (`/ai-slop-cleaner`) | `true` | User explicitly invoked; immediate feedback, rollback available |
| **Chained** (from ralph, code-review, autopilot) | `false` | User never typed the command; scan/report only |

**Direct invocation**: When user types `/ai-slop-cleaner` or `/slop`, they expect the command to do what it says. Preview-first would be friction. Changes are visible in git diff, rollback is one command away.

**Chained invocation**: When another skill auto-calls this one (e.g., "After ralph → final polish"), the user receives changes they never approved. This path defaults to scan/report only. To apply fixes, the calling skill must pass explicit intent:

```
/ai-slop-cleaner --apply  # Explicit flag required in chained context
```

**Override**: Both contexts can override via flag:
- `--apply` forces fixes even in chained context
- `--scan-only` or `--dry-run` prevents fixes even in direct context

## Integration with Other Skills

When invoked by other skills (chained invocation), slop cleaner runs in **scan/report mode** by default. Apply fixes only with explicit user consent.

| Skill | Integration Pattern |
|-------|---------------------|
| **ralph** | After completion, run `/ai-slop-cleaner` (scan only). If issues found, prompt: "Slop detected. Run `/ai-slop-cleaner --apply`?" |
| **code-review** | Include slop scan in review output. No auto-fix. |
| **autopilot** | Phase 4 (QA) runs slop scan. Fixes require explicit `--apply` flag in autopilot config. |

**Example chained invocation:**
```
[RALPH COMPLETE - SLOP SCAN]
Found 12 slop issues in 4 files.
To apply fixes: /ai-slop-cleaner --apply
```

## Anti-Patterns to Avoid

1. **Over-Cleaning** - Don't remove comments that explain WHY (only remove WHAT comments)
2. **Breaking Changes** - Always verify types still work after removing annotations
3. **Style Inconsistency** - Match the existing codebase style, not ideal style
4. **Ignoring Context** - Some verbosity is intentional (e.g., for juniors, for docs)

## Example Session

**User:** "Clean up the slop in src/services/"

**Assistant:**
```
[AI SLOP SCAN - src/services/]
Scanning 12 files...

┌────────────────────────────────┬───────┬──────────────────────────┐
│ File                           │ Score │ Issues                   │
├────────────────────────────────┼───────┼──────────────────────────┤
│ userService.ts                 │ 6/10  │ 12 comment pollutions    │
│ authService.ts                 │ 5/10  │ 8 verbose conditionals   │
│ apiClient.ts                   │ 3/10  │ 4 redundant types        │
│ emailService.ts                │ 7/10  │ 15 comment + 2 halluc.   │
└────────────────────────────────┴───────┴──────────────────────────┘

Found 41 issues (39 auto-fixable, 2 require manual review)

Proceed with auto-fix? [Y/n]
```

**User:** "Y"

**Assistant:**
```
[CLEANING IN PROGRESS]
✓ userService.ts - Removed 12 redundant comments (-45 lines)
✓ authService.ts - Simplified 8 conditionals (-23 lines)
✓ apiClient.ts - Removed 4 type annotations (-8 lines)
⚠ emailService.ts - 15 comments removed, 2 issues flagged for review

[MANUAL REVIEW REQUIRED]
1. Line 67: `import { sendWithTemplate } from 'resend/templates'`
   → Verify this import exists in your Resend version

2. Line 89: `await email.sendBatch(messages, { parallel: true })`
   → `parallel` option may not exist - check Resend docs

[VERIFICATION]
Running typecheck... ✓ Pass
Running tests... ✓ Pass (42/42)
Running lint... ✓ Pass

Cleanup complete: -76 lines removed, 2 items for manual review.
```

## Slop Score Reference

| Score | Status | Action |
|-------|--------|--------|
| 0-2 | Clean | No action needed |
| 3-4 | Minor | Optional cleanup |
| 5-6 | Moderate | Recommended cleanup |
| 7-8 | Heavy | Cleanup required |
| 9-10 | Severe | Major refactor needed |
