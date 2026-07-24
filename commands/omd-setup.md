---
description: One-time setup for oh-my-droid (the ONLY command you need to learn)
---

# OMD Setup

This is the **only command you need to learn**. After running this, everything else is automatic.

This command is a **setup wizard**.

**When you need to ask the user anything, use the `AskUser` tool** (not AskUserQuestion) and only ask the wizard questions below.

## Graceful Interrupt Handling

**IMPORTANT**: This setup process saves progress after each step. If interrupted (Ctrl+C or connection loss), the setup can resume from where it left off.

### Resume Detection (Step 0)

Before starting any step, check for existing state:

```bash
# Check for existing setup state
STATE_FILE=".omd/state/setup-state.json"

# Cross-platform ISO date to epoch conversion
iso_to_epoch() {
  local iso_date="$1"
  local epoch=""
  # Try GNU date first (Linux)
  epoch=$(date -d "$iso_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  # Try BSD/macOS date
  local clean_date=$(echo "$iso_date" | sed 's/[+-][0-9][0-9]:[0-9][0-9]$//' | sed 's/Z$//' | sed 's/T/ /')
  epoch=$(date -j -f "%Y-%m-%d %H:%M:%S" "$clean_date" +%s 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$epoch" ]; then
    echo "$epoch"
    return 0
  fi
  echo "0"
}

if [ -f "$STATE_FILE" ]; then
  # Check if state is stale (older than 24 hours)
  TIMESTAMP_RAW=$(jq -r '.timestamp // empty' "$STATE_FILE" 2>/dev/null)
  if [ -n "$TIMESTAMP_RAW" ]; then
    TIMESTAMP_EPOCH=$(iso_to_epoch "$TIMESTAMP_RAW")
    NOW_EPOCH=$(date +%s)
    STATE_AGE=$((NOW_EPOCH - TIMESTAMP_EPOCH))
  else
    STATE_AGE=999999  # Force fresh start if no timestamp
  fi
  if [ "$STATE_AGE" -gt 86400 ]; then
    echo "Previous setup state is more than 24 hours old. Starting fresh."
    rm -f "$STATE_FILE"
  else
    LAST_STEP=$(jq -r ".lastCompletedStep // 0" "$STATE_FILE" 2>/dev/null || echo "0")
    TIMESTAMP=$(jq -r .timestamp "$STATE_FILE" 2>/dev/null || echo "unknown")
    echo "Found previous setup session (Step $LAST_STEP completed at $TIMESTAMP)"
  fi
fi
```

If state exists, use `AskUser` to prompt **exactly**:

1. [question] Found a previous setup session. What should I do?
[topic] Resume
[option] Resume from last step
[option] Start fresh (clear saved state)

If user chooses "Start fresh":
```bash
rm -f ".omd/state/setup-state.json"
echo "Previous state cleared. Starting fresh setup."
```

### Step 0.5: Always Ask Parallelism (Required)

**MANDATORY:** Regardless of whether the user resumes or starts fresh, you MUST ask for `maxBackgroundTasks` in this run.

If resuming, try to infer the scope from the state file:

```bash
# Optional: infer scope from state file
CONFIG_TYPE=$(jq -r '.configType // empty' ".omd/state/setup-state.json" 2>/dev/null || true)
```

Interpretation:
- If `CONFIG_TYPE` starts with `local` → scope = `Local (this project)`
- If `CONFIG_TYPE` starts with `global` → scope = `Global (all projects)`
- Otherwise, ask Step 1 (scope) again.

## Step 1: Ask User Preference

Use the `AskUser` tool to prompt **exactly**:

1. [question] Where should I configure oh-my-droid?
[topic] Scope
[option] Local (this project)
[option] Global (all projects)

## Step 1.1: Configure Parallelism (maxBackgroundTasks)

**IMPORTANT:** Always run this step (even if `maxBackgroundTasks` is already set, and even when resuming).

Use `AskUser` to prompt:

1. [question] How many background tasks should I allow in parallel?
[topic] Parallelism
[option] Keep current
[option] 2
[option] 5
[option] 10
[option] 20

If the user chooses **Keep current**, skip updating settings.

Otherwise, update BOTH:

