import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { detectMagicKeywords } from '../../features/magic-keywords.js';

// ── SKILL.md validation ───────────────────────────────────────────────────

describe('skills/team/SKILL.md', () => {
  const skillPath = path.resolve('skills/team/SKILL.md');

  it('exists', () => {
    expect(fs.existsSync(skillPath)).toBe(true);
  });

  it('has valid frontmatter with name and description', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toMatch(/^---\n/);
    expect(content).toMatch(/name:\s*team/);
    expect(content).toMatch(/description:\s*.+/);
  });

  it('covers all orchestrator phases', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('INIT');
    expect(content).toContain('DELEGATE');
    expect(content).toContain('COORDINATE');
    expect(content).toContain('COLLECT');
    expect(content).toContain('FINALIZE');
  });

  it('documents argument parsing', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('--roles');
    expect(content).toContain('--max-members');
    expect(content).toContain('--timeout');
    expect(content).toContain('--dry-run');
  });

  it('documents dry-run output format', () => {
    const content = fs.readFileSync(skillPath, 'utf-8');
    expect(content).toContain('[TEAM PLAN]');
    expect(content).toContain('File Ownership');
    expect(content).toContain('Proceed?');
  });
});

// ── Magic keywords ────────────────────────────────────────────────────────

describe('team magic keywords', () => {
  it('detects "team" keyword', () => {
    const detected = detectMagicKeywords('team: build the API endpoints');
    expect(detected).toContain('team');
  });

  it('detects "collaborate" keyword', () => {
    const detected = detectMagicKeywords('collaborate on this feature');
    expect(detected).toContain('collaborate');
  });

  it('detects "together" keyword', () => {
    const detected = detectMagicKeywords('let us work together on this');
    expect(detected).toContain('together');
  });

  it('does not detect keywords inside code blocks', () => {
    const detected = detectMagicKeywords('Check this:\n```\nconst team = new Team();\n```');
    expect(detected).not.toContain('team');
  });

  it('does not detect keywords inside inline code', () => {
    const detected = detectMagicKeywords('Use the `team` variable');
    expect(detected).not.toContain('team');
  });
});

// ── Agent definition ──────────────────────────────────────────────────────

describe('team-orchestrator agent', () => {
  it('prompt file exists', () => {
    const promptPath = path.resolve('droids/team-orchestrator.md');
    expect(fs.existsSync(promptPath)).toBe(true);
  });

  it('is registered in definitions.ts', () => {
    // Read source to verify registration (without importing the full module
    // which has complex dependencies)
    const defsPath = path.resolve('src/droids/definitions.ts');
    const content = fs.readFileSync(defsPath, 'utf-8');
    expect(content).toContain("'team-orchestrator'");
    expect(content).toContain('teamOrchestratorAgent');
  });

  it('agent definition has correct properties', () => {
    const defsPath = path.resolve('src/droids/definitions.ts');
    const content = fs.readFileSync(defsPath, 'utf-8');
    // Verify model is opus
    expect(content).toMatch(/teamOrchestratorAgent[\s\S]*?model:\s*'opus'/);
    // Verify has Agent tool
    expect(content).toMatch(/teamOrchestratorAgent[\s\S]*?tools:\s*\[.*'Agent'/);
  });
});
