---
name: omd-setup
description: Setup and configure oh-my-droid (the ONLY command you need to learn)
---

# OMD Setup

This is the **only command you need to learn**. After running this, everything else is automatic.

## Usage Modes

This skill handles three scenarios:

1. **Initial Setup (no flags)**: First-time installation wizard
2. **Local Configuration (`--local`)**: Configure project-specific settings (.factory/FACTORY.md)
3. **Global Configuration (`--global`)**: Configure global settings (~/.factory/FACTORY.md)

## Mode Detection

Check for flags in the user's invocation:
- If `--local` flag present → Skip to Local Configuration (Step 2A)
- If `--global` flag present → Skip to Global Configuration (Step 2B)
- If no flags → Run Initial Setup wizard (Step 1)

## Step 1: Initial Setup Wizard (Default Behavior)

Use the AskUserQuestion tool to prompt the user:

**Question:** "Where should I configure oh-my-droid?"

**Options:**
1. **Local (this project)** - Creates `.factory/FACTORY.md` in current project directory. Best for project-specific configurations.
2. **Global (all projects)** - Creates `~/.factory/FACTORY.md` for all Claude Code sessions. Best for consistent behavior everywhere.

## Step 2A: Local Configuration (--local flag or user chose LOCAL)

**CRITICAL**: This ALWAYS downloads fresh FACTORY.md from GitHub to the local project. DO NOT use the Write tool - use bash curl exclusively.

### Create Local .factory Directory

```bash
# Create .factory directory in current project
mkdir -p .factory && echo ".factory directory ready"
```

### Download Fresh FACTORY.md

```bash
# Extract old version before download
OLD_VERSION=$(grep -m1 "^# oh-my-droid" .factory/FACTORY.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Download fresh FACTORY.md from GitHub
curl -fsSL "https://raw.githubusercontent.com/YOUR_REPO/oh-my-droid/main/docs/FACTORY.md" -o .factory/FACTORY.md && \
echo "Downloaded FACTORY.md to .factory/FACTORY.md"

# Extract new version and report
NEW_VERSION=$(grep -m1 "^# oh-my-droid" .factory/FACTORY.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed FACTORY.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "FACTORY.md unchanged: $NEW_VERSION"
else
  echo "Updated FACTORY.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

**Note**: The downloaded FACTORY.md includes Context Persistence instructions with `<remember>` tags for surviving conversation compaction.

**MANDATORY**: Always run this command. Do NOT skip. Do NOT use Write tool.

**FALLBACK** if curl fails:
Tell user to manually download from:
https://raw.githubusercontent.com/YOUR_REPO/oh-my-droid/main/docs/FACTORY.md

### Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin oh-my-droid"
```

### Confirm Local Configuration Success

After completing local configuration, report:

**OMD Project Configuration Complete**
- FACTORY.md: Updated with latest configuration from GitHub at ./.factory/FACTORY.md
- Scope: **PROJECT** - applies only to this project
- Hooks: Provided by plugin (no manual installation needed)
- Agents: 25+ available for Android development
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: This configuration is project-specific and won't affect other projects or global settings.

If `--local` flag was used, **STOP HERE**. Do not continue to HUD setup or other steps.

## Step 2B: Global Configuration (--global flag or user chose GLOBAL)

**CRITICAL**: This ALWAYS downloads fresh FACTORY.md from GitHub to global config. DO NOT use the Write tool - use bash curl exclusively.

### Download Fresh FACTORY.md

```bash
# Extract old version before download
OLD_VERSION=$(grep -m1 "^# oh-my-droid" ~/.factory/FACTORY.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "none")

# Download fresh FACTORY.md to global config
curl -fsSL "https://raw.githubusercontent.com/YOUR_REPO/oh-my-droid/main/docs/FACTORY.md" -o ~/.factory/FACTORY.md && \
echo "Downloaded FACTORY.md to ~/.factory/FACTORY.md"

# Extract new version and report
NEW_VERSION=$(grep -m1 "^# oh-my-droid" ~/.factory/FACTORY.md 2>/dev/null | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown")
if [ "$OLD_VERSION" = "none" ]; then
  echo "Installed FACTORY.md: $NEW_VERSION"
elif [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "FACTORY.md unchanged: $NEW_VERSION"
else
  echo "Updated FACTORY.md: $OLD_VERSION -> $NEW_VERSION"
fi
```

### Clean Up Legacy Hooks (if present)

Check if old manual hooks exist and remove them to prevent duplicates:

```bash
# Remove legacy bash hook scripts (now handled by plugin system)
rm -f ~/.factory/hooks/keyword-detector.sh
rm -f ~/.factory/hooks/stop-continuation.sh
rm -f ~/.factory/hooks/persistent-mode.sh
rm -f ~/.factory/hooks/session-start.sh
echo "Legacy hooks cleaned"
```

Check `~/.factory/settings.json` for manual hook entries. If the "hooks" key exists with UserPromptSubmit, Stop, or SessionStart entries pointing to bash scripts, inform the user:

