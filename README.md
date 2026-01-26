# Oh My Droid

Multi-agent orchestration plugin for Factory AI Droid CLI.

> **Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)** by Yeachan Heo - This project is a port of the oh-my-claudecode plugin, adapted for Factory AI's Droid CLI platform. All core architecture, agent definitions, skills, and orchestration patterns are derived from oh-my-claudecode.

## Overview

Oh My Droid transforms Droid into an orchestration conductor with 32 specialized droids and 35+ skills for parallel execution, autonomous workflows, and intelligent task management.

## Features

- 32 specialized custom droids (LOW/MEDIUM/HIGH tiers)
- 35+ orchestration skills
- Autopilot mode for autonomous execution
- Ralph-loop for persistent task completion
- UltraWork for maximum parallelism
- Strategic planning with multi-agent consensus
- Built-in QA, security, and code review workflows

## Installation

### Method 1: Project-Local Installation (Recommended)

Clone and use directly in your project:

```bash
# Clone the repository
git clone https://github.com/MeroZemory/oh-my-droid.git
cd oh-my-droid

# The hooks are automatically configured via .factory/settings.json
# Just start droid in this directory
droid
```

### Method 2: Install to Your Project

Copy oh-my-droid into your existing project:

```bash
# Clone oh-my-droid
git clone https://github.com/MeroZemory/oh-my-droid.git /tmp/oh-my-droid

# Copy required files to your project
cp -r /tmp/oh-my-droid/scripts ./scripts
cp -r /tmp/oh-my-droid/.factory ./.factory

# Start droid in your project
droid
```

### Method 3: Global Installation

Install hooks globally for all projects:

**macOS/Linux:**
```bash
# Clone the repository
git clone https://github.com/MeroZemory/oh-my-droid.git ~/.factory/plugins/oh-my-droid

# Run the install script
cd ~/.factory/plugins/oh-my-droid
./install.sh
```

**Windows (PowerShell):**
```powershell
# Clone the repository
git clone https://github.com/MeroZemory/oh-my-droid.git $env:USERPROFILE\.factory\plugins\oh-my-droid

# Run the install script
cd $env:USERPROFILE\.factory\plugins\oh-my-droid
.\install.ps1
```

### Method 4: Manual Global Setup

Add hooks to your global settings manually:

```bash
# Edit ~/.factory/settings.json and add:
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/keyword-detector.mjs", "timeout": 5 }] }],
    "SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/session-start.mjs", "timeout": 5 }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node ~/.factory/plugins/oh-my-droid/scripts/persistent-mode.mjs", "timeout": 5 }] }]
  }
}
```

## Quick Start

Once installed, use magic keywords to activate special modes:

```bash
# Start droid
droid

# Ultrawork mode - maximum parallelism
ulw fix all the bugs

# Autopilot mode - autonomous execution
autopilot build a REST API

# Ralph mode - persistent until complete
ralph refactor the auth module

# Eco mode - token-efficient operation
eco analyze this file
```

## Magic Keywords

| Keyword | Mode | Description |
|---------|------|-------------|
| `ulw`, `ultrawork` | Ultrawork | Maximum parallel execution with multiple droids |
| `autopilot` | Autopilot | Full autonomous execution from idea to code |
| `ralph` | Ralph-loop | Persistent mode - won't stop until verified complete |
| `eco`, `ecomode` | Eco Mode | Token-efficient operation using lower-tier droids |
| `search`, `find` | Search Mode | Enhanced codebase exploration |
| `analyze`, `debug` | Analysis Mode | Deep investigation with architect consultation |

## Custom Droids (32)

| Family | Droids | Purpose |
|--------|--------|---------|
| Analysis | architect, architect-medium, architect-low, analyst, critic | Strategic advice, debugging, plan review |
| Execution | executor, executor-high, executor-low | Code implementation |
| Search | explore, explore-medium, explore-high | Codebase navigation |
| Frontend | designer, designer-high, designer-low | UI/UX development |
| Data Science | scientist, scientist-high, scientist-low | Data analysis, ML |
| QA & Testing | qa-tester, qa-tester-high, tdd-guide, tdd-guide-low | Testing workflows |
| Security | security-reviewer, security-reviewer-low | Security audits |
| Build | build-fixer, build-fixer-low | Build error resolution |
| Code Review | code-reviewer, code-reviewer-low | Code quality |
| Research | researcher, researcher-low | Documentation research |
| Planning | planner | Strategic planning |
| Docs | writer | Technical writing |
| Vision | vision | Image/diagram analysis |

## Custom Commands (8)

| Command | Description |
|---------|-------------|
| `/analyze` | Deep code analysis |
| `/build-fix` | Fix build errors |
| `/code-review` | Comprehensive code review |
| `/deep-search` | Thorough codebase search |
| `/release-notes` | Generate release notes |
| `/security-review` | Security vulnerability scan |
| `/tdd` | Test-driven development workflow |
| `/test-plan` | Generate test plans |

## Project Structure

```
oh-my-droid/
├── .factory/
│   └── settings.json      # Project-local hooks configuration
├── scripts/               # Hook implementation scripts
│   ├── keyword-detector.mjs
│   ├── session-start.mjs
│   ├── persistent-mode.mjs
│   └── ...
├── templates/
│   ├── droids/            # 32 custom droid definitions
│   └── commands/          # 8 slash commands
├── droids/                # Original droid definitions
├── skills/                # 35+ skill definitions
└── hooks/
    └── hooks.json         # Plugin hooks configuration
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Lint code
npm run lint
```

## Troubleshooting

### Hooks not executing

1. Verify `.factory/settings.json` exists in your project or `~/.factory/settings.json` globally
2. Check that scripts are executable: `chmod +x scripts/*.mjs`
3. Run droid with debug: `droid --debug`

### Ultrawork state persisting

Clear the state files:
```bash
rm -f .omd/ultrawork-state.json
rm -f ~/.factory/omd/ultrawork-state.json
```

### Scripts not found

Ensure you're running droid from the project directory, or use absolute paths in global settings.

## Credits

This project is based on **[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)** by **Yeachan Heo**, the multi-agent orchestration plugin for Claude Code CLI. Oh My Droid adapts the same architecture and patterns for the Factory AI Droid platform.

### Key Adaptations from oh-my-claudecode

| oh-my-claudecode | oh-my-droid |
|------------------|-------------|
| Agents | Custom Droids |
| `.omc/` state directory | `.omd/` state directory |
| `~/.claude/` global config | `~/.factory/` global config |
| Claude Code CLI | Factory AI Droid CLI |

## License

MIT License

Copyright (c) 2025 Jio Kim
Based on oh-my-claudecode - Copyright (c) 2025 Yeachan Heo

See [LICENSE](./LICENSE) for details.
