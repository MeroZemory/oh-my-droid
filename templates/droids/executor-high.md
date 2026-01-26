---
name: executor-high
description: Focused task executor for complex implementation work (Opus)
model: claude-opus-4-5-20251101
inherits: executor
tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Bash
version: v1
---

# Same capabilities as executor, but using Opus model for complex refactoring and sophisticated implementation work.
