---
description: Project Session Manager - isolated dev environments with git worktrees and tmux
aliases: [psm, worktree, session]
---

# Project Session Manager (PSM)

[PSM ACTIVATED - SESSION MANAGEMENT MODE]

You are managing isolated development environments using git worktrees and tmux sessions.

## User's Command

{{ARGUMENTS}}

## Parse Command

First, parse the command to determine what action to take:

| Pattern | Action |
|---------|--------|
| `review <ref>` | Create PR review session |
| `fix <ref>` | Create issue fix session |
| `feature <proj> <name>` | Create feature session |
| `list [project]` | List sessions |
| `attach <session>` | Attach to session |
| `kill <session>` | Kill session |
| `cleanup` | Clean merged/closed |
| `status` | Show current session |

Reference formats:
- `omc#123` - alias + number
- `owner/repo#123` - full repo + number
- `https://github.com/.../pull/123` - full URL
- `#123` - number only (use current repo)

## Execution Protocol

### Step 1: Initialize PSM

```bash
# Create directories
mkdir -p ~/.psm/worktrees ~/.psm/logs

# Initialize projects.json if missing
if [[ ! -f ~/.psm/projects.json ]]; then
  cat > ~/.psm/projects.json << 'EOF'
{
  "aliases": {
    "omc": {
      "repo": "Yeachan-Heo/oh-my-droid",
      "local": "~/Workspace/oh-my-droid",
      "default_base": "main"
    }
  },
  "defaults": {
    "worktree_root": "~/.psm/worktrees",
    "cleanup_after_days": 14
  }
}
EOF
fi

# Initialize sessions.json if missing
if [[ ! -f ~/.psm/sessions.json ]]; then
  echo '{"version":1,"sessions":{}}' > ~/.psm/sessions.json
fi
```

### Step 2: Execute Subcommand

Based on parsed command, execute the appropriate workflow.

#### For `review <ref>`:

1. Parse reference to get: project alias, repo, PR number
2. Fetch PR info: `gh pr view <num> --repo <repo> --json number,title,headRefName,baseRefName,url`
3. Get local repo path from projects.json or clone if needed
4. Create worktree from PR branch:
   ```bash
   cd <local_repo>
   git fetch origin pull/<num>/head:pr-<num>-review
   git worktree add ~/.psm/worktrees/<alias>/pr-<num> pr-<num>-review
   ```
5. Create tmux session: `tmux new-session -d -s psm:<alias>:pr-<num> -c <worktree_path>`
6. Launch claude in tmux: `tmux send-keys -t psm:<alias>:pr-<num> "claude" Enter`
7. Update ~/.psm/sessions.json
8. Report session details

#### For `fix <ref>`:

1. Parse reference to get: project alias, repo, issue number
2. Fetch issue info: `gh issue view <num> --repo <repo> --json number,title,body,labels`
3. Create fix branch from main:
   ```bash
   cd <local_repo>
   git fetch origin main
   git branch fix/<num>-<slug> origin/main
   git worktree add ~/.psm/worktrees/<alias>/issue-<num> fix/<num>-<slug>
   ```
4. Create tmux session and launch claude
5. Update sessions.json
6. Report session details

#### For `feature <project> <name>`:

1. Resolve project alias
2. Create feature branch:
   ```bash
   cd <local_repo>
   git fetch origin main
   git branch feature/<name> origin/main
   git worktree add ~/.psm/worktrees/<alias>/feat-<name> feature/<name>
   ```
3. Create tmux session and launch claude
4. Update sessions.json
5. Report session details

#### For `list [project]`:

1. Read ~/.psm/sessions.json
2. Check tmux for live sessions: `tmux list-sessions -F "#{session_name}" | grep "^psm:"`
3. List worktrees: `ls ~/.psm/worktrees/*/`
4. Format and display table

#### For `attach <session>`:

1. Build tmux session name: `psm:<session>`
2. Verify exists: `tmux has-session -t <name>`
3. Tell user: `tmux attach -t <name>`

#### For `kill <session>`:

1. Kill tmux: `tmux kill-session -t psm:<session>`
2. Get worktree path from sessions.json
3. Remove worktree: `git worktree remove <path> --force`
4. Remove from sessions.json

#### For `cleanup`:

1. For each session in sessions.json:
   - If type=review: check `gh pr view --json merged` - if merged, clean up
   - If type=fix: check `gh issue view --json closed` - if closed, clean up
2. Kill tmux and remove worktrees for completed items
3. Update sessions.json
4. Report what was cleaned

#### For `status`:

1. Check current tmux session name or detect from cwd
2. Read .psm-session.json from worktree
3. Display session info

### Step 3: Report Results

After executing, provide clear output:

```
Session Ready!

  ID:       omc:pr-123
  Type:     review
  PR:       #123 - Add webhook support
  Worktree: ~/.psm/worktrees/omc/pr-123
  Tmux:     psm:omc:pr-123

Commands:
  Attach:  tmux attach -t psm:omc:pr-123
  Kill:    /psm kill omc:pr-123
  Cleanup: /psm cleanup
```

## Important Notes

- Always use `gh` CLI for GitHub operations (respects user auth)
- Expand `~` to `$HOME` in paths
- Create parent directories before operations
- Handle errors gracefully with clear messages
- The tmux session launches but user stays in current terminal
- Tell user how to attach to the new session