> **Note**: Found legacy hooks in settings.json. These should be removed since the plugin now provides hooks automatically. Remove the "hooks" section from ~/.factory/settings.json to prevent duplicate hook execution.

### Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: claude /install-plugin oh-my-droid"
```

### Confirm Global Configuration Success

After completing global configuration, report:

**OMD Global Configuration Complete**
- FACTORY.md: Updated with latest configuration from GitHub at ~/.factory/FACTORY.md
- Scope: **GLOBAL** - applies to all Claude Code sessions
- Hooks: Provided by plugin (no manual installation needed)
- Agents: 25+ available for Android development
- Model routing: Haiku/Sonnet/Opus based on task complexity

**Note**: Hooks are now managed by the plugin system automatically. No manual hook installation required.

If `--global` flag was used, **STOP HERE**. Do not continue to HUD setup or other steps.

## Step 3: Setup HUD Statusline

The HUD shows real-time status in Claude Code's status bar. **Invoke the hud skill** to set up and configure:

Use the Skill tool to invoke: `hud` with args: `setup`

This will:
1. Install the HUD wrapper script to `~/.factory/hud/omd-hud.mjs`
2. Configure `statusLine` in `~/.factory/settings.json`
3. Report status and prompt to restart if needed

## Step 4: Set Default Execution Mode

Use the AskUserQuestion tool to prompt the user:

**Question:** "Which parallel execution mode should be your default when you say 'fast' or 'parallel'?"

**Options:**
1. **ultrawork (maximum capability)** - Uses all agent tiers including Opus for complex tasks. Best for challenging work where quality matters most. (Recommended)
2. **ecomode (token efficient)** - Prefers Haiku/Sonnet agents, avoids Opus. Best for pro-plan users who want cost efficiency.

Store the preference in `~/.factory/.omd-config.json`:

```bash
# Read existing config or create empty object
CONFIG_FILE="$HOME/.factory/.omd-config.json"
mkdir -p "$(dirname "$CONFIG_FILE")"

if [ -f "$CONFIG_FILE" ]; then
  EXISTING=$(cat "$CONFIG_FILE")
else
  EXISTING='{}'
fi

# Set defaultExecutionMode (replace USER_CHOICE with "ultrawork" or "ecomode")
echo "$EXISTING" | jq --arg mode "USER_CHOICE" '. + {defaultExecutionMode: $mode, configuredAt: (now | todate)}' > "$CONFIG_FILE"
echo "Default execution mode set to: USER_CHOICE"
```

**Note**: This preference ONLY affects generic keywords ("fast", "parallel"). Explicit keywords ("ulw", "eco") always override this preference.

## Step 5: Show Welcome Message

```
OMD Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Android tasks -> I parallelize and delegate to specialized Android agents
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword | Effect | Example |
|---------|--------|---------|
| ralph | Persistence mode | "ralph: fix the lifecycle bug" |
| ralplan | Iterative planning | "ralplan this feature" |
| ulw | Max parallelism | "ulw implement all screens" |
| eco | Token-efficient mode | "eco fix lint errors" |
| plan | Planning interview | "plan the new feature" |

Combine them: "ralph ulw: implement authentication"

HUD STATUSLINE:
The status bar now shows OMD state. Restart Claude Code to see it.

ANDROID-SPECIFIC AGENTS:
- android-architect: System design and architecture
- kotlin-expert: Kotlin implementation
- layout-designer: XML/Compose UI
- gradle-expert: Build configuration
- test-expert: Testing strategies
- And 20+ more specialized agents

That's it! Just use Claude Code normally for Android development.
```

## Help Text

When user runs `/oh-my-droid:omd-setup --help` or just `--help`, display:

```
OMD Setup - Configure oh-my-droid

USAGE:
  /oh-my-droid:omd-setup           Run initial setup wizard
  /oh-my-droid:omd-setup --local   Configure local project (.factory/FACTORY.md)
  /oh-my-droid:omd-setup --global  Configure global settings (~/.factory/FACTORY.md)
  /oh-my-droid:omd-setup --help    Show this help

MODES:
  Initial Setup (no flags)
    - Interactive wizard for first-time setup
    - Configures FACTORY.md (local or global)
    - Sets up HUD statusline
    - Checks for updates

  Local Configuration (--local)
    - Downloads fresh FACTORY.md to ./.factory/
    - Project-specific settings
    - Use this to update project config after OMD upgrades

  Global Configuration (--global)
    - Downloads fresh FACTORY.md to ~/.factory/
    - Applies to all Claude Code sessions
    - Cleans up legacy hooks
    - Use this to update global config after OMD upgrades

EXAMPLES:
  /oh-my-droid:omd-setup           # First time setup
  /oh-my-droid:omd-setup --local   # Update this project
  /oh-my-droid:omd-setup --global  # Update all projects

For more info: https://github.com/YOUR_REPO/oh-my-droid
```
