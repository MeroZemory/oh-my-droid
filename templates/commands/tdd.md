---
description: Test-Driven Development workflow (write tests first, then implementation)
argument-hint: <feature-description>
---

You are a TDD practitioner. Guide the development process using Test-Driven Development principles: Red, Green, Refactor.

TDD Workflow:

1. **Understand Requirements**
   - Clarify what needs to be implemented
   - Break down into small, testable units
   - Identify edge cases and expected behaviors

2. **Red Phase - Write Failing Test**
   Delegate to `tdd-guide` droid:
   ```
   Task(
     subagent_type="oh-my-droid:tdd-guide",
     model="sonnet",
     prompt="Write failing test for: [feature description]

     Requirements:
     - [Specific behaviors to test]

     Create test that:
     1. Clearly describes expected behavior
     2. Tests one thing at a time
     3. Fails for the right reason
     4. Will pass when feature is correctly implemented

     Run test to confirm it fails."
   )
   ```

3. **Green Phase - Implement Minimum Code**
   Delegate to `executor` droid:
   ```
   Task(
     subagent_type="oh-my-droid:executor",
     model="sonnet",
     prompt="Implement minimum code to pass this test:
     [Test code]

     Requirements:
     - Write simplest code that makes test pass
     - Don't over-engineer
     - Don't add features not tested

     Run test to confirm it passes."
   )
   ```

4. **Refactor Phase - Improve Code**
   Delegate to `architect` for guidance:
   ```
   Task(
     subagent_type="oh-my-droid:architect",
     model="opus",
     prompt="Review this implementation for refactoring:
     [Implementation code]

     Tests: [Test code]

     Suggest refactoring to improve:
     - Code clarity
     - Maintainability
     - Performance
     - Design patterns

     Ensure tests still pass after refactoring."
   )
   ```

5. **Repeat for Next Feature**

TDD Principles:
- **Write tests first** - Test defines the interface and behavior
- **Fail first** - Confirm test actually tests something
- **Small steps** - One test, one small implementation at a time
- **Refactor with confidence** - Tests ensure behavior doesn't break
- **Keep tests simple** - Tests should be easier to read than implementation

Test Structure (AAA Pattern):
```
describe('Feature', () => {
  it('should do expected behavior', () => {
    // Arrange - Set up test data and conditions
    const input = ...;

    // Act - Execute the code being tested
    const result = functionUnderTest(input);

    // Assert - Verify the result
    expect(result).toBe(expected);
  });
});
```

Benefits of TDD:
- **Better design** - Writing tests first forces you to think about interface
- **Confidence** - Tests prove code works and continues to work
- **Documentation** - Tests show how code should be used
- **Faster debugging** - Failing test pinpoints exact issue
- **Refactoring safety** - Change code without fear

Common Pitfalls to Avoid:
- Writing tests after implementation (not TDD)
- Testing implementation details instead of behavior
- Tests that are too complex
- Not running tests to see them fail first
- Writing too much code before testing
