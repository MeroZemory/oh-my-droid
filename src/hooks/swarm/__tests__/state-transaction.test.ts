import { describe, it, expect } from 'vitest';
import { runImmediateTransaction, normalizeProjectCwd } from '../state.js';
import { isBusyError } from '../claiming.js';

/**
 * Fake executor that records the SQL it is handed and can be told to fail a
 * specific statement, so transaction handling is testable without a database.
 */
function createExecutor(failures: Record<string, Error>) {
  const statements: string[] = [];
  return {
    statements,
    exec(sql: string): void {
      statements.push(sql);
      const failure = failures[sql];
      if (failure) {
        throw failure;
      }
    },
  };
}

describe('runImmediateTransaction', () => {
  it('commits and returns the callback result', () => {
    const executor = createExecutor({});
    let poisoned = false;

    const result = runImmediateTransaction(executor, () => 'value', () => { poisoned = true; });

    expect(result).toBe('value');
    expect(executor.statements).toEqual(['BEGIN IMMEDIATE', 'COMMIT']);
    expect(poisoned).toBe(false);
  });

  it('rolls back and rethrows when the callback throws', () => {
    const executor = createExecutor({});
    let poisoned = false;
    const boom = new Error('callback failed');

    expect(() =>
      runImmediateTransaction(executor, () => { throw boom; }, () => { poisoned = true; })
    ).toThrow(boom);

    expect(executor.statements).toEqual(['BEGIN IMMEDIATE', 'ROLLBACK']);
    expect(poisoned).toBe(false);
  });

  it('does not poison the handle when a failed COMMIT already rolled itself back', () => {
    // SQLite auto-rolls back on most COMMIT failures, so the follow-up ROLLBACK
    // reports that no transaction is active. That is the expected path.
    const commitError = new Error('database is locked');
    const executor = createExecutor({
      COMMIT: commitError,
      ROLLBACK: new Error('cannot rollback - no transaction is active'),
    });
    let poisoned = false;

    expect(() =>
      runImmediateTransaction(executor, () => 'value', () => { poisoned = true; })
    ).toThrow(commitError);

    expect(poisoned).toBe(false);
    expect(executor.statements).toEqual(['BEGIN IMMEDIATE', 'COMMIT', 'ROLLBACK']);
  });

  it('poisons the handle when rollback fails for an unexpected reason', () => {
    const commitError = new Error('database is locked');
    const executor = createExecutor({
      COMMIT: commitError,
      ROLLBACK: new Error('disk I/O error'),
    });
    let poisoned = false;

    expect(() =>
      runImmediateTransaction(executor, () => 'value', () => { poisoned = true; })
    ).toThrow(AggregateError);

    expect(poisoned).toBe(true);
  });

  it('rejects nested transactions', () => {
    const executor = createExecutor({});

    expect(() =>
      runImmediateTransaction(
        executor,
        () => runImmediateTransaction(executor, () => 'inner', () => {}),
        () => {}
      )
    ).toThrow(/Nested transactions/);
  });

  it('releases the transaction guard after a failure so later calls still work', () => {
    const failing = createExecutor({});
    expect(() =>
      runImmediateTransaction(failing, () => { throw new Error('boom'); }, () => {})
    ).toThrow();

    const executor = createExecutor({});
    expect(runImmediateTransaction(executor, () => 'ok', () => {})).toBe('ok');
  });
});

describe('isBusyError', () => {
  it('classifies the primary SQLITE_BUSY code as retryable', () => {
    expect(isBusyError({ errcode: 5 })).toBe(true);
  });

  it('classifies extended busy codes as retryable', () => {
    // SQLITE_BUSY_RECOVERY = 261, SQLITE_BUSY_SNAPSHOT = 517, SQLITE_BUSY_TIMEOUT = 773.
    // Extended codes keep the primary code in the low byte.
    expect(isBusyError({ errcode: 261 })).toBe(true);
    expect(isBusyError({ errcode: 517 })).toBe(true);
    expect(isBusyError({ errcode: 773 })).toBe(true);
  });

  it('does not classify unrelated errors as retryable', () => {
    expect(isBusyError({ errcode: 6 })).toBe(false); // SQLITE_LOCKED
    expect(isBusyError({ errcode: 1 })).toBe(false); // SQLITE_ERROR
    expect(isBusyError({ errcode: 'five' })).toBe(false);
    expect(isBusyError(new Error('database is locked'))).toBe(false);
    expect(isBusyError(null)).toBe(false);
    expect(isBusyError(undefined)).toBe(false);
  });
});

describe('normalizeProjectCwd', () => {
  it('produces a stable identity for the same directory', () => {
    expect(normalizeProjectCwd(process.cwd())).toBe(normalizeProjectCwd(process.cwd()));
  });

  it.runIf(process.platform === 'win32')('case-folds the Windows drive letter', () => {
    expect(normalizeProjectCwd('c:\\proj\\app')).toBe(normalizeProjectCwd('C:\\proj\\app'));
    expect(normalizeProjectCwd('c:\\proj\\app').startsWith('C:')).toBe(true);
  });

  it.runIf(process.platform !== 'win32')('leaves POSIX paths case-sensitive', () => {
    expect(normalizeProjectCwd('/tmp/Proj')).not.toBe(normalizeProjectCwd('/tmp/proj'));
  });
});
