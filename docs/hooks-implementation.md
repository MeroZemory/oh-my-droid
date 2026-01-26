# oh-my-droid Hook Scripts Implementation

This document describes the implemented hook scripts for the oh-my-droid plugin.

## Overview

All hook scripts are implemented as Node.js ESM modules (`.mjs`) for cross-platform compatibility (Windows, macOS, Linux). They follow the Factory.ai Droid hooks specification and integrate with the oh-my-droid ecosystem.

## Hook Scripts

### 1. skill-injector.mjs

**Hook Event:** `UserPromptSubmit`

**Purpose:** Automatically injects learned skills from local skills directories when keywords match.

**Features:**
- Scans global skills directory: `~/.factory/omd/skills/`
- Scans project skills directory: `.omd/skills/`
- Parses skill frontmatter for trigger keywords
- Matches user prompt against skill triggers
- Injects matching skills as additional context

**Skill File Format:**
```markdown
---
triggers: [keyword1, keyword2, keyword3]
---

# Skill Content

Your skill implementation here...
```

**Example Usage:**
When a user prompt contains trigger keywords, the relevant skills are automatically injected into the context.

### 2. pre-tool-enforcer.mjs

**Hook Event:** `PreToolUse` (matcher: `Edit|Write`)

**Purpose:** Enforces delegation rules by warning when source files are directly modified instead of delegated to executor droids.

**Features:**
- Detects Write/Edit operations on source files (.ts, .py, .go, etc.)
- Excludes system/config paths (.omd/, .factory/, CLAUDE.md, etc.)
- Counts incomplete todos to suggest boulder mode
- Provides soft warnings with delegation recommendations

**Warning Triggers:**
- Editing TypeScript/JavaScript files
- Editing Python/Go/Rust files
- Editing other source code files

**Allowed Paths (no warning):**
- `.omd/` - oh-my-droid configuration
- `.factory/` - Factory configuration
- `.claude/` - Claude configuration
- `CLAUDE.md`, `AGENTS.md`, `README.md` - Documentation

### 3. post-tool-verifier.mjs

**Hook Event:** `PostToolUse` (matcher: `*`)

**Purpose:** Verifies tool execution results, detects errors, and extracts wisdom.

**Features:**
- **Edit Error Detection:** Detects common Edit tool failures and provides recovery guidance
- **Remember Tag Processing:** Extracts `<remember>` and `<remember priority>` tags from outputs
- **Session Statistics:** Tracks tool usage and error counts
- **Notepad Integration:** Saves remembered items to project notepad

**Error Patterns Detected:**
- "could not be found"
- "not found in the file"
- "does not match"
- "failed to find"
- "unable to locate"

**Statistics Tracked:**
- Tool usage counts per session
- Error counts
- Session duration
- Last updated timestamp

### 4. pre-compact.mjs

**Hook Event:** `PreCompact` (matcher: `auto|manual`)

**Purpose:** Preserves wisdom and important context before conversation compaction.

**Features:**
- **Wisdom Extraction:** Parses transcript for learnings, decisions, and issues
- **Pattern Detection:**
  - Learnings: "learned", "discovered", "found that"
  - Decisions: "decided to", "chose to", "will use"
  - Issues: "issue:", "problem:", "blocker:"
- **Notepad Storage:** Saves extracted wisdom to `.omd/notepad.md`
- **Session History:** Archives session statistics to history

**Notepad Sections:**
- `## Priority Context` - High-priority persistent context
- `## Recent Learnings` - Technical discoveries
- `## Decisions` - Architectural choices
- `## Issues` - Known problems and blockers

### 5. session-end.mjs

**Hook Event:** `SessionEnd`

**Purpose:** Cleanup and statistics collection at session end.

**Features:**
- **Final Statistics:** Saves session summary with duration and tool usage
- **Temporary Cleanup:** Removes ended state files (ultrawork, autopilot, ralph, eco)
- **Summary Display:** Shows session statistics to user (duration, top tools, errors)

**Files Managed:**
- `.omd/session-stats.json` → `.omd/session-summary.json`
- Cleanup: `*-state.json` files for ended modes

**Summary Output:**
```
=== Session Summary ===

Duration: 45 minutes

Top Tools Used:
  - Edit: 23
  - Read: 18
  - Bash: 12

Errors encountered: 2

=======================
```

### 6. error-recovery.mjs

**Hook Event:** `PostToolUse` (on error)

**Purpose:** Detects errors and provides contextual recovery guidance.

**Error Types Detected:**

1. **Context Limit Error**
   - Pattern: "context window", "limit exceeded"
   - Recovery: Suggests /compact, <remember> tags, new session

2. **Edit Error**
   - Pattern: "edit failed", "not found"
   - Recovery: Re-read file, check whitespace, remove line numbers

3. **Permission Error**
   - Pattern: "permission denied"
   - Recovery: Check permissions, file locks, sudo usage

4. **Module Error**
   - Pattern: "module not found"
   - Recovery: Install dependencies, check paths, clear caches

