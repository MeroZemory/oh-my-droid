---
name: learner
description: Extract a learned skill from the current conversation
---

# Learner Skill

## The Insight

Reusable skills are not code snippets to copy-paste, but **principles and decision-making heuristics** that teach Claude HOW TO THINK about a class of problems.

**The difference:**
- BAD (mimicking): "When you see NetworkException, add this try/catch block"
- GOOD (reusable skill): "In Android async network code, any I/O operation can fail independently due to app/server lifecycle mismatches. The principle: wrap each I/O operation separately, because failure between operations is the common case, not the exception."

A good skill changes how Claude APPROACHES problems, not just what code it produces.

## Why This Matters

Before extracting a skill, ask yourself:
- "Could someone Google this in 5 minutes?" → If yes, STOP. Don't extract.
- "Is this specific to THIS codebase?" → If no, STOP. Don't extract.
- "Did this take real debugging effort to discover?" → If no, STOP. Don't extract.

If a potential skill fails any of these questions, it's not worth saving.

## Recognition Pattern

Use /oh-my-droid:learner ONLY after:
- Solving a tricky Android bug that required deep investigation
- Discovering a non-obvious workaround specific to this codebase
- Finding a hidden gotcha that wastes time when forgotten
- Uncovering undocumented behavior that affects this project

## The Approach

### Extraction Process

**Step 1: Gather Required Information**

- **Problem Statement**: The SPECIFIC error, symptom, or confusion that occurred
  - Include actual error messages, file paths, line numbers
  - Example: "NullPointerException in MainActivity.kt:45 when viewModel is accessed after configuration change"

- **Solution**: The EXACT fix, not general advice
  - Include code snippets, file paths, configuration changes
  - Example: "Add lifecycle observer in onCreate, clear observers in onDestroy"

- **Triggers**: Keywords that would appear when hitting this problem again
  - Use error message fragments, file names, symptom descriptions
  - Example: ["viewModel null", "MainActivity.kt NullPointerException", "configuration change crash"]

- **Scope**: Almost always Project-level unless it's a truly universal insight

**Step 2: Quality Validation**

The system REJECTS skills that are:
- Too generic (no file paths, line numbers, or specific error messages)
- Easily Googleable (standard patterns, library usage)
- Vague solutions (no code snippets or precise instructions)
- Poor triggers (generic words that match everything)

**Step 3: Save Location**

- **User-level**: ~/.factory/skills/omd-learned/ - Rare. Only for truly portable insights.
- **Project-level**: .omd/skills/ - Default. Version-controlled with repo.

### What Makes a USEFUL Skill

**CRITICAL**: Not every solution is worth saving. A good skill is:

1. **Non-Googleable**: Something you couldn't easily find via search
   - BAD: "How to use RecyclerView in Android" ❌
   - GOOD: "This codebase uses custom ViewHolder pooling requiring manual clear() in onViewRecycled" ✓

2. **Context-Specific**: References actual files, error messages, or patterns from THIS codebase
   - BAD: "Use try/catch for error handling" ❌
   - GOOD: "The Retrofit client in ApiService.kt:42 crashes on timeout - wrap enqueue in CoroutineExceptionHandler" ✓

3. **Actionable with Precision**: Tells you exactly WHAT to do and WHERE
   - BAD: "Handle edge cases" ❌
   - GOOD: "When seeing 'Cannot find R.id.xxx' after Gradle sync, check BuildConfig.java exists in build/generated" ✓

4. **Hard-Won**: Required significant debugging effort to discover
   - BAD: Generic Android patterns ❌
   - GOOD: "Race condition in WorkManager - Job scheduled at MainActivity:89 needs unique name to prevent duplicate runs" ✓

### Anti-Patterns (DO NOT EXTRACT)

- Generic Android patterns (use documentation instead)
- Refactoring techniques (these are universal)
- Library usage examples (use library docs)
- Type definitions or boilerplate
- Anything a junior Android dev could Google in 5 minutes

## Skill Format

Skills are saved as markdown with this structure:

### YAML Frontmatter

Standard metadata fields:
- id, name, description, source, triggers, quality

### Body Structure (Required)

```markdown
# [Skill Name]

## The Insight
What is the underlying PRINCIPLE you discovered? Not the code, but the mental model.
Example: "Android lifecycle callbacks are unpredictable. Activity != ViewModel lifecycle."

## Why This Matters
What goes wrong if you don't know this? What symptom led you here?
Example: "App crashes on rotation because observer is registered twice."

## Recognition Pattern
How do you know when this skill applies? What are the signs?
Example: "Building any Activity with LiveData observers and configuration changes"

## The Approach
The decision-making heuristic, not just code. How should Claude THINK about this?
Example: "For each observer, ask: does this survive configuration changes? Handle it in ViewModel."

## Example (Optional)
If code helps, show it - but as illustration of the principle, not copy-paste material.
```

**Key**: A skill is REUSABLE if Claude can apply it to NEW situations, not just identical ones.

## Related Commands

- /oh-my-droid:note - Save quick notes that survive compaction (less formal than skills)
- /oh-my-droid:ralph - Start a development loop with learning capture
