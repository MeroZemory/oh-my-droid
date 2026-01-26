> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.factory.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Custom Droids (Subagents)

> Create specialized subagents with their own prompts, tool access, and models that droid can delegate work to.

Custom droids are reusable subagents defined in Markdown. Each droid carries its own system prompt, model preference, and tooling policy so you can hand off focused tasks—like code review, security checks, or research—without re-typing instructions.

---

## 1 · What are custom droids?

Custom droids live as `.md` files under either your project's `.factory/droids/` or your personal `~/.factory/droids/` directory. The CLI scans these folders (top-level files only), validates each definition, and exposes them as `subagent_type` targets for the **Task** tool. This lets the primary assistant spin up purpose-built helpers mid-session.

<Note>
  Custom Droids are enabled by default. You can toggle them off in Settings (`/settings`) under the Experimental section if needed.
</Note>

* **Project droids** sit in `<repo>/.factory/droids/` and are shared with teammates.
* **Personal droids** live in `~/.factory/droids/` and follow you across workspaces.
* Project definitions override personal ones when the names match.

---

## 2 · Why use them?

* **Faster delegation** – encode complex checklists once and reuse them with a single tool call.
* **Stricter safety** – limit an agent to read-only, edit-only, or curated tool sets.
* **Context isolation** – each subagent runs with a fresh context window, avoiding prompt bloat.
* **Repeatable reviews** – capture team-specific review, testing, or release gates as code you can version.

---

## 3 · Quick start

1. Run `/droids` to launch the Droids menu.
2. Choose **Create a new Droid**, pick a storage location (project or personal), then follow the wizard to set:
   * Description of what the droid should do
   * System prompt (auto-generated or manually edited)
   * Identifier (name for the droid)
   * Model (or inherit from parent session)
   * Tools (explicit list of tool IDs or a category)
3. Save. The CLI writes `<name>.md` into the chosen `droids/` directory and normalizes the filename (lowercase, hyphenated).
4. Ask droid to use it, e.g. "Run the Task tool with subagent `code-reviewer` to review this diff," or trigger it from automation.

Changes to droid files are picked up on the next menu open or Task tool invocation.

---

## 4 · Configuration

Each droid file is Markdown with YAML frontmatter.

```md
---
name: code-reviewer
description: Focused reviewer that checks diffs for correctness risks
model: inherit
tools: read-only
---

You are the team's senior reviewer. Examine the diff the parent agent shares and:

- flag correctness, security, and migration risks
- list targeted follow-up tasks if changes are required
- confirm tests or manual validation needed before merge

Respond with:
Summary: <one-line finding>
Findings:

- <bullet>
- <bullet>
```

You can also specify tools as an array for more control:

```md
---
name: deep-analyzer
description: Thorough analysis with extended thinking
model: claude-sonnet-4-5-20250929
reasoningEffort: high
tools: ["Read", "Grep", "Glob", "WebSearch"]
---

Perform deep analysis of the code or problem presented...
```

Key metadata fields:

