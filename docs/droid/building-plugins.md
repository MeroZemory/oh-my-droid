> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.factory.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Building Plugins

> Create shareable plugins with skills, commands, and tools for Droid.

This guide walks you through creating plugins for Droid. Plugins bundle skills, commands, and tools into shareable packages that work across projects and teams.

## Quick start

<Steps>
  <Step title="Create the plugin directory">
    ```bash  theme={null}
    mkdir -p my-plugin/.factory-plugin
    ```
  </Step>

  `<Step title="Create the manifest">`
    Create `my-plugin/.factory-plugin/plugin.json`:

    ``json  theme={null}     {       "name": "my-plugin",       "description": "A helpful plugin description",       "version": "1.0.0"     }     ``
  `</Step>`

  `<Step title="Add a command">`
    Create `my-plugin/commands/hello.md`:

| ```markdown  theme={null}                           |
| --------------------------------------------------- |
| description: Greet the user with a friendly message |
| ---                                                 |

    Greet the user warmly and ask how you can help them today.
    ````</Step>`

  `<Step title="Test your plugin">`
    Install from local directory to test:

    ``bash  theme={null}     droid plugin marketplace add ./my-plugin     droid plugin install my-plugin@my-plugin     ``

    Then run`/hello` to test.
  `</Step>`
`</Steps>`

## Plugin manifest

The manifest file at `.factory-plugin/plugin.json` defines your plugin's metadata:

```json
{
  "name": "my-plugin",
  "description": "What this plugin does",
  "version": "1.0.0",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "homepage": "https://github.com/you/my-plugin",
  "repository": "https://github.com/you/my-plugin",
  "license": "MIT"
}
```

### Required fields

| Field           | Description                                            |
| --------------- | ------------------------------------------------------ |
| `name`        | Unique identifier. Lowercase letters, digits, hyphens. |
| `description` | Short description shown in plugin manager.             |
| `version`     | Semantic version (e.g.,`1.0.0`).                     |

### Optional fields

| Field          | Description                                        |
| -------------- | -------------------------------------------------- |
| `author`     | Object with `name` and optional `email`.       |
| `homepage`   | URL for plugin documentation.                      |
| `repository` | Git repository URL.                                |
| `license`    | License identifier (e.g.,`MIT`, `Apache-2.0`). |

## Adding skills

Skills are model-invoked capabilities. Create them in the `skills/` directory:

```
my-plugin/
└── skills/
    └── code-review/
        └── SKILL.md
```

### Skill format

```markdown
---
name: code-review
description: Reviews code for best practices and potential issues. Use when reviewing code, checking PRs, or analyzing code quality.
---

When reviewing code, check for:
1. Code organization and structure
2. Error handling
3. Security concerns
4. Test coverage

Provide specific, actionable feedback with line references.
```

### Skill frontmatter

| Field                        | Required | Description                                                |
| ---------------------------- | -------- | ---------------------------------------------------------- |
| `name`                     | Yes      | Unique identifier for the skill                            |
| `description`              | Yes      | When to use this skill (helps model decide when to invoke) |
| `disable-model-invocation` | No       | Set `true` to make it user-only                          |
| `allowed-tools`            | No       | Restrict which tools the skill can use                     |

## Adding commands

Commands are user-invoked via slash syntax. Create them in the `commands/` directory:

```
my-plugin/
└── commands/
    └── review-pr.md
```

### Command format

```markdown
---
description: Review the current PR for issues
disable-model-invocation: true
---

# Review PR Command

Review the current pull request. Check for:
1. Code correctness and logic errors
2. Test coverage
3. Documentation updates
4. Breaking changes

If the user provides arguments: $ARGUMENTS

Use them to focus on specific areas of the review.
```

A command at `commands/review-pr.md` becomes `/review-pr`.

### Command arguments

Use `$ARGUMENTS` to capture user input:

```markdown
---
description: Greet a user by name
---

Greet the user named "$ARGUMENTS" warmly.
```

Usage: `/greet Alice`

## Adding agents

Define specialized subagents in the `droids/` directory:

```
my-plugin/
└── droids/
    └── security-reviewer.md
```

### Agent format

```markdown
---
name: security-reviewer
description: Reviews code for security vulnerabilities
model: inherit
tools: ["Read", "Grep", "Glob"]
---

You are a security expert. Review the code for:

1. Injection vulnerabilities (SQL, command, XSS)
2. Authentication/authorization issues
3. Sensitive data exposure
4. Insecure cryptography
5. Security misconfigurations

Report findings with severity levels and remediation steps.
```

See [Custom Droids](/cli/configuration/custom-droids) for full agent configuration options.

## Adding hooks

Define lifecycle hooks in `hooks/hooks.json`:

```
my-plugin/
└── hooks/
    ├── hooks.json
    └── format-check.sh
```

### Hook configuration

```json
{
  "PostToolUse": [
    {
      "matcher": "Write|Edit",
      "hooks": [
        {
          "type": "command",
          "command": "${DROID_PLUGIN_ROOT}/hooks/format-check.sh",
          "timeout": 30
        }
      ]
    }
  ]
}
```

### Environment variables

| Variable                                                                                   | Description                            |
| ------------------------------------------------------------------------------------------ | -------------------------------------- |
| `${DROID_PLUGIN_ROOT}`                                                                   | Absolute path to your plugin directory |
| `${CLAUDE_PLUGIN_ROOT}` | Alias for `${DROID_PLUGIN_ROOT}` (Claude Code compatibility) |                                        |

<Note>
  Plugin hooks cannot be imported via `/hooks import`. They only function within installed plugins where the plugin root path can be resolved.
</Note>

## Adding MCP servers

Configure MCP servers in `mcp.json` at the plugin root:

