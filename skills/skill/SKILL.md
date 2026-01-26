---
name: skill
description: Manage local skills - list, add, remove, search, edit
argument-hint: "<command> [args]"
---

# Skill Management CLI

Meta-skill for managing oh-my-droid skills via CLI-like commands.

## Subcommands

### /skill list

Show all local skills organized by scope.

**Behavior:**
1. Scan user skills at `~/.factory/skills/omd-learned/`
2. Scan project skills at `.omd/skills/`
3. Parse YAML frontmatter for metadata
4. Display in organized table format

**Fallback:** If quality/usage stats not available, show "N/A"

---

### /skill add [name]

Interactive wizard for creating a new skill.

**Behavior:**
1. **Ask for skill name** (if not provided in command)
   - Validate: lowercase, hyphens only, no spaces
2. **Ask for description**
   - Clear, concise one-liner
3. **Ask for triggers** (comma-separated keywords)
   - Example: "viewmodel, lifecycle, crash"
4. **Ask for argument hint** (optional)
   - Example: "<activity> [fragment]"
5. **Ask for scope:**
   - `user` → `~/.factory/skills/omd-learned/<name>/SKILL.md`
   - `project` → `.omd/skills/<name>/SKILL.md`
6. **Create skill file** with template

---

### /skill remove <name>

Remove a skill by name.

**Behavior:**
1. **Search for skill** in both scopes
2. **If found:**
   - Display skill info (name, description, scope)
   - **Ask for confirmation:** "Delete '<name>' skill from <scope>? (yes/no)"
3. **If confirmed:**
   - Delete entire skill directory
   - Report: "✓ Removed skill '<name>' from <scope>"

**Safety:** Never delete without explicit user confirmation.

---

### /skill edit <name>

Edit an existing skill interactively.

**Behavior:**
1. **Find skill** by name (search both scopes)
2. **Read current content** via Read tool
3. **Display current values**
4. **Ask what to change:**
   - `description` - Update description
   - `triggers` - Update trigger keywords
   - `argument-hint` - Update argument hint
   - `content` - Edit full markdown content
   - `rename` - Rename skill (move file)
   - `cancel` - Exit without changes
5. **For selected field:**
   - Show current value
   - Ask for new value
   - Update YAML frontmatter or content
   - Write back to file
6. **Report success** with summary of changes

---

### /skill search <query>

Search skills by content, triggers, name, or description.

**Behavior:**
1. **Scan all skills** in both scopes
2. **Match query** (case-insensitive) against:
   - Skill name
   - Description
   - Triggers
   - Full markdown content
3. **Display matches** with context

**Ranking:** Prioritize matches in name/triggers over content matches

---

### /skill info <name>

Show detailed information about a skill.

**Behavior:**
1. **Find skill** by name (search both scopes)
2. **Parse YAML frontmatter** and content
3. **Display complete details**

**If not found:** Report error with suggestion to use `/skill search`

---

### /skill sync

Sync skills between user and project scopes.

**Behavior:**
1. **Scan both scopes**
2. **Compare and categorize:**
   - User-only skills (not in project)
   - Project-only skills (not in user)
   - Common skills (in both)
3. **Display sync opportunities**
4. **Handle user choice:**
   - Option 1: Select skill(s) to copy to project
   - Option 2: Select skill(s) to copy to user
   - Option 3: Show side-by-side diff for common skills
   - Option 4: Exit

**Safety:** Never overwrite without confirmation

---

## Error Handling

**All commands must handle:**
- File/directory doesn't exist
- Permission errors
- Invalid YAML frontmatter
- Duplicate skill names
- Invalid skill names (spaces, special chars)

**Error format:**
```
✗ Error: <clear message>
→ Suggestion: <helpful next step>
```

## Usage Examples

```bash
# List all skills
/skill list

# Create a new skill
/skill add lifecycle-bug-fix

# Remove a skill
/skill remove old-pattern

# Edit existing skill
/skill edit viewmodel-crash

# Search for skills
/skill search viewmodel lifecycle

# Get detailed info
/skill info lifecycle-bug-fix

# Sync between scopes
/skill sync
```

## Implementation Notes

1. **YAML Parsing:** Use frontmatter extraction for metadata
2. **File Operations:** Use Read/Write tools, never Edit for new files
3. **User Confirmation:** Always confirm destructive operations
4. **Clear Feedback:** Use checkmarks (✓), crosses (✗), arrows (→) for clarity
5. **Scope Resolution:** Always check both user and project scopes
6. **Validation:** Enforce naming conventions (lowercase, hyphens only)