1) **Factory Droid global settings**: `~/.factory/settings.json` → top-level `maxBackgroundTasks`
2) **oh-my-droid config** (so OMD can read it):
   - If scope is **Local** → `./.factory/droid.jsonc` → `permissions.maxBackgroundTasks`
   - If scope is **Global** → `${XDG_CONFIG_HOME:-~/.config}/oh-my-droid/config.jsonc` → `permissions.maxBackgroundTasks`

Rules:
- Default to **5** if the user provides an invalid value
- Clamp to **1..20**

```bash
python3 - <<'PY'
import json
import os
import re
from pathlib import Path

MIN_V = 1
MAX_V = 20
DEFAULT_V = 5

def strip_jsonc(text: str) -> str:
  out: list[str] = []
  i = 0
  in_str = False
  str_ch = ''
  while i < len(text):
    c = text[i]
    if in_str:
      out.append(c)
      if c == '\\' and i + 1 < len(text):
        i += 1
        out.append(text[i])
      elif c == str_ch:
        in_str = False
      i += 1
      continue

    if c in ('"', "'"):
      in_str = True
      str_ch = c
      out.append(c)
      i += 1
      continue

    if c == '/' and i + 1 < len(text) and text[i + 1] == '/':
      i += 2
      while i < len(text) and text[i] not in ('\n', '\r'):
        i += 1
      continue

    if c == '/' and i + 1 < len(text) and text[i + 1] == '*':
      i += 2
      while i + 1 < len(text) and not (text[i] == '*' and text[i + 1] == '/'):
        i += 1
      i += 2
      continue

    out.append(c)
    i += 1

  return ''.join(out)

def parse_jsonc_file(path: Path) -> dict:
  if not path.exists():
    return {}
  raw = path.read_text('utf-8')
  cleaned = strip_jsonc(raw)
  cleaned = re.sub(r',\s*([}\]])', r'\1', cleaned)
  cleaned_s = cleaned.strip()
  if not cleaned_s:
    return {}
  return json.loads(cleaned_s)

factory_settings_path = Path.home() / '.factory' / 'settings.json'
factory_settings_path.parent.mkdir(parents=True, exist_ok=True)

try:
  factory_data = json.loads(factory_settings_path.read_text('utf-8')) if factory_settings_path.exists() else {}
except Exception:
  factory_data = {}

current = int(factory_data.get('maxBackgroundTasks', DEFAULT_V) or DEFAULT_V)

raw = "USER_CHOICE"  # replace with chosen value (or user's custom answer)
scope = "SCOPE_CHOICE"  # replace with: "Local (this project)" | "Global (all projects)" (or flags)
raw_s = str(raw).strip().lower()
if raw_s.startswith('keep'):
  v = current
else:
  try:
    v = int(raw_s)
  except Exception:
    v = current

if v < MIN_V:
  v = MIN_V
if v > MAX_V:
  v = MAX_V

# 1) Factory Droid settings (global)
factory_data['maxBackgroundTasks'] = v
factory_settings_path.write_text(json.dumps(factory_data, indent=2) + '\n', encoding='utf-8')
print('Set Factory maxBackgroundTasks to', v, 'in', factory_settings_path)

# 2) OMD config (local or global)
scope_s = str(scope).strip().lower()
if scope_s.startswith('local'):
  omd_config_path = Path.cwd() / '.factory' / 'droid.jsonc'
else:
  xdg = Path(os.environ.get('XDG_CONFIG_HOME') or (Path.home() / '.config'))
  omd_config_path = xdg / 'oh-my-droid' / 'config.jsonc'

omd_config_path.parent.mkdir(parents=True, exist_ok=True)

try:
  omd_data = parse_jsonc_file(omd_config_path)
except Exception as e:
  print('Warning: could not parse OMD config; skipping update:', omd_config_path, '-', e)
  omd_data = None

if isinstance(omd_data, dict):
  perms = omd_data.get('permissions')
  if not isinstance(perms, dict):
    perms = {}
  perms['maxBackgroundTasks'] = v
  omd_data['permissions'] = perms
  omd_config_path.write_text(json.dumps(omd_data, indent=2) + '\n', encoding='utf-8')
  print('Set OMD permissions.maxBackgroundTasks to', v, 'in', omd_config_path)
PY
```

## Step 2: Execute Based on Choice

