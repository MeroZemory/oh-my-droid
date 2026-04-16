import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Barrel export test
import {
  // Types
  DEFAULT_TEAM_CONFIG,
  // Registry
  createTeam, getTeam, deleteTeam, listTeams,
  addMember, updateMemberStatus, heartbeat, getStaleMembers,
  addSpawnEdge, closeSpawnEdge, getSpawnGraph, getOpenChildren,
  // Mailbox
  sendMessage, readMessages, readUnreadMessages, markAsRead,
  broadcastMessage, getMailboxState, clearMailbox,
  // Context
  addContextEntry, getContext, getContextAsMarkdown,
  writeArtifact, readArtifact, appendTranscript, listTranscripts,
  // Orchestrator
  initTeam, delegateWork, pollTeamStatus, collectResults, finalizeTeam,
  notifyMemberComplete, handleMemberFailure, cleanupTeam,
} from '../index.js';

import { setBaseDir as setRegBaseDir } from '../registry.js';
import { setBaseDir as setMbxBaseDir } from '../mailbox.js';
import { setBaseDir as setCtxBaseDir } from '../context.js';
import { setBaseDir as setOrcBaseDir } from '../orchestrator.js';

let tmpDir: string;

function setAllBaseDirs(dir: string) {
  setRegBaseDir(dir);
  setMbxBaseDir(dir);
  setCtxBaseDir(dir);
  setOrcBaseDir(dir);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-integration-test-'));
  setAllBaseDirs(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Barrel export ─────────────────────────────────────────────────────────

describe('barrel export', () => {
  it('exports all core functions', () => {
    expect(typeof createTeam).toBe('function');
    expect(typeof getTeam).toBe('function');
    expect(typeof sendMessage).toBe('function');
    expect(typeof addContextEntry).toBe('function');
    expect(typeof initTeam).toBe('function');
    expect(typeof DEFAULT_TEAM_CONFIG).toBe('object');
  });
});

// ── E2E smoke test ────────────────────────────────────────────────────────

describe('E2E smoke test: full team lifecycle', () => {
  it('runs a complete team lifecycle', () => {
    // 1. Init team
    const state = initTeam({
      name: 'api-build',
      taskDescription: 'Add health check endpoint',
      roles: [{ role: 'architect' }, { role: 'executor' }, { role: 'qa-tester' }],
    });
    expect(state.phase).toBe('delegate');
    expect(getTeam('api-build')!.members).toHaveLength(3);

    // 2. Delegate work
    delegateWork('api-build', [
      { memberName: 'architect-1', description: 'Design endpoint schema', files: ['src/routes/health.ts'] },
      { memberName: 'executor-1', description: 'Implement endpoint', files: ['src/controllers/health.ts'] },
      { memberName: 'qa-tester-1', description: 'Write tests', files: ['tests/health.test.ts'] },
    ]);

    // 3. Verify members received tasks
    const archMsgs = readMessages('api-build', 'architect-1');
    expect(archMsgs.some((m) => m.type === 'task')).toBe(true);

    // 4. Simulate member completions
    notifyMemberComplete('api-build', 'architect-1', {
      summary: 'Schema designed: GET /health returns { status, uptime }',
      filesModified: ['src/routes/health.ts'],
      success: true,
    });

    // Add context from architect
    addContextEntry('api-build', {
      author: 'architect-1',
      content: 'Health endpoint returns { status: "ok", uptime: process.uptime() }',
      category: 'decision',
    });

    // Verify context is shared
    const md = getContextAsMarkdown('api-build');
    expect(md).toContain('Health endpoint');

    notifyMemberComplete('api-build', 'executor-1', {
      summary: 'Endpoint implemented',
      filesModified: ['src/controllers/health.ts'],
      success: true,
    });

    notifyMemberComplete('api-build', 'qa-tester-1', {
      summary: '3 tests written and passing',
      filesModified: ['tests/health.test.ts'],
      success: true,
    });

    // 5. Collect results
    const results = collectResults('api-build');
    expect(results.completed).toHaveLength(3);
    expect(results.failed).toHaveLength(0);
    expect(results.pending).toHaveLength(0);

    // 6. Finalize
    const final = finalizeTeam('api-build');
    expect(final.success).toBe(true);
    expect(final.summary).toContain('3 completed');

    // 7. Verify shutdown broadcast
    const mbx = getMailboxState('api-build');
    expect(mbx.messages.some((m) => m.type === 'shutdown_request')).toBe(true);

    // 8. Verify spawn graph is closed
    const graph = getSpawnGraph('api-build');
    expect(graph.edges.every((e) => e.status === 'closed')).toBe(true);

    // 9. Verify team status
    expect(getTeam('api-build')!.status).toBe('completed');
  });

  it('handles partial failure gracefully', () => {
    initTeam({
      name: 'partial',
      taskDescription: 'Test partial failure',
      roles: [{ role: 'executor', count: 2 }],
    });
    delegateWork('partial', [
      { memberName: 'executor-1', description: 'Task A' },
      { memberName: 'executor-2', description: 'Task B' },
    ]);

    notifyMemberComplete('partial', 'executor-1', {
      summary: 'Done', filesModified: [], success: true,
    });
    notifyMemberComplete('partial', 'executor-2', {
      summary: 'Type error', filesModified: [], success: false,
    });

    const results = collectResults('partial');
    expect(results.completed).toHaveLength(1);
    expect(results.failed).toHaveLength(1);

    const final = finalizeTeam('partial');
    expect(final.success).toBe(false);
    expect(final.summary).toContain('1 failed');
  });

  it('cleanup removes all state files', () => {
    initTeam({ name: 'clean', taskDescription: 'X', roles: [{ role: 'a' }] });
    delegateWork('clean', [{ memberName: 'a-1', description: 'work' }]);
    addContextEntry('clean', { author: 'a-1', content: 'note', category: 'finding' });
    appendTranscript('clean', 'a-1', 'log line');

    cleanupTeam('clean');

    expect(getTeam('clean')).toBeUndefined();
    expect(getMailboxState('clean').messages).toEqual([]);
    expect(getContext('clean').entries).toEqual([]);
    expect(listTranscripts('clean')).toEqual([]);
  });
});

// ── Documentation checks ──────────────────────────────────────────────────

describe('documentation updates', () => {
  it('CHANGELOG mentions Agent Team Mode', () => {
    const content = fs.readFileSync(path.resolve('CHANGELOG.md'), 'utf-8');
    expect(content).toContain('Agent Team Mode');
    expect(content).toContain('/team');
  });

  it('README has team keyword', () => {
    const content = fs.readFileSync(path.resolve('README.md'), 'utf-8');
    expect(content).toContain('| `team`');
  });

  it('FACTORY.md has team keyword mapping', () => {
    const content = fs.readFileSync(path.resolve('docs/FACTORY.md'), 'utf-8');
    expect(content).toContain('"team"');
    expect(content).toContain('`team`');
  });

  it('/plan skill mentions team suggestion', () => {
    const content = fs.readFileSync(path.resolve('skills/plan/SKILL.md'), 'utf-8');
    expect(content).toContain('/team');
    expect(content).toContain('Team Mode Suggestion');
  });
});

// ── Regression: existing features unaffected ──────────────────────────────

import { detectMagicKeywords } from '../../features/magic-keywords.js';

describe('regression: existing features', () => {
  it('magic keywords still detect ultrawork', () => {
    const detected = detectMagicKeywords('ultrawork fix all errors');
    expect(detected).toContain('ultrawork');
  });

  it('magic keywords still detect analyze', () => {
    const detected = detectMagicKeywords('analyze the auth module');
    expect(detected).toContain('analyze');
  });

  it('team keyword does not interfere with other keywords', () => {
    const detected = detectMagicKeywords('team ultrawork build it');
    expect(detected).toContain('team');
    expect(detected).toContain('ultrawork');
  });
});
