---
name: doctor
description: Diagnose and fix oh-my-droid installation issues
---

# Doctor Skill

## Task: Run Installation Diagnostics

You are the OMD Doctor - diagnose and fix installation issues.

### Step 1: Check Plugin Version

```bash
# Get installed version
INSTALLED=$(ls ~/.factory/plugins/cache/omd/oh-my-droid/ 2>/dev/null | sort -V | tail -1)
echo "Installed: $INSTALLED"

# Get latest from npm
LATEST=$(npm view oh-my-droid version 2>/dev/null)
echo "Latest: $LATEST"
```

**Diagnosis**:
- If no version installed: CRITICAL - plugin not installed
- If INSTALLED != LATEST: WARN - outdated plugin
- If multiple versions exist: WARN - stale cache

### Step 2: Check for Legacy Hooks in settings.json

Read `~/.factory/settings.json` and check if there's a `"hooks"` key with entries like:
- `bash $HOME/.factory/hooks/keyword-detector.sh`
- `bash $HOME/.factory/hooks/persistent-mode.sh`
- `bash $HOME/.factory/hooks/session-start.sh`

**Diagnosis**:
- If found: CRITICAL - legacy hooks causing duplicates

### Step 3: Check for Legacy Bash Hook Scripts

```bash
ls -la ~/.factory/hooks/*.sh 2>/dev/null
```

**Diagnosis**:
- If `keyword-detector.sh`, `persistent-mode.sh`, `session-start.sh`, or `stop-continuation.sh` exist: WARN - legacy scripts (can cause confusion)

### Step 4: Check FACTORY.md

```bash
# Check if FACTORY.md exists
ls -la ~/.factory/FACTORY.md 2>/dev/null

# Check for OMD marker
grep -q "oh-my-droid Multi-Agent System" ~/.factory/FACTORY.md 2>/dev/null && echo "Has OMD config" || echo "Missing OMD config"
```

**Diagnosis**:
- If missing: CRITICAL - FACTORY.md not configured
- If missing OMD marker: WARN - outdated FACTORY.md

### Step 5: Check for Stale Plugin Cache

```bash
# Count versions in cache
ls ~/.factory/plugins/cache/omd/oh-my-droid/ 2>/dev/null | wc -l
```

**Diagnosis**:
- If > 1 version: WARN - multiple cached versions (cleanup recommended)

### Step 6: Check for Legacy Curl-Installed Content

Check for legacy agents, commands, and skills installed via curl (before plugin system):

```bash
# Check for legacy agents directory
ls -la ~/.factory/agents/ 2>/dev/null

# Check for legacy commands directory
ls -la ~/.factory/commands/ 2>/dev/null

# Check for legacy skills directory
ls -la ~/.factory/skills/ 2>/dev/null
```

**Diagnosis**:
- If `~/.factory/agents/` exists with oh-my-droid-related files: WARN - legacy agents (now provided by plugin)
- If `~/.factory/commands/` exists with oh-my-droid-related files: WARN - legacy commands (now provided by plugin)
- If `~/.factory/skills/` exists with oh-my-droid-related files: WARN - legacy skills (now provided by plugin)

Look for files like:
- `android-architect.md`, `kotlin-expert.md`, `layout-designer.md`, `gradle-expert.md`, etc. in agents/
- `ultrawork.md`, `deepsearch.md`, etc. in commands/
- Any oh-my-droid-related `.md` files in skills/

---

## Report Format

After running all checks, output a report:

```
## OMD Doctor Report

### Summary
[HEALTHY / ISSUES FOUND]

### Checks

| Check | Status | Details |
|-------|--------|---------|
| Plugin Version | OK/WARN/CRITICAL | ... |
| Legacy Hooks (settings.json) | OK/CRITICAL | ... |
| Legacy Scripts (~/.factory/hooks/) | OK/WARN | ... |
| FACTORY.md | OK/WARN/CRITICAL | ... |
| Plugin Cache | OK/WARN | ... |
| Legacy Agents (~/.factory/agents/) | OK/WARN | ... |
| Legacy Commands (~/.factory/commands/) | OK/WARN | ... |
| Legacy Skills (~/.factory/skills/) | OK/WARN | ... |

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommended Fixes
[List fixes based on issues]
```

---

## Auto-Fix (if user confirms)

If issues found, ask user: "Would you like me to fix these issues automatically?"

If yes, apply fixes:

### Fix: Legacy Hooks in settings.json
Remove the `"hooks"` section from `~/.factory/settings.json` (keep other settings intact)

### Fix: Legacy Bash Scripts
```bash
rm -f ~/.factory/hooks/keyword-detector.sh
rm -f ~/.factory/hooks/stop-continuation.sh
rm -f ~/.factory/hooks/persistent-mode.sh
rm -f ~/.factory/hooks/session-start.sh
echo "Legacy hooks cleaned"
```

### Fix: Outdated Plugin
```bash
rm -rf ~/.factory/plugins/cache/oh-my-droid
echo "Plugin cache cleared. Restart Claude Code to fetch latest version."
```

### Fix: Stale Cache (multiple versions)
```bash
# Keep only latest version
cd ~/.factory/plugins/cache/omd/oh-my-droid/
ls | sort -V | head -n -1 | xargs rm -rf
```

### Fix: Missing/Outdated FACTORY.md
Fetch latest from GitHub and write to `~/.factory/FACTORY.md`:
```
WebFetch(url: "https://raw.githubusercontent.com/YOUR_REPO/oh-my-droid/main/docs/FACTORY.md", prompt: "Return the complete raw markdown content exactly as-is")
```

### Fix: Legacy Curl-Installed Content

Remove legacy agents, commands, and skills directories (now provided by plugin):

```bash
# Backup first (optional - ask user)
# mv ~/.factory/agents ~/.factory/agents.bak
# mv ~/.factory/commands ~/.factory/commands.bak
# mv ~/.factory/skills ~/.factory/skills.bak

# Or remove directly
rm -rf ~/.factory/agents
rm -rf ~/.factory/commands
rm -rf ~/.factory/skills
```

**Note**: Only remove if these contain oh-my-droid-related files. If user has custom agents/commands/skills, warn them and ask before removing.

---

## Post-Fix

After applying fixes, inform user:
> Fixes applied. **Restart Claude Code** for changes to take effect.
