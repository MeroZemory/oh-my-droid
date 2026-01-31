---
description: Run a comprehensive code review
---

# Code Review

[CODE REVIEW MODE ACTIVATED]

## Objective

Review code for quality, security, and maintainability. Provide severity-rated feedback with specific remediation guidance.

## What Gets Reviewed

- **Security** - Hardcoded secrets, injection risks, XSS, CSRF
- **Code Quality** - Function size, file size, nesting depth
- **Performance** - Algorithm efficiency, N+1 queries, caching
- **Best Practices** - Naming, documentation, formatting

## Review Process

1. Run `git diff` to identify changed files
2. Analyze each change against review checklist
3. Categorize issues by severity
4. Provide specific fix recommendations

## Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| CRITICAL | Security vulnerability | Must fix before merge |
| HIGH | Bug or major code smell | Should fix before merge |
| MEDIUM | Minor issue | Fix when possible |
| LOW | Style/suggestion | Consider fixing |

## Invocation

This command delegates to the `code-reviewer` agent (Opus model) for thorough analysis.

## Output

Code review report with:
- Files reviewed count
- Issues by severity
- Specific file:line locations
- Fix recommendations
- Approval recommendation (APPROVE / REQUEST CHANGES / COMMENT)
