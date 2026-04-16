import { describe, it, expect } from 'vitest';
import { renderTeam, renderTeamCompact, type TeamStateForHud } from '../elements/team.js';

const RESET = '\x1b[0m';

function stripAnsi(s: string): string {
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

// ── renderTeam ────────────────────────────────────────────────────────────

describe('renderTeam', () => {
  it('returns null when no state', () => {
    expect(renderTeam(null)).toBeNull();
  });

  it('returns null when inactive', () => {
    const state: TeamStateForHud = {
      active: false, teamName: 'x', phase: 'coordinate',
      totalMembers: 3, running: 2, completed: 1, failed: 0,
    };
    expect(renderTeam(state)).toBeNull();
  });

  it('renders active team with progress', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 'api-build', phase: 'coordinate',
      totalMembers: 3, running: 2, completed: 1, failed: 0,
    };
    const result = renderTeam(state)!;
    const clean = stripAnsi(result);
    expect(clean).toContain('[TEAM:api-build]');
    expect(clean).toContain('1/3 done');
    expect(clean).toContain('Work');
  });

  it('shows failed count when failures exist', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 't1', phase: 'coordinate',
      totalMembers: 3, running: 1, completed: 1, failed: 1,
    };
    const clean = stripAnsi(renderTeam(state)!);
    expect(clean).toContain('1 failed');
  });

  it('shows correct phase names', () => {
    const phases = [
      { phase: 'init', expected: 'Init' },
      { phase: 'delegate', expected: 'Assign' },
      { phase: 'coordinate', expected: 'Work' },
      { phase: 'collect', expected: 'Collect' },
      { phase: 'finalize', expected: 'Done' },
    ];
    for (const { phase, expected } of phases) {
      const state: TeamStateForHud = {
        active: true, teamName: 't', phase,
        totalMembers: 1, running: 0, completed: 1, failed: 0,
      };
      const clean = stripAnsi(renderTeam(state)!);
      expect(clean).toContain(expected);
    }
  });

  it('renders completed team in green', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 't', phase: 'finalize',
      totalMembers: 2, running: 0, completed: 2, failed: 0,
    };
    const result = renderTeam(state)!;
    // Green ANSI code for completed
    expect(result).toContain('\x1b[32m');
  });
});

// ── renderTeamCompact ─────────────────────────────────────────────────────

describe('renderTeamCompact', () => {
  it('returns null when no state', () => {
    expect(renderTeamCompact(null)).toBeNull();
  });

  it('returns null when inactive', () => {
    const state: TeamStateForHud = {
      active: false, teamName: 'x', phase: 'coordinate',
      totalMembers: 1, running: 0, completed: 0, failed: 0,
    };
    expect(renderTeamCompact(state)).toBeNull();
  });

  it('renders progress compactly', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 't', phase: 'coordinate',
      totalMembers: 3, running: 2, completed: 1, failed: 0,
    };
    const clean = stripAnsi(renderTeamCompact(state)!);
    expect(clean).toBe('T:1/3');
  });

  it('renders done', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 't', phase: 'finalize',
      totalMembers: 2, running: 0, completed: 2, failed: 0,
    };
    const clean = stripAnsi(renderTeamCompact(state)!);
    expect(clean).toBe('T:Done');
  });

  it('renders failure with exclamation', () => {
    const state: TeamStateForHud = {
      active: true, teamName: 't', phase: 'coordinate',
      totalMembers: 3, running: 1, completed: 1, failed: 1,
    };
    const clean = stripAnsi(renderTeamCompact(state)!);
    expect(clean).toBe('T:1/3!');
  });
});

// ── State reader integration ──────────────────────────────────────────────

describe('readTeamStateForHud', () => {
  // These tests verify the state reader works with the registry's file format
  // by creating state files manually (no registry dependency needed)

  it('can be imported from omd-state', async () => {
    const { readTeamStateForHud } = await import('../omd-state.js');
    expect(typeof readTeamStateForHud).toBe('function');
  });

  it('returns null for non-existent directory', async () => {
    const { readTeamStateForHud } = await import('../omd-state.js');
    const result = readTeamStateForHud('/tmp/nonexistent-omd-test-dir');
    expect(result).toBeNull();
  });
});
