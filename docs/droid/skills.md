> ## Documentation Index
>
> Fetch the complete documentation index at: https://docs.factory.ai/llms.txt
> Use this file to discover all available pages before exploring further.

# Skills

> Reusable capabilities that your AI agent invokes on demand.

Skills are **reusable capabilities** that your AI agent invokes on demand. They pack instructions, expertise, and tools into a lightweight package.

<Tip>
  Explore the full [skills cookbooks](/guides/skills) for examples.
</Tip>

**Key properties:**

* **Model-invoked** – Droids decide when to use them based on the task, not typed commands
* **Composable** – can be chained together as part of larger workflows
* **Token-efficient** – lightweight and focused, not bloated with unused tools or repeated instructions

**A skill can be:**

* **A workflow** – step-by-step instructions (e.g., "navigate to URL, take screenshot, extract data")
* **Expertise** – domain knowledge and conventions (e.g., "how we implement frontend features with our design system")
* **Both** – instructions + tools + best practices bundled together

**Example skills:**

* `browser` – automate Chrome with CDP tools (navigate, screenshot, evaluate JS)
* `linear` – manage Linear issues with CLI tools (list, update status, move teams)
* `frontend-ui-integration` – implement typed React flows following team conventions

## What is a skill?

A skill is a **directory** (e.g. `.factory/skills/frontend-ui-integration/`) containing:

* `SKILL.md` or `skill.mdx` with YAML frontmatter and markdown instructions
* Optional supporting files (scripts, schemas, checklists)

Each skill defines what problem it solves, what inputs it expects, and what success looks like. The Droid automatically invokes matching skills when they apply to the current task.

## Skill file format

Skills are defined in Markdown with YAML frontmatter. A small, focused skill can be just a short `SKILL.md`:

```md
---
name: summarize-diff
description: Summarize the staged git diff in 3–5 bullets. Use when the user asks for a summary of pending changes.
---

# Summarize Diff

## Instructions

1. Run `git diff --staged`.
2. Summarize the changes in 3–5 bullets, focusing on user-visible behavior.
3. Call out any migrations, risky areas, or tests that should be run.
```

You can also include additional frontmatter fields such as `allowed-tools` in future iterations; for now, `name` and `description` are the key fields that help Droids discover and use your skill.

## Where skills live

Skills are discovered from a small set of well-known locations:

| Scope               | Location                    | Purpose                                                         |
| ------------------- | --------------------------- | --------------------------------------------------------------- |
| **Workspace** | `<repo>/.factory/skills/` | Project skills shared with teammates; checked into git.         |
| **Personal**  | `~/.factory/skills/`      | Private skills that follow you across projects on your machine. |

Each **skill** lives in its own directory under one of these roots:

* Workspace: `<repo>/.factory/skills/<skill-name>/SKILL.md`
* Personal: `~/.factory/skills/<skill-name>/SKILL.md`

In large monorepos, you can either:

* Keep a **single, shared** skills folder at the root:

  ```text
  .factory/skills/
    frontend/
      SKILL.md
    payments-service/
      SKILL.md
    data-warehouse-querying/
      SKILL.md
  ```
* Or add **per-project** `.factory` folders so skills live alongside each subproject:

  ```text
  services/payments/.factory/skills/
    payments-service/
      SKILL.md
  apps/frontend/.factory/skills/
    dashboard-ui/
      SKILL.md
  ```

Project skills are the primary way to share and standardize capabilities inside an engineering org; personal skills are ideal for individual workflows or experiments.

## Quickstart

<Steps>
  <Step title="Create a skill folder">
    Under your repo, create a directory in `.factory/skills/`, for example
    `.factory/skills/frontend-ui-integration/`.
  </Step>

  `<Step title="Add SKILL.md or skill.mdx">`
    Inside the folder, create `SKILL.md` or `skill.mdx` with YAML frontmatter
    (`name`, `description`) and markdown instructions that define the
    capability, inputs, and success criteria.
  `</Step>`

  `<Step title="Add supporting files (optional)">`
    Co-locate any types, schemas, or checklists the Droid should use when the
    skill is active (for example `types.ts`, `schemas/`, or
    `rollout-checklist.md`).
  `</Step>`

  `<Step title="Restart and use">`
    Restart `droid` or your integration so it rescans skills, then describe
    your task normally. The Droid will automatically invoke matching skills
    when they apply.
  `</Step>`
