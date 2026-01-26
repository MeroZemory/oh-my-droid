---
name: hud
description: Configure HUD display options (layout, presets, display elements)
role: config-writer
scope: ~/.factory/**
---

# HUD Skill

Configure the OMD HUD (Heads-Up Display) for the statusline.

## Quick Commands

| Command | Description |
|---------|-------------|
| `/oh-my-droid:hud` | Show current HUD status (auto-setup if needed) |
| `/oh-my-droid:hud setup` | Install/repair HUD statusline |
| `/oh-my-droid:hud minimal` | Switch to minimal display |
| `/oh-my-droid:hud focused` | Switch to focused display (default) |
| `/oh-my-droid:hud full` | Switch to full display |
| `/oh-my-droid:hud status` | Show detailed HUD status |

## Auto-Setup

When you run `/oh-my-droid:hud` or `/oh-my-droid:hud setup`, the system will automatically:
1. Check if `~/.factory/hud/omd-hud.mjs` exists
2. Check if `statusLine` is configured in `~/.factory/settings.json`
3. If missing, create the HUD wrapper script and configure settings
4. Report status and prompt to restart Claude Code if changes were made

**IMPORTANT**: If the argument is `setup` OR if the HUD script doesn't exist at `~/.factory/hud/omd-hud.mjs`, you MUST create the HUD files directly using the instructions below.

### Setup Instructions (Run These Commands)

**Step 1:** Check if setup is needed:
```bash
ls ~/.factory/hud/omd-hud.mjs 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

**Step 2:** Check if the plugin is built (CRITICAL - common issue!):
```bash
# Find the latest version and check if dist/hud/index.js exists
PLUGIN_VERSION=$(ls ~/.factory/plugins/cache/omd/oh-my-droid/ 2>/dev/null | sort -V | tail -1)
if [ -n "$PLUGIN_VERSION" ]; then
  ls ~/.factory/plugins/cache/omd/oh-my-droid/$PLUGIN_VERSION/dist/hud/index.js 2>/dev/null && echo "BUILT" || echo "NOT_BUILT"
fi
```

**⚠️ CRITICAL: If NOT_BUILT, the plugin MUST be compiled before the HUD can work!**

**WHY THIS HAPPENS:** The `dist/` directory contains compiled TypeScript code and is NOT stored on GitHub (it's in .gitignore). When you install the plugin from the marketplace, the build step happens automatically via the `prepare` script during `npm install`. However, if the plugin wasn't properly installed or the build failed, you'll get this error.

**THE FIX:** Run npm install in the plugin directory to build it:
```bash
cd ~/.factory/plugins/cache/omd/oh-my-droid/$PLUGIN_VERSION && npm install
```

This will:
1. Install all dependencies
2. Run the `prepare` script which executes `npm run build`
3. Generate the `dist/hud/index.js` file that the HUD wrapper needs

**DO NOT** try to download `dist/hud/index.js` from GitHub raw URLs - it doesn't exist there!

**Step 3:** If omd-hud.mjs is MISSING or argument is `setup`, create the HUD directory and script:

First, create the directory:
```bash
mkdir -p ~/.factory/hud
```

Then, use the Write tool to create `~/.factory/hud/omd-hud.mjs` with this exact content:

```javascript
#!/usr/bin/env node
/**
 * OMD HUD - Statusline Script
 * Wrapper that imports from plugin cache or development paths
 */

import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

