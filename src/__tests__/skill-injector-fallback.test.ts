import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, copyFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

/**
 * Integration tests for the skill-injector.mjs fallback path.
 *
 * The script is copied to a temp directory without dist/hooks/skill-bridge.cjs
 * so the inline fallback implementation is exercised. Project-level skills are
 * placed under the temp directory's .agents/skills/droid-learned tree.
 */
describe('skill-injector fallback (no bridge bundle)', () => {
  let testDir: string;
  let scriptPath: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `skill-injector-fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(testDir, { recursive: true });
    scriptPath = join(testDir, 'skill-injector.mjs');
    copyFileSync(
      join(process.cwd(), 'scripts', 'skill-injector.mjs'),
      scriptPath
    );
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function runInjector(prompt: string, sessionId: string): { stdout: string; status: number | null } {
    const input = JSON.stringify({ prompt, sessionId, cwd: testDir });
    const result = spawnSync('node', [scriptPath], {
      input,
      encoding: 'utf-8',
      timeout: 15000,
    });
    return { stdout: result.stdout, status: result.status };
  }

  it('should discover nested SKILL.md files recursively', () => {
    const skillsDir = join(testDir, '.agents', 'skills', 'droid-learned');
    mkdirSync(join(skillsDir, 'alpha'), { recursive: true });
    mkdirSync(join(skillsDir, 'beta'), { recursive: true });

    writeFileSync(
      join(skillsDir, 'alpha', 'SKILL.md'),
      '---\nname: Alpha Skill\ntriggers:\n  - "alpha-unique-trigger"\n---\n# Alpha Skill\n'
    );
    writeFileSync(
      join(skillsDir, 'beta', 'SKILL.md'),
      '---\nname: Beta Skill\ntriggers:\n  - "beta-unique-trigger"\n---\n# Beta Skill\n'
    );

    const { stdout, status } = runInjector('alpha-unique-trigger beta-unique-trigger', 's1');
    expect(status).toBe(0);

    const output = JSON.parse(stdout);
    const context = output.hookSpecificOutput?.additionalContext || '';
    expect(context).toContain('Alpha Skill');
    expect(context).toContain('Beta Skill');
  });

  it('should dedupe canonical and legacy copies with the same relative path', () => {
    const canonicalDir = join(testDir, '.agents', 'skills', 'droid-learned');
    const legacyDir = join(testDir, '.omd', 'skills');
    mkdirSync(join(canonicalDir, 'shared'), { recursive: true });
    mkdirSync(join(legacyDir, 'shared'), { recursive: true });

    writeFileSync(
      join(canonicalDir, 'shared', 'SKILL.md'),
      '---\nname: Canonical Shared\ntriggers:\n  - "shared-unique-trigger"\n---\n# Canonical\n'
    );
    writeFileSync(
      join(legacyDir, 'shared', 'SKILL.md'),
      '---\nname: Legacy Shared\ntriggers:\n  - "shared-unique-trigger"\n---\n# Legacy\n'
    );

    const { stdout, status } = runInjector('shared-unique-trigger', 's2');
    expect(status).toBe(0);

    const output = JSON.parse(stdout);
    const context = output.hookSpecificOutput?.additionalContext || '';
    expect(context).toContain('Canonical Shared');
    expect(context).not.toContain('Legacy Shared');
  });

  it('should keep distinct nested skills with the same leaf filename', () => {
    const canonicalDir = join(testDir, '.agents', 'skills', 'droid-learned');
    const legacyDir = join(testDir, '.omd', 'skills');
    mkdirSync(join(canonicalDir, 'alpha'), { recursive: true });
    mkdirSync(join(legacyDir, 'beta'), { recursive: true });

    writeFileSync(
      join(canonicalDir, 'alpha', 'SKILL.md'),
      '---\nname: Alpha Nested\ntriggers:\n  - "alpha-nested-trigger"\n---\n# Alpha Nested\n'
    );
    writeFileSync(
      join(legacyDir, 'beta', 'SKILL.md'),
      '---\nname: Beta Nested\ntriggers:\n  - "beta-nested-trigger"\n---\n# Beta Nested\n'
    );

    const { stdout, status } = runInjector('alpha-nested-trigger beta-nested-trigger', 's3');
    expect(status).toBe(0);

    const output = JSON.parse(stdout);
    const context = output.hookSpecificOutput?.additionalContext || '';
    expect(context).toContain('Alpha Nested');
    expect(context).toContain('Beta Nested');
  });
});