`</Steps>`

## How skills differ from other configuration

Skills sit alongside other ways of shaping Droid behavior:

* **Custom droids** – define *which* model and tools to use and at what autonomy level; they are full agent configurations.
* **Custom slash commands** – are **user-invoked** macros you call explicitly (e.g., `/review-pr`); they don’t automatically trigger based on the task.
* **MCP servers** – expose external systems (APIs, databases, SaaS tools) as tools; they are about *connecting* resources, not encoding your workflow.

Skills are different because they:

* Package **how work should be done** (your engineering playbook) as reusable capabilities.
* Are **discoverable and composable** – the Droid can chain multiple skills inside a plan.
* Can sit on top of tools, custom droids, and MCP servers to orchestrate them safely.

In practice you might:

* Use MCP to expose your internal deployment API.
* Use a custom droid to define which tools/models are allowed in CI.
* Use a skill to encode "how to safely roll out a canary deployment" using that API and droid configuration.

## Why skills matter in enterprise codebases

Skills are especially valuable in enterprise environments where you need to:

* Standardize how Droids do **frontend implementation, service integrations, data querying, and internal tools**.
* Encode **team conventions, safety rules, and SLAs** once, then reuse them across projects.
* Make automation **discoverable, auditable, and shareable** via git, not just "whatever happened in one chat".

You can create skills from scratch for Factory, or reuse existing skills you already invested in for other agents by importing them and wiring them into your droid configuration.

# Best practices

