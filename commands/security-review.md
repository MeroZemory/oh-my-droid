---
description: Run a comprehensive security review on code
---

# Security Review

[SECURITY REVIEW MODE ACTIVATED]

## Objective

Conduct a thorough security review of the specified code, checking for OWASP Top 10 vulnerabilities, hardcoded secrets, and unsafe patterns.

## What Gets Reviewed

- **Authentication/Authorization** - Verify proper access controls
- **Input Validation** - Check all user inputs are sanitized
- **Secrets Management** - Find hardcoded API keys, passwords, tokens
- **Injection Prevention** - SQL, NoSQL, command injection risks
- **XSS Prevention** - Cross-site scripting vulnerabilities
- **Dependency Security** - Vulnerable npm packages

## When to Use

- After writing code that handles user input
- After adding new API endpoints
- After modifying authentication logic
- Before deploying to production
- After adding external dependencies

## Invocation

This command delegates to the `security-reviewer` agent (Opus model) for deep security analysis.

The agent will:
1. Scan the codebase for security issues
2. Check OWASP Top 10 categories
3. Run `npm audit` for dependency vulnerabilities
4. Search for hardcoded secrets
5. Produce a severity-rated security report

## Output

A security review report with:
- Summary of findings by severity (Critical, High, Medium, Low)
- Specific file locations and line numbers
- Remediation guidance for each issue
- Security checklist verification
