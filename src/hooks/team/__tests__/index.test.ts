import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import {
  buildSpawnParams,
  handleMemberCompletion,
  checkHeartbeats,
  processTeamHook,
} from '../index.js';
import { setBaseDir as setRegBaseDir, heartbeat } from '../../../team/registry.js';
import { setBaseDir as setMbxBaseDir, sendMessage } from '../../../team/mailbox.js';
import { setBaseDir as setCtxBaseDir, addContextEntry } from '../../../team/context.js';
import {
  setBaseDir as setOrcBaseDir,
  initTeam,
  delegateWork,
  getOrchestratorState,
} from '../../../team/orchestrator.js';
import { getTeam, updateMemberStatus } from '../../../team/registry.js';
import { readMessages } from '../../../team/mailbox.js';

let tmpDir: string;

function setAllBaseDirs(dir: string) {
  setRegBaseDir(dir);
  setMbxBaseDir(dir);
  setCtxBaseDir(dir);
  setOrcBaseDir(dir);
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-hook-team-test-'));
  setAllBaseDirs(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// Helper to init a standard team
function setupTeam(name: string = 'test-team') {
  initTeam({
    name,
    taskDescription: 'Build API',
    roles: [{ role: 'architect' }, { role: 'executor' }],
  });
  delegateWork(name, [
    { memberName: 'architect-1', description: 'Design schema', files: ['src/schema.ts'] },
    { memberName: 'executor-1', description: 'Implement API', files: ['src/api.ts'] },
  ]);
  return name;
}

// ── buildSpawnParams ──────────────────────────────────────────────────────

describe('buildSpawnParams', () => {
  it('generates spawn params for each assignment', () => {
    const name = setupTeam();
    const results = buildSpawnParams(name);

    expect(results).toHaveLength(2);
    expect(results[0].memberName).toBe('architect-1');
    expect(results[0].params.subagentType).toBe('architect');
    expect(results[0].params.runInBackground).toBe(true);
    expect(results[1].memberName).toBe('executor-1');
    expect(results[1].params.subagentType).toBe('executor');
  });

  it('includes shared context in prompt', () => {
    const name = setupTeam();
    addContextEntry(name, { author: 'leader', content: 'Use REST', category: 'decision' });

    const results = buildSpawnParams(name);
    expect(results[0].params.prompt).toContain('Use REST');
    expect(results[1].params.prompt).toContain('Use REST');
  });

  it('includes file ownership in prompt', () => {
    const name = setupTeam();
    const results = buildSpawnParams(name);

    expect(results[0].params.prompt).toContain('src/schema.ts');
    expect(results[1].params.prompt).toContain('src/api.ts');
  });

  it('includes assignment description in prompt', () => {
    const name = setupTeam();
    const results = buildSpawnParams(name);

    expect(results[0].params.prompt).toContain('Design schema');
    expect(results[1].params.prompt).toContain('Implement API');
  });

  it('includes tool policy from member', () => {
    initTeam({
      name: 'tp',
      taskDescription: 'X',
      roles: [{ role: 'executor' }],
    });
    // Manually set tool policy on member
    const team = getTeam('tp')!;
    team.members[0].toolPolicy = {
      allowedTools: ['Read', 'Edit'],
      disallowedTools: ['Bash'],
      model: 'sonnet',
    };
    // Write back
    const fp = path.join(tmpDir, 'tp.json');
    fs.writeFileSync(fp, JSON.stringify(team, null, 2));

    delegateWork('tp', [{ memberName: 'executor-1', description: 'work' }]);
    const results = buildSpawnParams('tp');

    expect(results[0].params.allowedTools).toEqual(['Read', 'Edit']);
    expect(results[0].params.disallowedTools).toEqual(['Bash']);
    expect(results[0].params.model).toBe('sonnet');
  });

  it('returns empty for non-existent team', () => {
    expect(buildSpawnParams('nope')).toEqual([]);
  });
});

// ── handleMemberCompletion ────────────────────────────────────────────────

describe('handleMemberCompletion', () => {
  it('returns structured completion notification', () => {
    const name = setupTeam();
    const notif = handleMemberCompletion(name, 'architect-1', 'Schema designed', ['src/schema.ts'], true);

    expect(notif.type).toBe('task-notification');
    expect(notif.memberName).toBe('architect-1');
    expect(notif.status).toBe('completed');
    expect(notif.summary).toBe('Schema designed');
    expect(notif.filesModified).toEqual(['src/schema.ts']);
  });

  it('marks failed completion', () => {
    const name = setupTeam();
    const notif = handleMemberCompletion(name, 'executor-1', 'Type error', [], false);

    expect(notif.status).toBe('failed');
    expect(getTeam(name)!.members.find((m) => m.name === 'executor-1')!.status).toBe('failed');
  });

  it('sends result message to leader mailbox', () => {
    const name = setupTeam();
    handleMemberCompletion(name, 'architect-1', 'done', ['a.ts']);

    const msgs = readMessages(name, 'leader');
    expect(msgs.some((m) => m.type === 'result' && m.from === 'architect-1')).toBe(true);
  });
});

// ── checkHeartbeats ───────────────────────────────────────────────────────

describe('checkHeartbeats', () => {
  it('detects stale members', () => {
    const name = setupTeam();
    const result = checkHeartbeats(name, 1000);

    // Both members are running but never heartbeated
    expect(result.staleMembers).toHaveLength(2);
    expect(result.totalActive).toBe(2);
  });

  it('excludes recently heartbeated members', () => {
    const name = setupTeam();
    heartbeat(name, 'architect-1');

    const result = checkHeartbeats(name, 60_000);
    expect(result.staleMembers).toHaveLength(1);
    expect(result.staleMembers[0].name).toBe('executor-1');
  });

  it('returns empty for non-existent team', () => {
    const result = checkHeartbeats('nope');
    expect(result.staleMembers).toEqual([]);
    expect(result.totalActive).toBe(0);
  });
});

// ── processTeamHook ───────────────────────────────────────────────────────

describe('processTeamHook', () => {
  it('returns not handled when no team name', () => {
    const result = processTeamHook({ type: 'user_prompt_submit' });
    expect(result.handled).toBe(false);
  });

  it('returns not handled for non-existent team', () => {
    const result = processTeamHook({ type: 'user_prompt_submit', teamName: 'nope' });
    expect(result.handled).toBe(false);
  });

  it('handles user_prompt_submit during coordinate phase with pending messages', () => {
    const name = setupTeam();
    // Send a message from a member to leader
    sendMessage(name, { from: 'architect-1', to: 'leader', type: 'question', payload: { kind: 'text', text: 'Which DB?' } });

    const result = processTeamHook({ type: 'user_prompt_submit', teamName: name });
    expect(result.handled).toBe(true);
    expect(result.message).toContain('pending message');
  });

  it('auto-handles permission requests during coordinate', () => {
    const name = setupTeam();
    sendMessage(name, {
      from: 'executor-1',
      to: 'leader',
      type: 'permission_request',
      payload: { kind: 'permission_request', requestId: 'r1', tool: 'Read', args: {} },
    });

    processTeamHook({ type: 'user_prompt_submit', teamName: name });

    // Permission response should be sent back
    const msgs = readMessages(name, 'executor-1');
    expect(msgs.some((m) => m.type === 'permission_response')).toBe(true);
  });

  it('handles post_tool_use with member completion', () => {
    const name = setupTeam();
    const result = processTeamHook({
      type: 'post_tool_use',
      teamName: name,
      memberName: 'architect-1',
      toolOutput: 'Schema complete',
    });

    expect(result.handled).toBe(true);
    expect(result.notification).toBeDefined();
    expect(result.notification!.status).toBe('completed');
    expect(result.notification!.memberName).toBe('architect-1');
  });

  it('passes through post_tool_use without member info', () => {
    const name = setupTeam();
    const result = processTeamHook({ type: 'post_tool_use', teamName: name });
    expect(result.handled).toBe(false);
  });

  it('passes through pre_compact', () => {
    const name = setupTeam();
    const result = processTeamHook({ type: 'pre_compact', teamName: name });
    expect(result.handled).toBe(false);
  });
});
