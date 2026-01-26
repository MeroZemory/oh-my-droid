# Oh My Droid

Multi-agent orchestration plugin for Factory AI Droid CLI.

> **Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)** by Yeachan Heo - This project is a port of the oh-my-claudecode plugin, adapted for Factory AI's Droid CLI platform. All core architecture, agent definitions, skills, and orchestration patterns are derived from oh-my-claudecode.

## Overview

Oh My Droid transforms Droid into an orchestration conductor with 32 specialized droids and 35+ skills for parallel execution, autonomous workflows, and intelligent task management.

## Installation

```bash
# Install from marketplace (coming soon)
droid plugin install oh-my-droid

# Or install from local directory during development
droid plugin install /path/to/oh-my-droid
```

## Features

- 32 specialized custom droids (LOW/MEDIUM/HIGH tiers)
- 35+ orchestration skills
- Autopilot mode for autonomous execution
- Ralph-loop for persistent task completion
- UltraWork for maximum parallelism
- Strategic planning with multi-agent consensus
- Built-in QA, security, and code review workflows

## Quick Start

Coming soon.

## Development

```bash
# Install dependencies
npm install

# Build plugin
npm run build

# Watch mode for development
npm run watch

# Run tests
npm test

# Lint code
npm run lint
```

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
