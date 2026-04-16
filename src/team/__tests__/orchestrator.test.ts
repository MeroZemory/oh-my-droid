import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  setBaseDir as setOrcBaseDir,
  initTeam,
  delegateWork,
  pollTeamStatus,
  collectResults,
  finalizeTeam,
  getOrchestratorState,
  advancePhase,
  handleMemberFailure,
  handlePermissionRequest,
  notifyMemberComplete,
  cleanupTeam,
} from '../orchestrator.js';
import { setBaseDir as setRegBaseDir, getTeam, updateMemberStatus, addMember } from '../registry.js';
import { setBaseDir as setMbxBaseDir, getMailboxState, readMessages } from '../mailbox.js';
import { setBaseDir as setCtxBaseDir, getContext } from '../context.js';

let tmpDir: string;

function setAllBaseDirs(dir: string) {
  setOrcBaseDir(dir);
  setRegBaseDir(dir);
  setMbxBaseDir(dir);
  setCtxBaseDir(dir);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-orch-test-'));
  setAllBaseDirs(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Lifecycle ─────────────────────────────────────────────────────────────

describe('initTeam', () => {
  it('creates team, members, and orchestrator state', () => {
    const state = initTeam({
      name: 'alpha',
      taskDescription: 'Build API',
      roles: [{ role: 'architect' }, { role: 'executor', count: 2 }],
    });

    expect(state.teamName).toBe('alpha');
    expect(state.phase).toBe('delegate');
    expect(state.taskDescription).toBe('Build API');

    const team = getTeam('alpha');
    expect(team).toBeDefined();
    expect(team!.members).toHaveLength(3);
    expect(team!.members.map((m) => m.name).sort()).toEqual(['architect-1', 'executor-1', 'executor-2']);
  });

  it('persists orchestrator state to disk', () => {
    initTeam({ name: 'beta', taskDescription: 'Test', roles: [{ role: 'qa' }] });
    const state = getOrchestratorState('beta');
    expect(state).toBeDefined();
    expect(state!.teamName).toBe('beta');
  });
});

describe('delegateWork', () => {
  beforeEach(() => {
    initTeam({
      name: 't1',
      taskDescription: 'Build',
      roles: [{ role: 'architect' }, { role: 'executor' }],
    });
  });

  it('sends task messages and updates member status', () => {
    delegateWork('t1', [
      { memberName: 'architect-1', description: 'Design schema', files: ['src/schema.ts'] },
      { memberName: 'executor-1', description: 'Implement API', files: ['src/api.ts'] },
    ]);

    const state = getOrchestratorState('t1');
    expect(state!.phase).toBe('coordinate');
    expect(state!.assignments).toHaveLength(2);
    expect(state!.assignments[0].status).toBe('in_progress');

    // Messages sent
    const archMsgs = readMessages('t1', 'architect-1');
    expect(archMsgs.length).toBeGreaterThanOrEqual(1);
    expect(archMsgs[0].type).toBe('task');

    // Member status updated
    const team = getTeam('t1');
    expect(team!.members.find((m) => m.name === 'architect-1')!.status).toBe('running');
  });

  it('rejects file ownership conflicts', () => {
    expect(() =>
      delegateWork('t1', [
        { memberName: 'architect-1', description: 'A', files: ['src/shared.ts'] },
        { memberName: 'executor-1', description: 'B', files: ['src/shared.ts'] },
      ]),
    ).toThrow('File ownership conflict');
  });

  it('allows non-overlapping files', () => {
    expect(() =>
      delegateWork('t1', [
        { memberName: 'architect-1', description: 'A', files: ['src/a.ts'] },
        { memberName: 'executor-1', description: 'B', files: ['src/b.ts'] },
      ]),
    ).not.toThrow();
  });
});

describe('pollTeamStatus', () => {
  it('returns current phase, members, pending messages, stale members', () => {
    initTeam({ name: 'poll', taskDescription: 'X', roles: [{ role: 'worker' }] });
    delegateWork('poll', [{ memberName: 'worker-1', description: 'Do work' }]);

    const status = pollTeamStatus('poll');
    expect(status.phase).toBe('coordinate');
    expect(status.members).toHaveLength(1);
    expect(status.staleMembers).toHaveLength(1); // no heartbeat yet
  });
});

describe('collectResults', () => {
  it('categorizes assignments by status', () => {
    initTeam({ name: 'col', taskDescription: 'X', roles: [{ role: 'a' }, { role: 'b' }, { role: 'c' }] });
    delegateWork('col', [
      { memberName: 'a-1', description: 'task a' },
      { memberName: 'b-1', description: 'task b' },
      { memberName: 'c-1', description: 'task c' },
    ]);

    // Simulate completions
    notifyMemberComplete('col', 'a-1', { summary: 'done', filesModified: [], success: true });
    notifyMemberComplete('col', 'b-1', { summary: 'err', filesModified: [], success: false });

    const results = collectResults('col');
    expect(results.completed).toHaveLength(1);
    expect(results.failed).toHaveLength(1);
    expect(results.pending).toHaveLength(1);
  });
});

describe('finalizeTeam', () => {
  it('marks team completed and broadcasts shutdown', () => {
    initTeam({ name: 'fin', taskDescription: 'X', roles: [{ role: 'worker' }] });
    delegateWork('fin', [{ memberName: 'worker-1', description: 'work' }]);
    notifyMemberComplete('fin', 'worker-1', { summary: 'done', filesModified: ['a.ts'], success: true });

    const result = finalizeTeam('fin');
    expect(result.success).toBe(true);
    expect(result.summary).toContain('1 completed');

    const team = getTeam('fin');
    expect(team!.status).toBe('completed');

    // Shutdown broadcast sent
    const mbx = getMailboxState('fin');
    expect(mbx.messages.some((m) => m.type === 'shutdown_request')).toBe(true);

    const state = getOrchestratorState('fin');
    expect(state!.phase).toBe('finalize');
  });

  it('marks team failed when assignments failed', () => {
    initTeam({ name: 'fail', taskDescription: 'X', roles: [{ role: 'worker' }] });
    delegateWork('fail', [{ memberName: 'worker-1', description: 'work' }]);
    notifyMemberComplete('fail', 'worker-1', { summary: 'err', filesModified: [], success: false });

    const result = finalizeTeam('fail');
    expect(result.success).toBe(false);
  });
});

// ── Phase transitions ─────────────────────────────────────────────────────

describe('advancePhase', () => {
  it('advances through valid transitions', () => {
    initTeam({ name: 'ph', taskDescription: 'X', roles: [{ role: 'a' }] });
    // delegate → coordinate is valid
    advancePhase('ph', 'coordinate');
    expect(getOrchestratorState('ph')!.phase).toBe('coordinate');
    // coordinate → collect is valid
    advancePhase('ph', 'collect');
    expect(getOrchestratorState('ph')!.phase).toBe('collect');
  });

  it('rejects invalid transitions', () => {
    initTeam({ name: 'inv', taskDescription: 'X', roles: [{ role: 'a' }] });
    // delegate → finalize is not valid
    expect(() => advancePhase('inv', 'finalize')).toThrow('Invalid phase transition');
  });

  it('throws for non-existent team', () => {
    expect(() => advancePhase('nope', 'init')).toThrow();
  });
});

// ── Error handling ────────────────────────────────────────────────────────

describe('handleMemberFailure', () => {
  it('reassigns to idle member with same role', () => {
    initTeam({ name: 'err', taskDescription: 'X', roles: [{ role: 'executor', count: 2 }] });
    delegateWork('err', [{ memberName: 'executor-1', description: 'work' }]);
    // executor-2 is still pending/idle
    updateMemberStatus('err', 'executor-2', 'idle');

    const result = handleMemberFailure('err', 'executor-1', 'crashed');
    expect(result.action).toBe('reassign');
    expect(result.reassignedTo).toBe('executor-2');
  });

  it('aborts when architect fails with no replacement', () => {
    initTeam({ name: 'crit', taskDescription: 'X', roles: [{ role: 'architect' }] });
    delegateWork('crit', [{ memberName: 'architect-1', description: 'design' }]);

    const result = handleMemberFailure('crit', 'architect-1', 'crashed');
    expect(result.action).toBe('abort');
    expect(getTeam('crit')!.status).toBe('failed');
  });

  it('skips non-critical failure with no replacement', () => {
    initTeam({ name: 'skip', taskDescription: 'X', roles: [{ role: 'executor' }] });
    delegateWork('skip', [{ memberName: 'executor-1', description: 'work' }]);

    const result = handleMemberFailure('skip', 'executor-1', 'err');
    expect(result.action).toBe('skip');
  });
});

// ── Permission broker ─────────────────────────────────────────────────────

describe('handlePermissionRequest', () => {
  beforeEach(() => {
    initTeam({ name: 'perm', taskDescription: 'X', roles: [{ role: 'executor' }] });
  });

  it('approves read-only tools', () => {
    const result = handlePermissionRequest('perm', {
      memberName: 'executor-1',
      requestId: 'r1',
      tool: 'Read',
      args: { path: '/src/x.ts' },
    });
    expect(result.approved).toBe(true);

    // Response message sent
    const msgs = readMessages('perm', 'executor-1');
    const resp = msgs.find((m) => m.type === 'permission_response');
    expect(resp).toBeDefined();
  });

  it('rejects destructive tools', () => {
    const result = handlePermissionRequest('perm', {
      memberName: 'executor-1',
      requestId: 'r2',
      tool: 'Bash',
      args: { command: 'rm -rf /' },
    });
    expect(result.approved).toBe(false);
    expect(result.reason).toContain('Bash');
  });
});

// ── Completion notification ───────────────────────────────────────────────

describe('notifyMemberComplete', () => {
  it('updates assignment and sends result message', () => {
    initTeam({ name: 'nc', taskDescription: 'X', roles: [{ role: 'worker' }] });
    delegateWork('nc', [{ memberName: 'worker-1', description: 'task' }]);

    notifyMemberComplete('nc', 'worker-1', { summary: 'done building', filesModified: ['a.ts', 'b.ts'], success: true });

    const state = getOrchestratorState('nc');
    const assignment = state!.assignments.find((a) => a.memberName === 'worker-1');
    expect(assignment!.status).toBe('completed');
    expect(assignment!.result).toBe('done building');

    // Result message sent to leader
    const msgs = readMessages('nc', 'leader');
    expect(msgs.some((m) => m.type === 'result')).toBe(true);

    // Context entry added
    const ctx = getContext('nc');
    expect(ctx.entries.some((e) => e.author === 'worker-1')).toBe(true);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────

describe('cleanupTeam', () => {
  it('removes all state', () => {
    initTeam({ name: 'clean', taskDescription: 'X', roles: [{ role: 'a' }] });
    delegateWork('clean', [{ memberName: 'a-1', description: 'work' }]);

    cleanupTeam('clean');

    expect(getTeam('clean')).toBeUndefined();
    expect(getOrchestratorState('clean')).toBeUndefined();
    expect(getMailboxState('clean').messages).toEqual([]);
  });

  it('no error on non-existent team', () => {
    expect(() => cleanupTeam('nope')).not.toThrow();
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('single member team', () => {
    const state = initTeam({ name: 'solo', taskDescription: 'Solo work', roles: [{ role: 'executor' }] });
    expect(getTeam('solo')!.members).toHaveLength(1);
    delegateWork('solo', [{ memberName: 'executor-1', description: 'do it' }]);
    notifyMemberComplete('solo', 'executor-1', { summary: 'done', filesModified: [], success: true });
    const result = finalizeTeam('solo');
    expect(result.success).toBe(true);
  });

  it('all members fail', () => {
    initTeam({ name: 'allfail', taskDescription: 'X', roles: [{ role: 'a' }, { role: 'b' }] });
    delegateWork('allfail', [
      { memberName: 'a-1', description: 'x' },
      { memberName: 'b-1', description: 'y' },
    ]);
    notifyMemberComplete('allfail', 'a-1', { summary: 'err', filesModified: [], success: false });
    notifyMemberComplete('allfail', 'b-1', { summary: 'err', filesModified: [], success: false });
    const result = finalizeTeam('allfail');
    expect(result.success).toBe(false);
    expect(result.summary).toContain('2 failed');
  });

  it('empty assignments', () => {
    initTeam({ name: 'empty', taskDescription: 'X', roles: [{ role: 'a' }] });
    delegateWork('empty', []);
    const results = collectResults('empty');
    expect(results.completed).toEqual([]);
    expect(results.pending).toEqual([]);
  });
});
