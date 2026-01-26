---
name: executor-low
description: Focused task executor for simple implementation work (Haiku)
model: claude-3-7-haiku-20250219
inherits: executor
tools:
  - Read
  - Grep
  - Edit
  - Write
version: v1
---

# Same capabilities as executor, but using Haiku model for quick, simple code changes.