5. **Syntax Error**
   - Pattern: "syntax error", "unexpected token"
   - Recovery: Use linter, check brackets/quotes, verify syntax

**Error Logging:**
- Errors logged to `.omd/error-log.jsonl` for analysis
- Includes timestamp, type, error text, and recovery message

### 7. session-idle.mjs

**Hook Event:** `Notification` (idle state)

**Purpose:** Provides reminders about pending tasks and active persistent modes during idle periods.

**Features:**
- **Persistent Mode Detection:**
  - boulder (task persistence)
  - ultrawork (parallel execution)
  - autopilot (autonomous mode)
  - ralph (verification loop)
- **Todo Counting:** Shows incomplete tasks from project and global todos
- **Smart Reminders:** Only displays when there's work to continue

**Reminder Types:**

1. **Active Persistent Modes:**
```
[ACTIVE PERSISTENT MODES]

You have active persistent modes that should continue:

- BOULDER: Implement authentication system
- RALPH: Fix validation bugs
  Progress: 3/100

Continue working until all tasks are complete.
```

2. **Pending Tasks:**
```
[PENDING TASKS: 5]

You have incomplete tasks:

- Implement login endpoint
- Add error handling
- Write unit tests

... and 2 more

Please continue working on these tasks.
```

## Integration with hooks.json

All scripts are registered in `hooks/hooks.json`:

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/skill-injector.mjs"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/pre-tool-enforcer.mjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/post-tool-verifier.mjs"
          },
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/error-recovery.mjs"
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/pre-compact.mjs"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/session-end.mjs"
          }
        ]
      }
    ],
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${DROID_PLUGIN_ROOT}/scripts/session-idle.mjs"
          }
        ]
      }
    ]
  }
}
```

## Directory Structure

```
.omd/
├── notepad.md              # Wisdom and learnings
├── session-stats.json      # Current session statistics
├── session-summary.json    # Final session summary
├── session-history.json    # Historical session data
├── error-log.jsonl         # Error log entries
├── todos.json              # Project todos
├── skills/                 # Project-specific skills
│   └── *.md
├── boulder-state.json      # Boulder mode state
├── ultrawork-state.json    # Ultrawork mode state
├── autopilot-state.json    # Autopilot mode state
└── ralph-state.json        # Ralph mode state

~/.factory/
├── omd/
│   └── skills/             # Global skills
│       └── *.md
└── todos/                  # Global todos
    └── *.json
```

## Testing

All scripts can be tested independently:

```bash
# Test skill-injector
echo '{"prompt":"test prompt","cwd":"/path/to/project"}' | \
  ./scripts/skill-injector.mjs

# Test pre-tool-enforcer
echo '{"tool_name":"Edit","tool_input":{"file_path":"src/file.ts"},"cwd":"/path"}' | \
  ./scripts/pre-tool-enforcer.mjs

# Test post-tool-verifier
echo '{"tool_name":"Edit","tool_response":{"success":true},"cwd":"/path"}' | \
  ./scripts/post-tool-verifier.mjs

# Test error-recovery
echo '{"tool_response":{"error":"context window exceeded"},"cwd":"/path"}' | \
  ./scripts/error-recovery.mjs

# Test pre-compact
echo '{"transcript_path":"/path/to/transcript.jsonl","cwd":"/path"}' | \
  ./scripts/pre-compact.mjs

# Test session-end
echo '{"reason":"exit","cwd":"/path"}' | \
  ./scripts/session-end.mjs

# Test session-idle
echo '{"cwd":"/path"}' | \
  ./scripts/session-idle.mjs
```

## Hook Input/Output Format

### Input (via stdin)
```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Edit",
  "tool_input": {},
  "tool_response": {}
}
```

### Output (to stdout)
```json
{
  "continue": true,
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "<recovery-message>"
  }
}
```

## Error Handling

All scripts follow a fail-safe pattern:
- Wrapped in try-catch blocks
- Always return `{"continue": true}` on error
- Silent failures for non-critical operations
- Graceful degradation when files/directories don't exist

## Performance Considerations

- Scripts are lightweight and fast (< 100ms execution)
- File I/O is minimized and cached where possible
- JSON parsing errors are handled gracefully
- No blocking operations or network calls

## Future Enhancements

Potential improvements for future versions:

1. **Machine Learning Integration:**
   - Learn from error patterns
   - Suggest better delegation strategies
   - Predict common mistakes

2. **Advanced Analytics:**
   - Tool usage trends over time
   - Error rate analysis
   - Performance bottleneck detection

3. **Skill Marketplace:**
   - Share learned skills between projects
   - Community skill repository
   - Automatic skill discovery

4. **Smart Context Management:**
   - Predictive compaction
   - Priority-based context retention
   - Automatic wisdom extraction

5. **Integration with External Tools:**
   - Git hooks integration
   - CI/CD pipeline hooks
   - Issue tracker synchronization

## References

- [Droid Hooks Reference](./droid/hooks-reference.md)
- [oh-my-claudecode Implementation](../oh-my-claudecode/src/hooks/)
- [Factory.ai Documentation](https://docs.factory.ai/)