| Field               | Notes                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`            | Required. Lowercase letters, digits,`-`, `_`. Drives the `subagent_type` value and filename.                                                                                                                                                                                                                                                                  |
| `description`     | Optional. Shown in the UI list. Keep ≤500 chars.                                                                                                                                                                                                                                                                                                                   |
| `model`           | `inherit` (use parent session's model), or specify a model identifier. For built-in models, use values like `claude-sonnet-4-5-20250929`. For custom models (BYOK), use `custom:` + the `model` field from your config (e.g., `custom:gpt-4o-mini`), **not** the `model_display_name`. See the [pricing page](/pricing#pricing-table) for model IDs. |
| `reasoningEffort` | Optional. Set reasoning effort for models that support it (e.g.,`low`, `medium`, `high`). Ignored when `model` is `inherit`. Must be compatible with the selected model.                                                                                                                                                                                  |
| `tools`           | Tool selection: omit for all tools, use a category string (e.g.,`read-only`), or specify an array of tool IDs like `["Read", "Edit", "Execute"]`. Case-sensitive.                                                                                                                                                                                               |

Prompts must start with YAML frontmatter containing at least `name` and include a non-empty body. `DroidValidator` surfaces errors (invalid names, unknown models, unknown tools) and warnings (missing description, duplicated tools). Validation issues appear in the CLI logs when a file fails to load.

### Tool categories → concrete tools

You can use a category name directly as the `tools` value (e.g., `tools: read-only`) or specify individual tool IDs in an array.

| Category      | Tool IDs                             | Purpose                            |
| ------------- | ------------------------------------ | ---------------------------------- |
| `read-only` | `Read`, `LS`, `Grep`, `Glob` | Safe analysis and file exploration |
| `edit`      | `Create`, `Edit`, `ApplyPatch` | Code generation and modifications  |
| `execute`   | `Execute`                          | Shell command execution            |
| `web`       | `WebSearch`, `FetchUrl`          | Internet research and content      |
| `mcp`       | Dynamically populated (if any)       | Model Context Protocol tools       |

Explicit arrays must use the tool names above (case-sensitive). Unknown names cause validation errors.

<Note>
  `TodoWrite` is automatically included for all droids to enable task tracking. You don't need to add it to your tools list.
</Note>

<Note>
  When using `Edit` with OpenAI models, `ApplyPatch` is automatically included for compatibility. When `model` is `inherit`, both tools are enabled to ensure coverage across model providers.
</Note>

---

## 5 · Managing droids in the UI

`/droids` opens a modal displaying:

* **List of droids** – shows each droid with:
  * Name and model in parentheses
  * Description preview
  * Location badge (Project / Personal)
  * Tools summary (e.g., "All tools" or count of selected tools)
* **Create a new Droid** – launches a guided wizard:
  1. Choose location (Project or Personal)
  2. Describe what the droid should do
  3. Generate or manually edit the system prompt
  4. Confirm identifier, model, and tools
* **Import from Claude Code** – import existing agents from `~/.claude/agents/` as custom droids
* **Actions** – View, Edit, Delete droids, or Reload to refresh the list

---

## 5.5 · Importing Claude Code subagents

You can import agents created in Claude Code as custom droids. This lets you reuse your existing Claude Code agents with the Droids system.

### How to import

1. Run `/droids` to open the Droids menu
2. Press **I** to start the import flow
3. The CLI scans Claude Code agent directories:
   * **Project scope**: `<repo>/.claude/agents/` (workspace-specific agents)
   * **Personal scope**: `~/.claude/agents/` (personal agents)
4. Review the list of available agents:
   * Agents marked `(already exists)` are pre-deselected by default
   * Pre-selected agents are those not yet imported to Droids
5. Press **Space** to toggle individual selections, **A** to toggle all
6. Press **Enter** to import the selected agents

### What happens during import

The import process converts Claude Code agents into Droids:

1. **Metadata extraction**:

   * Agent name → droid `name`
   * Agent description (including examples and usage guidance) → droid `description`
   * Agent instructions → droid system prompt (body)
2. **Configuration mapping**:

   * Model: Maps Claude Code model families to Factory models:
     * `inherit` → `inherit`
     * `sonnet` → first available Sonnet model
     * `haiku` → first available Haiku model
     * `opus` → first available Opus model
   * Tools: Maps Claude Code tool names to Factory tools (may show validation warnings if tools don't map)
   * Location: Imports to Personal `~/.factory/droids/` by default
3. **Tool validation**:

   * Some Claude Code tools may not have equivalents in Factory
   * Invalid tools are listed with a warning: "Invalid tools: \[list]"
   * You can edit the droid to fix tool mappings or adjust tool access
4. **File creation**:

   * Creates a `.md` file in `~/.factory/droids/` (personal location)
   * Filename is normalized (lowercase, hyphenated)
   * File format: YAML frontmatter + system prompt body
5. **Import report**:

   * Shows success/failure for each agent
   * Imported agents are immediately available in the droid list
   * You can edit any imported droid to adjust model, tools, or prompt

### Example import flow

**Selection screen** (before import):

```
Import Droids (.claude/agents)

Project (<repo>/.claude/agents/):
> [x] polite-greeter
  Use this agent when the user requests a greeting, says hello, or asks for a polite
  welcome message. Examples: <example>...

  [ ] code-summarizer
  Use this agent when you need to understand what a code file does without diving into
  implementation details. Examples: <example>...

Personal (~/.claude/agents/):
  [x] security-checker
  Security analysis agent...