### If User Chooses LOCAL:

```bash
# Create .factory directory in current project
mkdir -p .factory

# Download fresh FACTORY.md from GitHub
curl -fsSL "https://raw.githubusercontent.com/MeroZemory/oh-my-droid/main/docs/FACTORY.md" -o .factory/FACTORY.md && \
echo "Downloaded FACTORY.md to .factory/FACTORY.md"
```

### If User Chooses GLOBAL:

```bash
# Download fresh FACTORY.md to global config
curl -fsSL "https://raw.githubusercontent.com/MeroZemory/oh-my-droid/main/docs/FACTORY.md" -o ~/.factory/FACTORY.md && \
echo "Downloaded FACTORY.md to ~/.factory/FACTORY.md"
```

## Step 3: Setup HUD Statusline

The HUD shows real-time status in Factory Droid's status bar. **Invoke the hud skill** to set up and configure:

Use the Skill tool to invoke: `hud` with args: `setup`

This will:
1. Install the HUD wrapper script to `~/.factory/hud/omd-hud.mjs`
2. Configure `statusLine` in `~/.factory/settings.json`
3. Report status and prompt to restart if needed

## Step 3.5: Verify Plugin Build

The HUD requires the plugin to be built (dist/ directory). The dist/ folder is NOT included in git - it's generated when the plugin is installed via npm.

Check if the plugin is installed and built:

```bash
# Resolve the active install from Factory's plugin metadata
PLUGIN_DIR=$(node --input-type=module - <<'NODE'
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const registries = [
  { path: join(process.cwd(), ".factory/plugins/installed_plugins.json"), scope: "project" },
  { path: join(homedir(), ".factory/plugins/installed_plugins.json"), scope: "user" },
];
for (const registry of registries) {
  try {
    const metadata = JSON.parse(readFileSync(registry.path, "utf-8"));
    const installs = metadata.plugins?.["oh-my-droid@oh-my-droid"] ?? [];
    const install = installs.find((item) => item.scope === registry.scope) ?? installs[0];
    if (install?.installPath) {
      console.log(install.installPath);
      process.exit(0);
    }
  } catch {}
}
console.log("");
NODE
)
if [ -n "$PLUGIN_DIR" ]; then
    if [ ! -f "$PLUGIN_DIR/dist/hud/index.js" ]; then
      echo "Plugin not built - building now..."
      cd "$PLUGIN_DIR"
      # Use bun (preferred) or npm for building
      if command -v bun &> /dev/null; then
        bun install
      elif command -v npm &> /dev/null; then
        npm install
      else
        echo "ERROR: Neither bun nor npm found. Please install Node.js or Bun first."
        exit 1
      fi
      if [ -f "dist/hud/index.js" ]; then
        echo "Build successful - HUD is ready"
      else
        echo "Build failed - HUD may not work correctly"
      fi
    else
      echo "Plugin already built - HUD is ready"
    fi
else
  echo "Plugin not installed - install with: droid /plugin install oh-my-droid@oh-my-droid"
fi
```

**Note:** The compiled `dist/` directory is generated by the package `prepare`
script and is not tracked in Git.

## Step 3.6: Enable Background Processes (Required)

To support true parallel shell execution (multiple long `Execute` commands at once), OMD requires Factory Droid background processes.

**This must be set globally** in `~/.factory/settings.json` (there is no per-project equivalent).

```bash
python3 - <<'PY'
import json
from pathlib import Path

settings_path = Path.home() / '.factory' / 'settings.json'
settings_path.parent.mkdir(parents=True, exist_ok=True)

try:
  data = json.loads(settings_path.read_text('utf-8')) if settings_path.exists() else {}
except Exception:
  data = {}

data['allowBackgroundProcesses'] = True
settings_path.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
print('Enabled allowBackgroundProcesses in', settings_path)
PY
```

**IMPORTANT:** This setting may require a **Droid restart** (or starting the session with `--allow-background-processes`) to take effect.

## Step 3.7: Install CLI Analytics Tools (Optional)

The OMD CLI provides standalone token analytics commands (`omd stats`, `omd agents`, `omd backfill`, `omd tui`).

Ask user: "Would you like to install the OMD CLI for standalone analytics? (Recommended for tracking token usage and costs)"

