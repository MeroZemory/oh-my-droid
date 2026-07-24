import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { executeSlashCommand } from '../hooks/auto-slash-command/executor.js';
import { parseSlashCommand } from '../hooks/auto-slash-command/detector.js';

/**
 * Tests for literal $ARGUMENTS substitution through the exported
 * executeSlashCommand surface. Verifies that JavaScript replacement
 * tokens ($&, $$, $`, $') are preserved literally, not interpreted.
 */
describe('slash command argument substitution', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `cmd-args-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(join(testDir, '.factory', 'commands'), { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  function createCommand(name: string, content: string): void {
    writeFileSync(join(testDir, '.factory', 'commands', `${name}.md`), content);
  }

  function execute(command: string, args: string): string {
    const result = executeSlashCommand({ command, args, raw: `/${command} ${args}` });
    expect(result.success).toBe(true);
    return result.replacementText ?? '';
  }

  function executeInput(input: string): string {
    const parsed = parseSlashCommand(input);
    expect(parsed).not.toBeNull();
    const result = executeSlashCommand(parsed!);
    expect(result.success).toBe(true);
    return result.replacementText ?? '';
  }

  it('should preserve JavaScript replacement tokens literally', () => {
    createCommand('test-args-tokens', '__BEGIN__\n$ARGUMENTS\n__END__');
    const special = "$& $$ $` $' line1\nline2";
    const output = execute('test-args-tokens', special);
    expect(output).toContain(`__BEGIN__\n${special}\n__END__`);
  });

  it('should pass complete arguments to every placeholder', () => {
    createCommand('test-args-multi', 'First: $ARGUMENTS\nSecond: $ARGUMENTS');
    const output = execute('test-args-multi', 'hello world');
    expect(output).toContain('First: hello world');
    expect(output).toContain('Second: hello world');
  });

  it('should preserve multiline arguments with line breaks', () => {
    createCommand('test-args-ml', '__BEGIN__\n$ARGUMENTS\n__END__');
    const multiline = 'line one\nline two\nline three';
    const output = executeInput(`/test-args-ml ${multiline}`);
    expect(output).toContain(`__BEGIN__\n${multiline}\n__END__`);
  });

  it('should show (no arguments provided) for empty args', () => {
    createCommand('test-args-empty', 'Args: $ARGUMENTS');
    const output = execute('test-args-empty', '');
    expect(output).toContain('(no arguments provided)');
  });

  it('should append User Request section when no placeholder exists', () => {
    createCommand('test-args-noplace', 'Just content, no placeholder.');
    const output = execute('test-args-noplace', 'do something');
    expect(output).toContain('## User Request');
    expect(output).toContain('do something');
  });
});
