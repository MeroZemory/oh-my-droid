---
name: local-skills-setup
description: Set up and manage local skills for automatic matching and invocation
argument-hint: "[list|add|scan]"
---

# Local Skills Setup

This skill provides a guided wizard for setting up and managing your local learned skills. Skills are reusable problem-solving patterns that Claude automatically applies when it detects matching triggers.

## Why Local Skills?

Local skills allow you to capture hard-won insights and solutions that are specific to your Android codebase or workflow:
- **Project-level skills** (.omd/skills/) - Version-controlled with your repo
- **User-level skills** (~/.factory/skills/omd-learned/) - Portable across all your Android projects

When you solve a tricky Android bug or discover a non-obvious workaround, you can extract it as a skill. Claude will automatically detect and apply these skills in future conversations when it sees matching triggers.

## Interactive Workflow

### Step 1: Directory Check and Setup

First, check if skill directories exist and create them if needed:

```bash
# Check and create user-level skills directory
USER_SKILLS_DIR="$HOME/.factory/skills/omd-learned"
if [ -d "$USER_SKILLS_DIR" ]; then
  echo "User skills directory exists: $USER_SKILLS_DIR"
else
  mkdir -p "$USER_SKILLS_DIR"
  echo "Created user skills directory: $USER_SKILLS_DIR"
fi

# Check and create project-level skills directory
PROJECT_SKILLS_DIR=".omd/skills"
if [ -d "$PROJECT_SKILLS_DIR" ]; then
  echo "Project skills directory exists: $PROJECT_SKILLS_DIR"
else
  mkdir -p "$PROJECT_SKILLS_DIR"
  echo "Created project skills directory: $PROJECT_SKILLS_DIR"
fi
```

### Step 2: Skill Scan and Inventory

Scan both directories and show a comprehensive inventory of Android-specific skills.

### Step 3: Quick Actions Menu

After scanning, use the AskUserQuestion tool to offer these options:

**Question:** "What would you like to do with your local skills?"

**Options:**
1. **Add new skill** - Start the skill creation wizard
2. **List all skills with details** - Show comprehensive skill inventory with triggers
3. **Scan conversation for patterns** - Analyze current conversation for skill-worthy Android patterns
4. **Import skill** - Import a skill from URL or paste content
5. **Done** - Exit the wizard

#### Option 1: Add New Skill

If user chooses "Add new skill", invoke the learner skill:

```
Use the Skill tool to invoke: learner
```

This will guide them through the extraction process with quality validation.

#### Option 3: Scan Conversation for Patterns

Analyze the current conversation context to identify potential skill-worthy Android patterns. Look for:
- Recent debugging sessions with non-obvious solutions
- Tricky Android bugs that required investigation
- Codebase-specific workarounds discovered
- Lifecycle, Gradle, or architecture error patterns that took time to resolve

Report findings and ask if user wants to extract any as skills.

## Skill Templates

Provide quick templates for common Android skill types:

### Android Error Solution Template

```markdown
---
id: android-error-[unique-id]
name: [Error Name]
description: Solution for [specific Android error in specific context]
source: conversation
triggers: ["error message fragment", "Activity/Fragment name", "symptom"]
quality: high
---

# [Error Name]

## The Insight
What is the underlying cause of this Android error? What principle did you discover?

## Why This Matters
What goes wrong if you don't know this? What symptom led here?

## Recognition Pattern
How do you know when this applies? What are the signs?
- Error message: "[exact error]"
- Component: [Activity/Fragment/ViewModel]
- Context: [when does this occur]

## The Approach
Step-by-step solution:
1. [Specific action with file/line reference]
2. [Specific action with file/line reference]
3. [Verification step]

## Example
\`\`\`kotlin
// Before (broken)
[problematic code]

// After (fixed)
[corrected code]
\`\`\`
```

### Lifecycle Skill Template

```markdown
---
id: lifecycle-[unique-id]
name: [Lifecycle Issue Name]
description: Pattern for [specific lifecycle issue in this codebase]
source: conversation
triggers: ["lifecycle keyword", "component name", "crash symptom"]
quality: high
---

# [Lifecycle Issue Name]

## The Insight
What makes this lifecycle issue different from the obvious approach?

## Why This Matters
What fails if you don't follow this process?

## Recognition Pattern
When should you apply this pattern?
- Component type: [Activity/Fragment/ViewModel]
- Lifecycle stage: [onCreate/onStart/onResume etc]
- Indicators: [how to recognize]

## The Approach
1. [Step with specific lifecycle methods]
2. [Step with specific state handling]
3. [Verification]

## Gotchas
- [Common lifecycle mistake and how to avoid it]
- [Edge case and how to handle it]
```

## Usage Modes

### Direct Command Mode

When invoked with an argument, skip the interactive wizard:

- `/oh-my-droid:local-skills-setup list` - Show detailed skill inventory
- `/oh-my-droid:local-skills-setup add` - Start skill creation (invoke learner)
- `/oh-my-droid:local-skills-setup scan` - Scan both skill directories

### Interactive Mode

When invoked without arguments, run the full guided wizard.

## Skill Quality Guidelines

Remind users that good Android skills are:

1. **Non-Googleable** - Can't easily find via search
   - BAD: "How to use RecyclerView in Android" ❌
   - GOOD: "This codebase uses custom ViewHolder pooling requiring manual clear() in onViewRecycled" ✓

2. **Context-Specific** - References actual files/errors from THIS Android codebase
   - BAD: "Use try/catch for error handling" ❌
   - GOOD: "The Retrofit client in ApiService.kt:42 crashes on timeout - wrap enqueue in CoroutineExceptionHandler" ✓

3. **Actionable with Precision** - Tells exactly WHAT to do and WHERE
   - BAD: "Handle lifecycle events" ❌
   - GOOD: "When seeing 'ViewModelScope cancelled' in MainViewModel, check lifecycle observer registration in onCreate" ✓

4. **Hard-Won** - Required significant Android debugging effort
   - BAD: Generic Android patterns ❌
   - GOOD: "Race condition in WorkManager - Job scheduled at MainActivity:89 needs unique name to prevent duplicate runs" ✓

## Benefits of Local Skills

**Automatic Application**: Claude detects triggers and applies Android skills automatically - no need to remember or search for solutions.

**Version Control**: Project-level skills (.omd/skills/) are committed with your code, so the whole team benefits.

**Evolving Knowledge**: Skills improve over time as you discover better Android approaches and refine triggers.

**Android-Specific**: Captures knowledge about lifecycle, Gradle, architecture patterns, and framework quirks.

## Related Skills

- `/oh-my-droid:learner` - Extract a skill from current conversation
- `/oh-my-droid:note` - Save quick notes (less formal than skills)
- `/oh-my-droid:deepinit` - Generate AGENTS.md codebase hierarchy
