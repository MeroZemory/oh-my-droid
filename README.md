# oh-my-droid

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Multi-agent orchestration for Factory Droid. Zero learning curve.**

*Don't learn Droid. Just use OMD.*

Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo.

---

## Quick Start

**Step 1: Install**
```bash
droid plugin marketplace add MeroZemory/oh-my-droid
droid plugin install oh-my-droid@oh-my-droid
```

**Step 2: Setup**
```bash
/oh-my-droid:omd-setup
```

**Step 3: Build something**
```
autopilot: build a REST API for managing tasks
```

That's it. Everything else is automatic.

---

## Why oh-my-droid?

- **Zero configuration required** - Works out of the box with intelligent defaults
- **Natural language interface** - No commands to memorize, just describe what you want
- **Automatic parallelization** - Complex tasks distributed across specialized droids
- **Persistent execution** - Won't give up until the job is verified complete
- **Cost optimization** - Smart model routing saves 30-50% on tokens
- **Real-time visibility** - HUD statusline shows what's happening under the hood

---

## Features

### Execution Modes

| Mode | Speed | Use For |
|------|-------|---------|
| **Autopilot** | Fast | Full autonomous workflows |
| **Ultrapilot** | 3-5x faster | Multi-component systems |
| **Ecomode** | Fast + 30-50% cheaper | Budget-conscious projects |
| **Swarm** | Coordinated | Parallel independent tasks |
| **Pipeline** | Sequential | Multi-stage processing |

### Intelligent Orchestration

- **32 specialized droids** for architecture, research, design, testing, data science
- **Smart model routing** - Haiku for simple tasks, Opus for complex reasoning
- **Automatic delegation** - Right droid for the job, every time

### Developer Experience

- **Magic keywords** - `ralph`, `ulw`, `eco`, `plan` for explicit control
- **HUD statusline** - Real-time orchestration metrics in your status bar
- **Skill learning** - Extract reusable patterns from your sessions

---

## Magic Keywords

Optional shortcuts for power users. Natural language works fine without them.

| Keyword | Effect | Example |
|---------|--------|---------|
| `autopilot` | Full autonomous execution | `autopilot: build a todo app` |
| `ralph` | Persistence mode | `ralph: refactor auth` |
| `ulw` | Maximum parallelism | `ulw fix all errors` |
| `eco` | Token-efficient execution | `eco: migrate database` |
| `plan` | Planning interview | `plan the API` |
| `ultrapilot` | Parallel autopilot (3-5x) | `ultrapilot: fullstack app` |
| `swarm` | Coordinated N droids | `swarm 5 fix all issues` |
| `pipeline` | Sequential chaining | `pipeline: analyze then fix` |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

---

## Installation

### Method 1: Droid Marketplace (Recommended)

```bash
droid plugin marketplace add MeroZemory/oh-my-droid
droid plugin install oh-my-droid@oh-my-droid
```

### Method 2: Clone and Use Locally

```bash
git clone https://github.com/MeroZemory/oh-my-droid.git
cd oh-my-droid
droid
```

---

## Custom Droids (32)

32 specialized droids organized by family and tier.

| Family | LOW (Haiku) | MEDIUM (Sonnet) | HIGH (Opus) |
|--------|-------------|-----------------|-------------|
| **Analysis** | `architect-low` | `architect-medium` | `architect` |
| **Execution** | `executor-low` | `executor` | `executor-high` |
| **Search** | `explore` | `explore-medium` | `explore-high` |
| **Frontend** | `designer-low` | `designer` | `designer-high` |
| **Data Science** | `scientist-low` | `scientist` | `scientist-high` |
| **QA & Testing** | `tdd-guide-low` | `qa-tester` / `tdd-guide` | `qa-tester-high` |
| **Security** | `security-reviewer-low` | - | `security-reviewer` |
| **Build** | `build-fixer-low` | `build-fixer` | - |
| **Code Review** | `code-reviewer-low` | - | `code-reviewer` |
| **Research** | `researcher-low` | `researcher` | - |
| **Planning** | - | - | `planner` |
| **Critique** | - | - | `critic` / `analyst` |
| **Docs** | `writer` | - | - |
| **Vision** | - | `vision` | - |

---

## Skills (35+)

All skills use the `oh-my-droid:` prefix.

### Core Orchestration

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `autopilot` | Full autonomous execution | "autopilot", "build me" |
| `ralph` | Persistence until done | "ralph", "don't stop" |
| `ultrawork` | Maximum parallelism | "ulw", "ultrawork" |
| `ultrapilot` | Parallel autopilot | "ultrapilot" |
| `ecomode` | Token-efficient mode | "eco", "budget" |
| `swarm` | Coordinated N droids | "swarm" |
| `pipeline` | Sequential chaining | "pipeline" |
| `cancel` | Unified cancel | "cancelomd" |

### Planning & Analysis

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `plan` | Planning interview | "plan this" |
| `ralplan` | Iterative consensus | "ralplan" |
| `review` | Plan critique | "review plan" |
| `analyze` | Deep investigation | "analyze", "debug" |
| `deepsearch` | Codebase search | "search", "find" |
| `deepinit` | Generate AGENTS.md | "index codebase" |

### Quality Assurance

| Skill | Purpose |
|-------|---------|
| `ultraqa` | Test/fix cycling |
| `code-review` | Comprehensive review |
| `security-review` | Security audit |
| `tdd` | Test-driven development |
| `build-fix` | Build error resolution |

### Utilities

| Skill | Purpose |
|-------|---------|
| `frontend-ui-ux` | Design sensibility (auto) |
| `git-master` | Git expertise (auto) |
| `learner` | Extract reusable skills |
| `note` | Save to notepad |
| `hud` | Configure statusline |
| `doctor` | Diagnose installation |
| `research` | Parallel research |
| `mcp-setup` | Configure MCP servers |

---

## Development

```bash
# Clone and build
git clone https://github.com/MeroZemory/oh-my-droid.git
cd oh-my-droid
npm install
npm run build

# Watch mode
npm run dev

# Tests
npm test

# Lint
npm run lint
```

---

## Troubleshooting

### Plugin not loading after install

```bash
# Reinstall via marketplace
droid plugin uninstall oh-my-droid@oh-my-droid
droid plugin install oh-my-droid@oh-my-droid
```

### Hooks not executing

1. Verify custom droids are enabled in Factory settings
2. Check `~/.factory/settings.json` for hooks configuration
3. Run `droid --debug` for verbose output

### State stuck / mode won't cancel

```bash
# Clear all state
rm -rf .omd/state/
# Or say in droid:
cancelomd --force
```

---

## Credits

Based on **[oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)** by **Yeachan Heo**.

| oh-my-claudecode | oh-my-droid |
|------------------|-------------|
| Claude Code CLI | Factory AI Droid CLI |
| Agents | Custom Droids |
| `.omc/` state | `.omd/` state |
| `~/.claude/` config | `~/.factory/` config |
| `oh-my-claudecode:` prefix | `oh-my-droid:` prefix |

All core architecture, agent definitions, skills, and orchestration patterns are derived from oh-my-claudecode.

---

## Requirements

- [Factory Droid CLI](https://factory.ai)
- Claude Max/Pro subscription OR Anthropic API key

---

## License

MIT - Copyright (c) 2025 Jio Kim. Based on oh-my-claudecode - Copyright (c) 2025 Yeachan Heo.

See [LICENSE](./LICENSE) for full text.