```json
{
  "mcpServers": {
    "my-api": {
      "command": "npx",
      "args": ["-y", "@example/mcp-server"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

## Testing plugins

### Local testing

Install from a local directory to test during development:

```bash
droid plugin marketplace add ./my-plugin
droid plugin install my-plugin@my-plugin
```

### Validation checklist

Before sharing your plugin:

* [ ] Manifest has required fields (`name`, `description`, `version`)
* [ ] All skills have `name` and `description` in frontmatter
* [ ] Commands work with and without arguments
* [ ] No hardcoded paths or machine-specific config
* [ ] README documents all commands and features

## Distributing plugins

### Creating a marketplace

A marketplace is a Git repository with a manifest listing available plugins:

```
my-marketplace/
├── .factory-plugin/
│   └── marketplace.json
├── plugin-one/
│   └── .factory-plugin/
│       └── plugin.json
└── plugin-two/
    └── .factory-plugin/
        └── plugin.json
```

### Marketplace manifest

Create `.factory-plugin/marketplace.json`:

```json
{
  "name": "my-marketplace",
  "description": "A collection of useful plugins",
  "owner": {
    "name": "Your Name"
  },
  "plugins": [
    {
      "name": "plugin-one",
      "description": "Description of plugin one",
      "source": "./plugin-one"
    },
    {
      "name": "plugin-two",
      "description": "Description of plugin two",
      "source": "./plugin-two"
    }
  ]
}
```

| Field                     | Required | Description                       |
| ------------------------- | -------- | --------------------------------- |
| `name`                  | Yes      | Marketplace identifier            |
| `description`           | No       | Shown when browsing marketplaces  |
| `owner`                 | No       | Contact information               |
| `plugins[].name`        | Yes      | Plugin identifier                 |
| `plugins[].source`      | Yes      | Relative path to plugin directory |
| `plugins[].description` | No       | Shown in plugin browser           |
| `plugins[].category`    | No       | For organizing plugins            |

### Version management

Use semantic versioning in your plugin manifest for documentation purposes:

* **Major** (1.0.0 → 2.0.0): Breaking changes
* **Minor** (1.0.0 → 1.1.0): New features, backward compatible
* **Patch** (1.0.0 → 1.0.1): Bug fixes

<Note>
  Droid tracks plugin versions by Git commit hash, not semantic version. When users update a plugin, they always get the latest commit from the marketplace. Version pinning is not currently supported.
</Note>

## Claude Code compatibility

Droid is fully compatible with Claude Code plugins. If you find a Claude Code plugin, you can install it directly and Droid will automatically translate the format.

## Best practices

<AccordionGroup>
  <Accordion title="Keep plugins focused">
    Design plugins around a single purpose or workflow. Prefer several small plugins over one monolithic plugin that does everything.
  </Accordion>

  `<Accordion title="Document thoroughly">`
    Include a README with:

    * What the plugin does
    * Installation instructions
    * All available commands and their usage
    * Configuration options
    * Examples`</Accordion>`

  `<Accordion title="Use semantic versioning">`
    Follow semver conventions so users know when updates might break their workflows.
  `</Accordion>`

  `<Accordion title="Test across environments">`
    Ensure your plugin works on macOS, Linux, and Windows if applicable. Use portable shell commands and avoid platform-specific paths.
  `</Accordion>`

  `<Accordion title="Handle errors gracefully">`
    Scripts should fail gracefully without blocking the user. Log errors but don't crash sessions.
  `</Accordion>`

  `<Accordion title="Respect user privacy">`
    Don't collect telemetry or send data without explicit consent. Document any network requests your plugin makes.
  `</Accordion>`
`</AccordionGroup>`

## Example: Complete plugin

Here's a complete example of a code review plugin:

```
code-review-plugin/
├── .factory-plugin/
│   └── plugin.json
├── commands/
│   └── review.md
├── skills/
│   └── review-patterns/
│       └── SKILL.md
├── droids/
│   └── reviewer.md
└── README.md
```

**`.factory-plugin/plugin.json`:**

```json
{
  "name": "code-review",
  "description": "Automated code review with multiple specialized reviewers",
  "version": "1.0.0",
  "author": { "name": "Your Team" }
}
```

**`commands/review.md`:**

```markdown
---
description: Run comprehensive code review on staged changes
---

Review the staged git changes using the review-patterns skill.
Focus on: $ARGUMENTS

If no focus area specified, perform a general review.
```

**`skills/review-patterns/SKILL.md`:**

```markdown
---
name: review-patterns
description: Use when reviewing code to check for common issues and best practices.
---

Check code for:
- Logic errors and edge cases
- Error handling completeness
- Security vulnerabilities
- Performance concerns
- Test coverage gaps
```

**`droids/reviewer.md`:**

```markdown
---
name: reviewer
description: Specialized code reviewer subagent
model: inherit
tools: read-only
---

You are a senior code reviewer. Analyze the provided code and report:

Summary: <one-line assessment>
Issues:
- <severity> <description>
Suggestions:
- <improvement>
```

## Next steps

<CardGroup cols={2}>
  <Card title="Plugins overview" href="/cli/configuration/plugins" icon="puzzle-piece">
    Learn about installing and managing plugins.
  </Card>

<Card title="Skills" href="/cli/configuration/skills" icon="wand-magic-sparkles">
    Deep dive into creating powerful skills.
  </Card>

  `<Card title="Custom commands" href="/cli/configuration/custom-slash-commands" icon="terminal">`
    Create user-invoked slash commands.
  `</Card>`

  `<Card title="Custom Droids" href="/cli/configuration/custom-droids" icon="robot">`
    Create specialized subagents for your plugins.
  `</Card>`
`</CardGroup>`