async function main() {
  const home = homedir();
  let pluginCacheDir = null;

  // 1. Try plugin cache first (marketplace: omd, plugin: oh-my-droid)
  const pluginCacheBase = join(home, ".factory/plugins/cache/omd/oh-my-droid");
  if (existsSync(pluginCacheBase)) {
    try {
      const versions = readdirSync(pluginCacheBase);
      if (versions.length > 0) {
        const latestVersion = versions.sort().reverse()[0];
        pluginCacheDir = join(pluginCacheBase, latestVersion);
        const pluginPath = join(pluginCacheDir, "dist/hud/index.js");
        if (existsSync(pluginPath)) {
          await import(pluginPath);
          return;
        }
      }
    } catch { /* continue */ }
  }

  // 2. Development paths
  const devPaths = [
    join(home, "Workspace/oh-my-droid/dist/hud/index.js"),
    join(home, "workspace/oh-my-droid/dist/hud/index.js"),
  ];

  for (const devPath of devPaths) {
    if (existsSync(devPath)) {
      try {
        await import(devPath);
        return;
      } catch { /* continue */ }
    }
  }

  // 3. Fallback - HUD not found (provide actionable error message)
  if (pluginCacheDir) {
    console.log(`[OMD] HUD not built. Run: cd "${pluginCacheDir}" && npm install`);
  } else {
    console.log("[OMD] Plugin not found. Run: /oh-my-droid:omd-setup");
  }
}

main();
```

**Step 4:** Make it executable:
```bash
chmod +x ~/.factory/hud/omd-hud.mjs
```

**Step 5:** Update settings.json to use the HUD:

Read `~/.factory/settings.json`, then update/add the `statusLine` field:
```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.factory/hud/omd-hud.mjs"
  }
}
```

Use the Edit tool to add/update this field while preserving other settings.

**Step 6:** Clean up old HUD scripts (if any):
```bash
rm -f ~/.factory/hud/sisyphus-hud.mjs 2>/dev/null
```

**Step 7:** Tell the user to restart Claude Code for changes to take effect.

## Display Presets

### Minimal
Shows only the essentials:
```
[OMD] ralph | ultrawork | todos:2/5
```

### Focused (Default)
Shows all relevant elements:
```
[OMD] ralph:3/10 | US-002 | ultrawork skill:android-layout | ctx:67% | agents:2 | bg:3/5 | todos:2/5
```

### Full
Shows everything including multi-line agent details:
```
[OMD] ralph:3/10 | US-002 (2/5) | ultrawork | ctx:[████░░]67% | agents:3 | bg:3/5 | todos:2/5
├─ O android-architect    2m   analyzing Activity lifecycle patterns...
├─ e layout-designer     45s   searching for XML layouts
└─ s kotlin-expert       1m   implementing ViewModel logic
```

## Multi-Line Agent Display

When agents are running, the HUD shows detailed information on separate lines:
- **Tree characters** (`├─`, `└─`) show visual hierarchy
- **Agent code** (O, e, s) indicates agent type with model tier color
- **Duration** shows how long each agent has been running
- **Description** shows what each agent is doing (up to 45 chars)

## Display Elements

| Element | Description |
|---------|-------------|
| `[OMD]` | Mode identifier |
| `ralph:3/10` | Ralph loop iteration/max |
| `US-002` | Current PRD story ID |
| `ultrawork` | Active mode badge |
| `skill:name` | Last activated skill (cyan) |
| `ctx:67%` | Context window usage |
| `agents:2` | Running subagent count |
| `bg:3/5` | Background task slots |
| `todos:2/5` | Todo completion |

## Color Coding

- **Green**: Normal/healthy
- **Yellow**: Warning (context >70%, ralph >7)
- **Red**: Critical (context >85%, ralph at max)

## Configuration Location

HUD config is stored at: `~/.factory/.omd/hud-config.json`

## Manual Configuration

You can manually edit the config file:

```json
{
  "preset": "focused",
  "elements": {
    "omdLabel": true,
    "ralph": true,
    "prdStory": true,
    "activeSkills": true,
    "lastSkill": true,
    "contextBar": true,
    "agents": true,
    "backgroundTasks": true,
    "todos": true
  },
  "thresholds": {
    "contextWarning": 70,
    "contextCritical": 85,
    "ralphWarning": 7
  }
}
```

## Troubleshooting

If the HUD is not showing:
1. Run `/oh-my-droid:hud setup` to auto-install and configure
2. Restart Claude Code after setup completes
3. If still not working, run `/oh-my-droid:doctor` for full diagnostics

Manual verification:
- HUD script: `~/.factory/hud/omd-hud.mjs`
- Settings: `~/.factory/settings.json` should have `statusLine` configured

---

*The HUD updates automatically every ~300ms during active sessions.*
