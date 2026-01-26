---
name: help
description: Show oh-my-droid usage guide and available features
---

# Help Skill

Display comprehensive usage guide for oh-my-droid.

## Usage

```
/oh-my-droid:help
```

## Output

```
# oh-my-droid - Intelligent Android Development Multi-Agent System

## Quick Start

You don't need to learn commands. Just describe what you want to build:
- "I want a login screen with Material Design"
- "Build me a RecyclerView with swipe-to-delete"
- "Create a ViewModel for user profile"

Everything activates automatically based on your intent.

## Magic Keywords (Optional Shortcuts)

Include these in your requests for specific behaviors:

| Keyword | Effect | Example |
|---------|--------|---------|
| ralph | Persistence mode | "ralph: fix the rotation bug" |
| ralplan | Iterative planning | "ralplan this feature" |
| ulw | Max parallelism | "ulw implement all screens" |
| eco | Token-efficient mode | "eco fix all lint errors" |
| plan | Planning interview | "plan the new feature" |

Combine them: "ralph ulw: implement authentication"

## Automatic Behaviors

### Multi-Agent Orchestration
Complex Android tasks are automatically parallelized across specialized agents:
- android-architect (system design)
- kotlin-expert (code implementation)
- layout-designer (XML/Compose UI)
- gradle-expert (build configuration)
- And 20+ more specialized agents

### Intelligent Delegation
Frontend work → layout-designer
Complex debugging → android-architect
Gradle issues → gradle-expert
Testing → test-expert

### Context-Aware Planning
Vague requests trigger an interactive planning interview to clarify requirements.

## Available Skills

### Core Workflows
- `/oh-my-droid:ralph` - Persistent development until verified complete
- `/oh-my-droid:ultrawork` - Maximum parallel execution
- `/oh-my-droid:plan` - Interactive planning session
- `/oh-my-droid:ralplan` - Iterative planning with consensus

### Analysis & Search
- `/oh-my-droid:analyze` - Deep analysis and debugging
- `/oh-my-droid:deepsearch` - Thorough codebase search
- `/oh-my-droid:deepinit` - Generate AGENTS.md hierarchy

### Testing & QA
- `/oh-my-droid:ultraqa` - Automated QA cycling
- `/oh-my-droid:code-review` - Comprehensive code review

### Knowledge Management
- `/oh-my-droid:learner` - Extract reusable skills
- `/oh-my-droid:note` - Save compaction-resistant notes
- `/oh-my-droid:local-skills-setup` - Manage local skills

### Utilities
- `/oh-my-droid:cancel` - Stop active modes
- `/oh-my-droid:doctor` - Diagnose installation issues
- `/oh-my-droid:hud` - Configure HUD display
- `/oh-my-droid:omd-setup` - Initial setup wizard
- `/oh-my-droid:help` - Show this guide

## Android-Specific Features

### Layout Design
Automatically creates Material Design compliant layouts with proper:
- ConstraintLayout usage
- Material Components
- Dark theme support
- Accessibility attributes

### Architecture Patterns
Follows modern Android architecture:
- MVVM with ViewModel
- Repository pattern
- Kotlin Coroutines
- LiveData/StateFlow

### Build Configuration
Handles Gradle setup including:
- Dependency management
- Build variants
- ProGuard rules
- Version catalogs

## Configuration

### Project Setup
Run `/oh-my-droid:omd-setup` for guided setup.

### HUD Display
Configure statusline with `/oh-my-droid:hud setup`.

### MCP Servers
Add external tools with `/oh-my-droid:mcp-setup`.

## Learn More

### Usage Patterns
Run `/oh-my-droid:learn-about-omd` to analyze your usage and get recommendations.

### Local Skills
Run `/oh-my-droid:local-skills-setup` to manage project-specific knowledge.

## Troubleshooting

If something isn't working:
1. Run `/oh-my-droid:doctor` for diagnostics
2. Check `/oh-my-droid:hud status` for mode status
3. Use `/oh-my-droid:cancel` to reset active modes

## Support

- GitHub: https://github.com/YOUR_REPO/oh-my-droid
- Issues: https://github.com/YOUR_REPO/oh-my-droid/issues

---

*oh-my-droid - Making Android development with Claude Code effortless*
```

## Notes

This skill should be invoked when:
- User types `/oh-my-droid:help`
- User asks "how do I use oh-my-droid?"
- User needs guidance on available features