↑/↓ navigate • Space select • A toggle all • Enter import • B back
```

**After import** (back in droid list):

```
Custom Droids

> code-reviewer (gpt-5-codex)
  This droid verifies the correct base branch and committed...
  Location: Project  •  Tools: All tools

  polite-greeter (claude-opus-4-5-20251101)
  Use this agent when the user requests a greeting, says he...
  Location: Personal  •  Tools: 1 selected

  code-summarizer (claude-sonnet-4-5-20250929)
  Use this agent when you need to understand what a code fi...
  Location: Personal  •  Tools: All tools
```

### Handling tool validation errors

After importing, if you see **"Invalid tools: \[list]"**, it means some Claude Code tools don't have Factory equivalents:

1. **View the droid** (press Enter) to see the full tool list
2. **Edit the droid** (press E) to adjust:
   * Remove invalid tools from the list
   * Keep only valid Factory tools
3. **Check available tools** - the list shows which Factory tools are available

Common unmapped tools:

* Claude Code tools like `Write`, `NotebookEdit`, `BrowseURL` don't exist in Factory
* Replace with equivalent Factory tools:
  * `Write` → `Edit`, `Create`
  * `BrowseURL` → `WebSearch`, `FetchUrl`
* Or remove the `tools` section entirely to enable all Factory tools

---

## 6 · Using custom droids effectively

* **Invoke via the Task tool** – droid may call custom droids autonomously, or you can request it directly ("Use the subagent `security-auditor` on this change").
* **Choose models strategically** – use `inherit` to match the parent session, or specify a different model for specialized tasks:
  * Smaller/faster models for simple analysis and summary tasks (lower cost).
  * Larger/more capable models for complex reasoning, code review, and multi-step analysis.
  * See the [pricing page](/pricing#pricing-table) for available model IDs.
* **Limit tool access** – use explicit tool lists to restrict what a subagent can do, preventing unexpected shell commands or other dangerous operations.
* **Leverage live updates** – the Task tool now streams live progress, showing tool calls, results, and TodoWrite updates in real time as the subagent executes.
* **Structure output** – organize the prompt to emit sections like `Summary:` and `Findings:` so the Task tool UI can summarize results clearly.
* **Share and collaborate** – check `.factory/droids/*.md` into your repo so teammates can use shared droids, and version-control prompt updates like code.
* **Leverage Claude Code agents** – import your existing Claude Code agents (see section 5.5) to reuse them as custom droids in Factory.

---

## 7 · Examples

### Code reviewer (project scope)

```md
---
name: code-reviewer
description: Reviews diffs for correctness, tests, and migration fallout
model: inherit
tools: ["Read", "LS", "Grep", "Glob"]
---

You are the team's principal reviewer. Given the diff and context:

- Summarize the intent of the change.
- Flag correctness risks, missing tests, or rollback hazards.
- Call out any migrations or data changes that need coordination.

Reply with:
Summary: <one-line>
Findings:

- <issue or ✅ No blockers>
  Follow-up:
- <action or leave blank>
```

Use: "Run the subagent `code-reviewer` on the staged diff."

### Security sweeper (personal scope)

```md
---
name: security-sweeper
description: Looks for insecure patterns in recently edited files
model: inherit
tools: ["Read", "Grep", "WebSearch"]
---

Investigate the files referenced in the prompt for security issues:

- Identify injection, insecure transport, privilege escalation, or secrets exposure.
- Suggest concrete mitigations.
- Link to relevant CWE or internal standards when helpful.

Respond with:
Summary: <headline>
Findings:

- <file>: <issue>
  Mitigations:
- <recommendation>
```

### Task coordinator (with live progress)

```md
---
name: task-coordinator
description: Coordinates multi-step tasks with live progress updates
model: inherit
tools: ["Read", "Edit", "Execute"]
---

You are a task coordinator. Break down the goal into actionable steps:

1. Use TodoWrite to create and update a task list
2. For each task, read relevant files and execute commands as needed
3. Report progress in real-time using TodoWrite updates

Keep the task list updated with completion status (pending, in_progress, completed).
```

---

With custom droids, you capture tribal knowledge as code. Compose specialized prompts once, assign the right tools and models, and let the primary assistant delegate heavy lifts to the subagents you design.
