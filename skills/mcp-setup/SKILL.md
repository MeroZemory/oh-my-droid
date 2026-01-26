---
name: mcp-setup
description: Set up MCP servers for enhanced Android development capabilities
---

# MCP Setup Skill

Configure MCP (Model Context Protocol) servers to extend Claude Code with additional tools for Android development.

## What are MCP Servers?

MCP servers provide Claude Code with external capabilities like:
- Web search for Android documentation
- GitHub integration for library exploration
- Stack Overflow search for Android issues
- Android SDK documentation access

## Usage

```
/oh-my-droid:mcp-setup
```

## Interactive Setup

The skill guides you through configuring useful MCP servers:

### Step 1: Check Current Configuration

```bash
# Check if settings.json exists
if [ -f ~/.factory/settings.json ]; then
  echo "Current MCP configuration:"
  cat ~/.factory/settings.json | jq '.mcpServers // {}'
else
  echo "No MCP servers configured yet"
fi
```

### Step 2: Offer Popular MCP Servers

Use AskUserQuestion to present options:

**Question:** "Which MCP servers would you like to configure?"

**Options:**
1. **Context7** - Web search and documentation lookup
2. **GitHub** - Repository and code search
3. **Stack Overflow** - Android Q&A search
4. **All of the above** - Full setup
5. **None** - Skip MCP configuration

### Step 3: Install Selected Servers

For each selected server, provide installation instructions:

#### Context7 (Web Search)
```bash
# Install via npm
npm install -g @context7/mcp-server

# Add to settings.json
cat ~/.factory/settings.json | jq '.mcpServers.context7 = {
  "command": "npx",
  "args": ["@context7/mcp-server"],
  "env": {}
}' > ~/.factory/settings.json.tmp && mv ~/.factory/settings.json.tmp ~/.factory/settings.json
```

#### GitHub Integration
```bash
# Requires GitHub token
echo "GitHub MCP requires a personal access token."
echo "Create one at: https://github.com/settings/tokens"
echo "Needed scopes: repo, read:org"

# Ask user for token (securely)
read -sp "Enter GitHub token: " GITHUB_TOKEN
echo

# Add to settings.json
cat ~/.factory/settings.json | jq --arg token "$GITHUB_TOKEN" '.mcpServers.github = {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-github"],
  "env": {
    "GITHUB_TOKEN": $token
  }
}' > ~/.factory/settings.json.tmp && mv ~/.factory/settings.json.tmp ~/.factory/settings.json
```

### Step 4: Verify Configuration

```bash
echo "MCP servers configured:"
cat ~/.factory/settings.json | jq '.mcpServers | keys'

echo ""
echo "Restart Claude Code to activate MCP servers."
```

## Common MCP Servers for Android Development

| Server | Purpose | Installation |
|--------|---------|--------------|
| Context7 | Web search, docs | `npm install -g @context7/mcp-server` |
| GitHub | Repo/code search | Requires GitHub token |
| Stack Overflow | Q&A search | Community MCP server |
| Android Docs | SDK documentation | Custom server (if available) |

## Manual Configuration

You can also manually edit `~/.factory/settings.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {}
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Troubleshooting

If MCP servers aren't working:
1. Verify installation: `which npx`
2. Check settings.json syntax: `jq . ~/.factory/settings.json`
3. Restart Claude Code
4. Check Claude Code logs for MCP errors

## Security Notes

- Store tokens securely in environment variables
- Never commit tokens to version control
- Use minimal token scopes required
- Rotate tokens periodically

## Related Skills

- `/oh-my-droid:omd-setup` - Main setup wizard
- `/oh-my-droid:doctor` - Diagnose configuration issues
