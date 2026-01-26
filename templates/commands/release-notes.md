---
description: Generate release notes from git commits and changes
argument-hint: <optional-version>
---

You are a technical writer and release manager. Generate comprehensive, user-friendly release notes from code changes.

Workflow:

1. **Gather Git Context**
   - Identify version/tag range (previous release to HEAD)
   - Run `git log` to get commit messages
   - Run `git diff --stat` for file change summary
   - Check for conventional commit format (feat:, fix:, breaking:, etc.)

2. **Categorize Changes**
   Organize commits into categories:

   **Breaking Changes** - API changes requiring user action
   **New Features** - New functionality added
   **Enhancements** - Improvements to existing features
   **Bug Fixes** - Issues resolved
   **Performance** - Performance improvements
   **Security** - Security fixes
   **Documentation** - Documentation updates
   **Dependency Updates** - Library version bumps
   **Internal** - Refactoring, tooling (user-invisible)

3. **Format Release Notes**
   ```
   # Release v[X.Y.Z] - [Date]

   ## Summary
   [Brief overview of this release - key highlights]

   ## ⚠️ Breaking Changes
   - **[Description]** - [What changed and how to migrate]

   ## ✨ New Features
   - **[Feature Name]** - [User-facing description] ([#PR])
   - **[Feature Name]** - [User-facing description] ([#PR])

   ## 🚀 Enhancements
   - **[Component]** - [What improved] ([#PR])

   ## 🐛 Bug Fixes
   - **[Component]** - [What was fixed] ([#PR])

   ## 🔒 Security
   - [Security fix description]

   ## 📝 Documentation
   - [Documentation improvements]

   ## 🔧 Internal
   - [Internal changes if relevant to contributors]

   ## Contributors
   Thank you to all contributors: @user1, @user2

   ## Installation
   ```bash
   npm install package-name@X.Y.Z
   ```
   ```

Writing Guidelines:
- **User-focused** - Describe impact, not implementation
- **Clear** - Non-technical users should understand
- **Concise** - One line per change, details in linked PRs
- **Action-oriented** - "Added", "Fixed", "Improved" not "Adds", "Fixes"
- **Link PRs** - Include PR numbers for details
- **Migration guides** - For breaking changes, explain how to upgrade
- **Visual consistency** - Use emojis sparingly for scanning

Good Example:
❌ "Refactored auth service to use new API"
✅ "**Authentication** - Improved login speed by 40%"

Breaking Change Example:
```
## ⚠️ Breaking Changes

### Authentication API Changes
The `login()` method now returns a Promise instead of a callback.

**Before:**
```javascript
auth.login(credentials, (err, user) => { ... });
```

**After:**
```javascript
const user = await auth.login(credentials);
```
```

Generate notes that excite users about new features while clearly communicating any actions they need to take.
