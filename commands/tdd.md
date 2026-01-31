---
description: Start Test-Driven Development workflow
---

# TDD Workflow

[TDD MODE ACTIVATED]

## Objective

Implement features using Test-Driven Development methodology: write tests first, then implement to make them pass.

## TDD Cycle

1. **RED** - Write a failing test
2. **GREEN** - Write minimal code to pass the test
3. **REFACTOR** - Improve code while keeping tests green
4. **REPEAT** - Continue until feature is complete

## Test Types Written

- **Unit Tests** - Individual functions in isolation
- **Integration Tests** - API endpoints, database operations
- **E2E Tests** - Critical user flows (for important features)

## Coverage Target

- Minimum 80% code coverage
- All public functions tested
- Edge cases covered (null, empty, invalid inputs)
- Error paths tested (not just happy path)

## Invocation

This command delegates to the `tdd-guide` agent (Sonnet model) which will:
1. Understand the feature requirements
2. Write failing tests first
3. Implement code to pass tests
4. Verify 80%+ coverage
5. Document test coverage

## When to Use

- Starting a new feature
- Fixing a bug (write test that reproduces bug first)
- Refactoring existing code (ensure tests exist first)

## Output

Tests and implementation with:
- Test file(s) created
- Implementation code
- Coverage report showing 80%+
- All tests passing