<AccordionGroup>
  <Accordion title="Keep each skill narrow and outcome-focused">
    Design skills around a **single responsibility** (e.g., "implement a typed
    React UI for an existing endpoint"), not "build the whole feature".
    Define a **crisp success criterion**: what artifacts should exist when the
    skill finishes (files changed, tests added, docs updated, approvals
    gathered). Prefer several small skills composed by a Droid over one giant
    "do everything" skill.
  </Accordion>

  `<Accordion title="Make inputs explicit and structured">`
    Document required inputs: repo path, services involved, APIs, schemas,
    feature flag names, etc. Use **structured fields** (JSON snippets, bullet
    lists, tables) instead of long prose when describing APIs or data models.
    For security-sensitive workflows, include explicit **"never do"**
    constraints and escalation conditions.
  `</Accordion>`

  `<Accordion title="Encode team conventions and guardrails">`
    Bake in your **testing, observability, and rollout requirements** so the
    skill always follows them. Reference your existing **AGENTS.md**, runbooks,
    and design docs instead of inlining everything. Require **proof
    artifacts**: tests, screenshots, log queries, or links to dashboards
    depending on the domain.
  `</Accordion>`

  `<Accordion title="Design for enterprise constraints">`
    Assume **large monorepos, multiple services, and layered approvals**. Be
    explicit about **which directories** Droids may touch, which
    languages/frameworks are in-bounds, and which are not. Include guidance for
    **cross-team dependencies** – when to stub, when to coordinate with
    another team, and when to stop and ask.
  `</Accordion>`

  `<Accordion title="Make skills composable">`
    Prefer **idempotent** skills: safe to rerun on the same branch/PR. Design
    skills to produce **machine-parseable output** where possible (for example,
    a short summary block that other skills can consume). Keep skills
    **stateless** beyond the current branch: no hidden assumptions about prior
    runs.
  `</Accordion>`

  `<Accordion title="Operate with verification and safety">`
    Always include a **"Verification"** section that lists commands Droids
    must run before completing the skill. Call out **fallbacks** when
    verification fails (rollback steps, feature flags, or canary paths). For
    production-adjacent skills, require that Droids **open PRs but never
    merge** without human review.
  `</Accordion>`
`</AccordionGroup>`

## Cookbook

The cookbook provides opinionated skill templates aimed at common enterprise software workflows.

We focus on seven families of skills:

1. **[Frontend implementation skills](/guides/skills/frontend-ui-integration)** – building UI surfaces that integrate with existing APIs
2. **[Integration skills for complex codebases](/cli/configuration/skills/service-integration)** – extending or wiring together services in large monorepos
3. **[Internal data querying skills](/cli/configuration/skills/data-querying)** – safe, auditable access to internal analytics or data services
4. **[Internal tools skills](/cli/configuration/skills/internal-tools)** – building small but robust internal apps that improve developer and operator workflows
5. **[Vibe coding skills](/cli/configuration/skills/vibe-coding)** – rapidly prototyping and building complete modern web applications from scratch (Lovable/Bolt/v0 replacement)
6. **[AI data analyst skills](/cli/configuration/skills/ai-data-analyst)** – comprehensive data analysis, visualization, and statistical modeling (data analyst tool replacement)
7. **[Product management skills](/cli/configuration/skills/product-management)** – assisting with PRDs, feature analysis, and PM workflows (PM tool augmentation)
8. **[Browser automation skills](/cli/configuration/skills/browser)** – launching Chrome via CDP, navigating live tabs, evaluating DOM state, and collecting screenshots or selectors without running an MCP server

<CardGroup cols={2}>
  <Card title="Frontend UI integration" href="/guides/skills/frontend-ui-integration" icon="layout">
    Implement typed, tested frontend flows against existing backend APIs using
    your design system, routing, and testing conventions.
  </Card>

  `<Card title="Service integration in complex codebases" href="/cli/configuration/skills/service-integration" icon="layers">`
    Extend or wire backend services in a shared monorepo while respecting
    ownership boundaries, observability, and rollout requirements.
  `</Card>`

  `<Card title="Internal data querying" href="/cli/configuration/skills/data-querying" icon="database">`
    Safely query internal analytics and data services, producing reproducible
    queries and shareable analysis artifacts.
  `</Card>`

  `<Card title="Internal tools" href="/cli/configuration/skills/internal-tools" icon="settings">`
    Build or extend internal-facing tools (admin panels, consoles, utilities)
    with strong RBAC, audit logging, and operational safeguards.
  `</Card>`

  `<Card title="Vibe coding" href="/cli/configuration/skills/vibe-coding" icon="globe">`
    Rapidly prototype and build complete modern web applications from scratch
    using React, Next.js, Vue, or other frameworks. Local-first alternative to
    Lovable, Bolt, and v0.
  `</Card>`

  `<Card title="AI data analyst" href="/cli/configuration/skills/ai-data-analyst" icon="chart-line">`
    Perform comprehensive data analysis, statistical modeling, and create
    publication-quality visualizations using Python and the full data science
    ecosystem.
  `</Card>`

  `<Card title="Product management" href="/cli/configuration/skills/product-management" icon="clipboard-list">`
    Assist with product management workflows including writing PRDs, analyzing
    features, synthesizing research, and planning roadmaps.
  `</Card>`

  `<Card title="Browser automation" href="/cli/configuration/skills/browser" icon="browser">`
    Launch Chrome with remote debugging, drive tabs, evaluate DOM state, and
    capture screenshots or selectors without deploying extra infrastructure.
  `</Card>`
`</CardGroup>`

In practice, each skill folder can also contain **supporting utilities** the agent may use alongside the core prompt template – for example:

* `SKILL.md` or `skill.mdx` – the main skill specification
* `references.md` – links and pointers to types, APIs, and modules that already exist in your codebase
* `schemas/` – JSON/YAML schemas or OpenAPI snippets referenced by the skill (not the source-of-truth service code)
* `checklists.md` – reusable validation or rollout checklists

These co-located files give the agent a predictable, structured bundle of context to work from when the skill is invoked, without duplicating or relocating production code.

Use these as starting points and adapt the inputs, constraints, and verification steps to match your stack and governance requirements.