**Options:**
1. **Yes (Recommended)** - Install CLI tools globally for `omd stats`, `omd agents`, etc.
2. **No** - Skip CLI installation, use only plugin skills

### If User Chooses YES:

```bash
# Check for bun (preferred) or npm
if command -v bun &> /dev/null; then
  echo "Installing OMD CLI via bun..."
  # Clean up npm version if it exists to avoid duplicates
  if command -v npm &> /dev/null && npm list -g oh-my-droid &>/dev/null; then
    echo "Removing existing npm installation to avoid duplicates..."
    npm uninstall -g oh-my-droid 2>/dev/null
  fi
  bun install -g oh-my-droid
elif command -v npm &> /dev/null; then
  echo "Installing OMD CLI via npm..."
  npm install -g oh-my-droid
else
  echo "ERROR: Neither bun nor npm found. Please install Node.js or Bun first."
  exit 1
fi

# Verify installation
if command -v omc &> /dev/null; then
  echo "✓ OMD CLI installed successfully!"
  echo "  Try: omd stats, omd agents, omd backfill"
else
  echo "⚠ CLI installed but 'omc' not in PATH."
  echo "  You may need to restart your terminal or add npm/bun global bin to PATH."
fi
```

### If User Chooses NO:

Skip this step. User can install later with `bun install -g oh-my-droid` or `npm install -g oh-my-droid`.

## Step 4: Verify Plugin Installation

```bash
grep -q "oh-my-droid" ~/.factory/settings.json && echo "Plugin verified" || echo "Plugin NOT found - run: droid /plugin install oh-my-droid@oh-my-droid"
```

## Step 4.1: Install AST Tools (Optional)

The plugin includes AST-aware code search and transformation tools (`ast_grep_search`, `ast_grep_replace`) that require `@ast-grep/napi`.

Ask user: "Would you like to install AST tools for advanced code search? (Pattern-based AST matching across 17 languages)"

**Options:**
1. **Yes (Recommended)** - Install `@ast-grep/napi` for AST-powered search/replace
2. **No** - Skip, AST tools will show helpful error when used

### If User Chooses YES:

```bash
# Check for bun (preferred) or npm
if command -v bun &> /dev/null; then
  PKG_MANAGER="bun"
  echo "Installing @ast-grep/napi via bun..."
  # Clean up npm version if it exists to avoid duplicates
  if command -v npm &> /dev/null && npm list -g @ast-grep/napi &>/dev/null; then
    echo "Removing existing npm installation to avoid duplicates..."
    npm uninstall -g @ast-grep/napi 2>/dev/null
  fi
  bun install -g @ast-grep/napi
elif command -v npm &> /dev/null; then
  PKG_MANAGER="npm"
  echo "Installing @ast-grep/napi via npm..."
  npm install -g @ast-grep/napi
else
  echo "ERROR: Neither bun nor npm found. Please install Node.js or Bun first."
  exit 1
fi

# Verify installation
if [ "$PKG_MANAGER" = "bun" ]; then
  if bun pm ls -g 2>/dev/null | grep -q "@ast-grep/napi"; then
    echo "✓ AST tools installed successfully via bun!"
    echo "  Available tools: ast_grep_search, ast_grep_replace"
    echo "  Supports: JavaScript, TypeScript, Python, Go, Rust, Java, and 11 more languages"
  else
    echo "⚠ Installation may have failed. You can install later with: bun install -g @ast-grep/napi"
  fi
else
  if npm list -g @ast-grep/napi &>/dev/null; then
    echo "✓ AST tools installed successfully via npm!"
    echo "  Available tools: ast_grep_search, ast_grep_replace"
    echo "  Supports: JavaScript, TypeScript, Python, Go, Rust, Java, and 11 more languages"
  else
    echo "⚠ Installation may have failed. You can install later with: npm install -g @ast-grep/napi"
  fi
fi
```

### If User Chooses NO:

Skip this step. AST tools will gracefully degrade with a helpful installation message when used.

## Step 5: Offer MCP Server Configuration

MCP servers extend Factory Droid with additional tools (web search, GitHub, etc.).

Ask user: "Would you like to configure MCP servers for enhanced capabilities? (Context7, Exa search, GitHub, etc.)"

