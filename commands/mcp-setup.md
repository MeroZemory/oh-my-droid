---
description: Configure popular MCP servers for enhanced agent capabilities
---

# MCP Setup

Configure Model Context Protocol (MCP) servers to extend Factory Droid's capabilities with external tools like web search, file system access, and GitHub integration.

## Overview

MCP servers provide additional tools that Factory Droid agents can use. This skill helps you configure popular MCP servers in your `~/.factory/settings.json`.

## Step 1: Show Available MCP Servers

Present the user with available MCP server options using AskUserQuestion:

**Question:** "Which MCP server would you like to configure?"

**Options:**
1. **Context7** - Documentation and code context from popular libraries
2. **Exa Web Search** - Enhanced web search (replaces built-in websearch)
3. **Filesystem** - Extended file system access with additional capabilities
4. **GitHub** - GitHub API integration for issues, PRs, and repository management
5. **All of the above** - Configure all recommended MCP servers
6. **Custom** - Add a custom MCP server

## Step 2: Gather Required Information

### For Context7:
No API key required. Ready to use immediately.

### For Exa Web Search:
Ask for API key:
```
Do you have an Exa API key?
- Get one at: https://exa.ai
- Enter your API key, or type 'skip' to configure later
```

### For Filesystem:
Ask for allowed directories:
```
Which directories should the filesystem MCP have access to?
Default: Current working directory
Enter comma-separated paths, or press Enter for default
```

### For GitHub:
Ask for token:
```
Do you have a GitHub Personal Access Token?
- Create one at: https://github.com/settings/tokens
- Recommended scopes: repo, read:org
- Enter your token, or type 'skip' to configure later
```

## Step 3: Update settings.json

Read the current `~/.factory/settings.json` and add/update the `mcpServers` section.

### Context7 Configuration:
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### Exa Web Search Configuration:
```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "<user-provided-key>"
      }
    }
  }
}
```

### Filesystem Configuration:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "<allowed-directories>"]
    }
  }
}
```

### GitHub Configuration:
```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<user-provided-token>"
      }
    }
  }
}
```
> Note: GitHub MCP requires Docker. Alternatively, configure as a remote URL: https://api.githubcopilot.com/mcp/

## Step 4: Merge Configuration

When updating settings.json:

1. Read existing file: `~/.factory/settings.json`
2. Parse as JSON (handle comments with jsonc-parser if needed)
3. Merge new `mcpServers` entries with existing ones (don't overwrite user's other MCP servers)
4. Write back to file with proper formatting

```bash
# Backup existing settings first
cp ~/.factory/settings.json ~/.factory/settings.json.bak 2>/dev/null || true
```

Use the Edit tool or Write tool to update the settings file, preserving existing configuration.

## Step 5: Verify Installation

After configuration, verify the MCP servers are properly set up:

```bash
# Check if settings.json has mcpServers
grep -q "mcpServers" ~/.factory/settings.json && echo "MCP servers configured" || echo "Configuration may have failed"

# List configured servers
node -e "const s = require('$HOME/.factory/settings.json'); console.log('Configured MCP servers:', Object.keys(s.mcpServers || {}).join(', ') || 'none')"
```

## Step 6: Show Completion Message

```
MCP Server Configuration Complete!

CONFIGURED SERVERS:
[List the servers that were configured]

NEXT STEPS:
1. Restart Factory Droid for changes to take effect
2. The configured MCP tools will be available to all agents

USAGE TIPS:
- Context7: Ask about library documentation (e.g., "How do I use React hooks?")
- Exa: Use for web searches (e.g., "Search the web for latest TypeScript features")
- Filesystem: Extended file operations beyond the working directory
- GitHub: Interact with GitHub repos, issues, and PRs

TROUBLESHOOTING:
- If MCP servers don't appear, check ~/.factory/settings.json for syntax errors
- Ensure you have Node.js 18+ installed for npx commands
- Run /oh-my-droid:doctor to diagnose issues

To add more MCP servers later, run: /oh-my-droid:mcp-setup
```

## Custom MCP Server

If user selects "Custom":

Ask for:
1. Server name (identifier)
2. Command to run (e.g., `npx`, `node`, path to executable)
3. Arguments (comma-separated)
4. Environment variables (optional, key=value pairs)

Then add to mcpServers section accordingly.

## Common Issues

### MCP Server Not Loading
- Ensure Node.js 18+ is installed
- Check that npx is available in PATH
- Verify no JSON syntax errors in settings.json

### API Key Issues
- Exa: Verify key at https://dashboard.exa.ai
- GitHub: Ensure token has required scopes

### Agents Still Using Built-in Tools
- Restart Factory Droid after configuration
- The built-in websearch will be deprioritized when exa is configured
