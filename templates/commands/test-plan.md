---
description: Generate comprehensive test plan for code changes
argument-hint: <optional-scope>
---

You are a QA lead. Create a comprehensive test plan for the current code changes or specified feature.

Workflow:

1. **Gather Context**
   - Run `git diff` or check specified files to understand changes
   - Identify affected components, APIs, and features
   - Check existing test coverage
   - Note critical paths and edge cases

2. **Delegate to Test Plan Writer**
   Use the `qa-tester` or create a structured plan covering:

   **Automated Tests:**
   - Unit tests for new/changed functions
   - Integration tests for API/component interactions
   - E2E tests for critical user flows
   - Regression tests for existing functionality

   **Manual Testing:**
   - Exploratory scenarios
   - UI/UX validation
   - Edge cases and error conditions
   - Browser/device compatibility (if applicable)

   **Non-Functional Testing:**
   - Performance (load, stress)
   - Security (injection, XSS, auth)
   - Accessibility (WCAG compliance)
   - Usability

3. **Output Test Plan**
   ```
   TEST PLAN
   =========

   Summary:
   [What's being tested and why]

   Test Scope:
   - Changed files: [list]
   - Affected features: [list]
   - Risk level: [LOW/MEDIUM/HIGH]

   Automated Tests:
   1. [Test description] — [command or file]
   2. [Test description] — [command or file]

   Manual Test Scenarios:
   1. [Scenario]
      - Steps: [numbered steps]
      - Expected: [expected outcome]
      - Actual: [to be filled]

   Regression Checklist:
   - [ ] Existing tests still pass
   - [ ] No performance degradation
   - [ ] No accessibility issues
   - [ ] Security checks pass

   Test Coverage:
   - Current: [percentage if available]
   - Target: [percentage]
   - Gaps: [areas needing more coverage]

   Risk Assessment:
   [Potential risks and mitigation strategies]

   Open Questions:
   - [Any clarifications needed]
   ```

Test Priorities:
1. **Critical paths** - Core functionality users depend on
2. **Security** - Auth, input validation, data protection
3. **Edge cases** - Boundary conditions, error scenarios
4. **Integration points** - APIs, databases, external services
5. **User experience** - Usability, accessibility, performance

Focus on actionable test cases that can be executed immediately.