If yes, invoke the mcp-setup skill:
```
/mcp-setup
```

If no, skip to next step.

## Step 6: Detect Upgrade from 2.x

Check if user has existing configuration:
```bash
# Check for existing 2.x artifacts
ls ~/.factory/commands/ralph-loop.md 2>/dev/null || ls ~/.factory/commands/ultrawork.md 2>/dev/null
```

If found, this is an upgrade from 2.x.

## Step 7: Show Welcome Message

### For New Users:

```
OMD Setup Complete!

You don't need to learn any commands. I now have intelligent behaviors that activate automatically.

WHAT HAPPENS AUTOMATICALLY:
- Complex tasks -> I parallelize and delegate to specialists
- "plan this" -> I start a planning interview
- "don't stop until done" -> I persist until verified complete
- "stop" or "cancel" -> I intelligently stop current operation

MAGIC KEYWORDS (optional power-user shortcuts):
Just include these words naturally in your request:

| Keyword | Effect | Example |
|---------|--------|---------|
| ralph | Persistence mode | "ralph: fix the auth bug" |
| ralplan | Iterative planning | "ralplan this feature" |
| ulw | Max parallelism | "ulw refactor the API" |
| plan | Planning interview | "plan the new endpoints" |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

MCP SERVERS:
Run /mcp-setup to add tools like web search, GitHub, etc.

HUD STATUSLINE:
The status bar now shows OMD state. Restart Factory Droid to see it.

CLI ANALYTICS (if installed):
- omc           - Full dashboard (stats + agents + cost)
- omd stats     - View token usage and costs
- omd agents    - See agent breakdown by cost
- omd tui       - Launch interactive TUI dashboard

AST TOOLS (if installed):
- ast_grep_search  - Pattern-based AST code search
- ast_grep_replace - AST-aware code transformations
- Supports 17 languages including TS, Python, Go, Rust

That's it! Just use Factory Droid normally.
```

### For Users Upgrading from 2.x:

```
OMD Setup Complete! (Upgraded from 2.x)

GOOD NEWS: Your existing commands still work!
- /ralph, /ultrawork, /plan, etc. all still function

WHAT'S NEW in 3.0:
You no longer NEED those commands. Everything is automatic now:
- Just say "don't stop until done" instead of /ralph
- Just say "fast" or "parallel" instead of /ultrawork
- Just say "plan this" instead of /plan
- Just say "stop" instead of /cancel

MAGIC KEYWORDS (power-user shortcuts):
| Keyword | Same as old... | Example |
|---------|----------------|---------|
| ralph | /ralph | "ralph: fix the bug" |
| ralplan | /ralplan | "ralplan this feature" |
| ulw | /ultrawork | "ulw refactor API" |
| plan | /plan | "plan the endpoints" |

HUD STATUSLINE:
The status bar now shows OMD state. Restart Factory Droid to see it.

CLI ANALYTICS (if installed):
- omc           - Full dashboard (stats + agents + cost)
- omd stats     - View token usage and costs
- omd agents    - See agent breakdown by cost
- omd tui       - Launch interactive TUI dashboard

Your workflow won't break - it just got easier!
```

## Step 8: Ask About Starring Repository

First, check if `gh` CLI is available and authenticated:

```bash
gh auth status &>/dev/null
```

### If gh is available and authenticated:

Use `AskUser` to prompt:

1. [question] Would you like to star the oh-my-droid GitHub repo?
[topic] Star
[option] Yes, star it
[option] No
[option] Maybe later

If user chooses "Yes, star it!":

```bash
gh api -X PUT /user/starred/MeroZemory/oh-my-droid 2>/dev/null && echo "Thanks for starring! ⭐" || echo "Could not star - you can star manually at https://github.com/MeroZemory/oh-my-droid"
```

**Note:** Fail gracefully if the API call doesn't work - never block setup completion.

### If gh is NOT available or not authenticated:

Skip the AskUser prompt and just display:

```bash
echo ""
echo "If you enjoy oh-my-droid, consider starring the repo:"
echo "  https://github.com/MeroZemory/oh-my-droid"
echo ""
```

## Fallback

If curl fails, tell user to manually download from:
https://raw.githubusercontent.com/MeroZemory/oh-my-droid/main/docs/FACTORY.md
