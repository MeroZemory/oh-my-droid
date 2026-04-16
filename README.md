# oh-my-droid

[![GitHub stars](https://img.shields.io/github/stars/MeroZemory/oh-my-droid?style=flat&color=yellow)](https://github.com/MeroZemory/oh-my-droid/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**Multi-agent orchestration for Factory Droid. Zero learning curve.**

*Don't learn Factory Droid. Just use OMD.*

Based on [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo.

---

## Quick Start

**Step 1: Install**

```bash
droid plugin marketplace add https://github.com/MeroZemory/oh-my-droid
droid plugin install oh-my-droid@oh-my-droid
```

**Step 2: Setup**

```bash
/omd-setup
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
- **Automatic parallelization** - Complex tasks distributed across specialized agents
- **Persistent execution** - Won't give up until the job is verified complete
- **Cost optimization** - Smart model routing saves 30-50% on tokens
- **Learn from experience** - Automatically extracts and reuses problem-solving patterns
- **Real-time visibility** - HUD statusline shows what's happening under the hood

---

## Features

### Execution Modes

| Mode                 | Speed                 | Use For                          |
| -------------------- | --------------------- | -------------------------------- |
| **Autopilot**  | Fast                  | Full autonomous workflows        |
| **Ultrawork**  | Parallel              | Maximum parallelism for any task |
| **Ralph**      | Persistent            | Tasks that must complete fully   |
| **Ultrapilot** | 3-5x faster           | Multi-component systems          |
| **Ecomode**    | Fast + 30-50% cheaper | Budget-conscious projects        |
| **Swarm**      | Coordinated           | Parallel independent tasks       |
| **Pipeline**   | Sequential            | Multi-stage processing           |

### Intelligent Orchestration

- **34 specialized droids** for architecture, research, design, testing, data science
- **Smart model routing** - Haiku for simple tasks, Opus for complex reasoning
- **Automatic delegation** - Right droid for the job, every time

### Developer Experience

- **Magic keywords** - `ralph`, `ulw`, `eco`, `plan` for explicit control
- **HUD statusline** - Real-time orchestration metrics in your status bar
- **Skill learning** - Extract reusable patterns from your sessions
- **Analytics & cost tracking** - Understand token usage across all sessions

---

## Magic Keywords

Optional shortcuts for power users. Natural language works fine without them.

| Keyword       | Effect                       | Example                         |
| ------------- | ---------------------------- | ------------------------------- |
| `autopilot` | Full autonomous execution    | `autopilot: build a todo app` |
| `ralph`     | Persistence mode             | `ralph: refactor auth`        |
| `ulw`       | Maximum parallelism          | `ulw fix all errors`          |
| `eco`       | Token-efficient execution    | `eco: migrate database`       |
| `plan`      | Planning interview           | `plan the API`                |
| `ralplan`   | Iterative planning consensus | `ralplan this feature`        |
| `deep-interview` | Socratic requirements clarification | `deep-interview this requirement` |
| `slop` | Detect and clean AI slop patterns | `slop src/` |

**ralph includes ultrawork:** When you activate ralph mode, it automatically includes ultrawork's parallel execution. No need to combine keywords.

---

## Utilities

### Rate Limit Wait

Auto-resume Factory Droid sessions when rate limits reset.

```bash
omd wait          # Check status, get guidance
omd wait --start  # Enable auto-resume daemon
omd wait --stop   # Disable daemon
```

**Requires:** tmux (for session detection)

---

## Requirements

- [Factory Droid](https://docs.factory.ai) CLI
- Factory AI subscription or API key

---

## License

MIT

---

<div align="center">

**Based on:** [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) by Yeachan Heo

**Inspired by:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [claude-hud](https://github.com/ryanjoachim/claude-hud)

**Zero learning curve. Maximum power.**

</div>
