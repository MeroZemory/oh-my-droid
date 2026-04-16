---
name: tdd
description: "Enforce strict Test-Driven Development (TDD) using the red-green-refactor cycle. Use when writing unit tests, practicing test-first development, applying TDD discipline, or implementing features via red-green-refactor workflows."
---

# TDD Mode

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**

Write code before test? DELETE IT. Start over. No exceptions.

## Red-Green-Refactor Cycle

### 1. RED: Write Failing Test
- Write test for the NEXT piece of functionality
- Run test - MUST FAIL
- If it passes, your test is wrong

### 2. GREEN: Minimal Implementation
- Write ONLY enough code to pass the test
- No extras. No "while I'm here."
- Run test - MUST PASS

### 3. REFACTOR: Clean Up
- Improve code quality
- Run tests after EVERY change
- Must stay green

### 4. REPEAT
- Next failing test
- Continue cycle

## Enforcement Rules

| If You See | Action |
|------------|--------|
| Code written before test | STOP. Delete code. Write test first. |
| Test passes on first run | Test is wrong. Fix it to fail first. |
| Multiple features in one cycle | STOP. One test, one feature. |
| Skipping refactor | Go back. Clean up before next feature. |

## Commands

Before each implementation:
```bash
npx jest --watchAll  # Should have ONE new failure
# or: npx vitest run, pytest, go test ./...
```

After implementation:
```bash
npx jest --watchAll  # New test should pass, all others still pass
```

## Worked Example: Adding a `capitalize` Function

### RED Phase — Write the Failing Test

```js
// src/strings.test.js
const { capitalize } = require('./strings');

describe('capitalize', () => {
  it('should uppercase the first letter and lowercase the rest', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should handle single character strings', () => {
    expect(capitalize('h')).toBe('H');
  });

  it('should return empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });
});
```

Run tests — they fail because `strings.js` does not export `capitalize`:
```
FAIL  src/strings.test.js
  ● capitalize › should uppercase the first letter and lowercase the rest
    TypeError: capitalize is not a function
```

### GREEN Phase — Minimal Implementation

```js
// src/strings.js
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = { capitalize };
```

Run tests — all three pass:
```
PASS  src/strings.test.js
  capitalize
    ✓ should uppercase the first letter and lowercase the rest
    ✓ should handle single character strings
    ✓ should return empty string for empty input
```

### REFACTOR Phase — Clean Up

Extract a guard clause for clarity, ensure tests still pass:

```js
function capitalize(str) {
  if (str.length === 0) return '';
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
```

Tests still green. Move to the next failing test.

## Output Format

When guiding TDD:

```
## TDD Cycle: [Feature Name]

### RED Phase
Test: [test code]
Expected failure: [what error you expect]
Actual: [run result showing failure]

### GREEN Phase
Implementation: [minimal code]
Result: [run result showing pass]

### REFACTOR Phase
Changes: [what was cleaned up]
Result: [tests still pass]
```

**Remember:** The discipline IS the value. Shortcuts destroy the benefit.
