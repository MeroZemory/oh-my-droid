import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  setBaseDir,
  createTeam,
  getTeam,
  deleteTeam,
  listTeams,
  updateTeamStatus,
  addMember,
  removeMember,
  updateMemberStatus,
  getMember,
  heartbeat,
  getActiveMembers,
  getStaleMembers,
  addSpawnEdge,
  closeSpawnEdge,
  getSpawnGraph,
  getOpenChildren,
} from '../registry.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-team-test-'));
  setBaseDir(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Team lifecycle ─────────────────────────────────────────────────────────

describe('team lifecycle', () => {
  it('creates a team with correct structure', () => {
    const team = createTeam('alpha', 'leader-1');
    expect(team.name).toBe('alpha');
    expect(team.leader).toBe('leader-1');
    expect(team.status).toBe('active');
    expect(team.members).toEqual([]);
    expect(team.config.maxMembers).toBe(5);

    // File exists on disk
    const filePath = path.join(tmpDir, 'alpha.json');
    expect(fs.existsSync(filePath)).toBe(true);
    const onDisk = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    expect(onDisk.name).toBe('alpha');
  });

  it('creates a team with custom config', () => {
    const team = createTeam('beta', 'leader-2', { maxMembers: 10, timeout: 120_000 });
    expect(team.config.maxMembers).toBe(10);
    expect(team.config.timeout).toBe(120_000);
    expect(team.config.memberTimeout).toBe(300_000); // default preserved
  });

  it('throws on duplicate team name', () => {
    createTeam('dup', 'leader');
    expect(() => createTeam('dup', 'leader')).toThrow('already exists');
  });

  it('gets an existing team', () => {
    createTeam('gamma', 'leader-3');
    const team = getTeam('gamma');
    expect(team).toBeDefined();
    expect(team!.name).toBe('gamma');
  });

  it('returns undefined for non-existent team', () => {
    expect(getTeam('nope')).toBeUndefined();
  });

  it('deletes a team', () => {
    createTeam('delta', 'leader-4');
    expect(deleteTeam('delta')).toBe(true);
    expect(getTeam('delta')).toBeUndefined();
  });

  it('returns false when deleting non-existent team', () => {
    expect(deleteTeam('nope')).toBe(false);
  });

  it('lists all teams', () => {
    createTeam('a', 'l1');
    createTeam('b', 'l2');
    createTeam('c', 'l3');
    const teams = listTeams();
    expect(teams.sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns empty list when no teams', () => {
    expect(listTeams()).toEqual([]);
  });
});

// ── Status transitions ────────────────────────────────────────────────────

describe('status transitions', () => {
  it('updates team status', () => {
    createTeam('st', 'leader');
    expect(updateTeamStatus('st', 'completed')).toBe(true);
    expect(getTeam('st')!.status).toBe('completed');
  });

  it('returns false for non-existent team', () => {
    expect(updateTeamStatus('nope', 'failed')).toBe(false);
  });
});

// ── Member management ─────────────────────────────────────────────────────

describe('member management', () => {
  beforeEach(() => {
    createTeam('mem', 'leader');
  });

  it('adds a member', () => {
    const member = addMember('mem', { id: 't1', name: 'architect-1', role: 'architect' });
    expect(member.name).toBe('architect-1');
    expect(member.status).toBe('pending');
    expect(getTeam('mem')!.members).toHaveLength(1);
  });

  it('auto-increments duplicate names', () => {
    addMember('mem', { id: 't1', name: 'executor-1', role: 'executor' });
    const second = addMember('mem', { id: 't2', name: 'executor-1', role: 'executor' });
    expect(second.name).toBe('executor-2');
  });

  it('auto-increments name without suffix', () => {
    addMember('mem', { id: 't1', name: 'architect', role: 'architect' });
    const second = addMember('mem', { id: 't2', name: 'architect', role: 'architect' });
    expect(second.name).toBe('architect-2');
  });

  it('preserves toolPolicy on add', () => {
    const member = addMember('mem', {
      id: 't1',
      name: 'exec',
      role: 'executor',
      toolPolicy: { allowedTools: ['Read', 'Edit'], permissionMode: 'leader-brokered' },
    });
    expect(member.toolPolicy?.allowedTools).toEqual(['Read', 'Edit']);
    const persisted = getMember('mem', 'exec');
    expect(persisted?.toolPolicy?.permissionMode).toBe('leader-brokered');
  });

  it('removes a member', () => {
    addMember('mem', { id: 't1', name: 'rm-target', role: 'executor' });
    expect(removeMember('mem', 'rm-target')).toBe(true);
    expect(getTeam('mem')!.members).toHaveLength(0);
  });

  it('returns false removing non-existent member', () => {
    expect(removeMember('mem', 'ghost')).toBe(false);
  });

  it('updates member status', () => {
    addMember('mem', { id: 't1', name: 'worker', role: 'executor' });
    expect(updateMemberStatus('mem', 'worker', 'running', 'building API')).toBe(true);
    const m = getMember('mem', 'worker');
    expect(m!.status).toBe('running');
    expect(m!.currentTask).toBe('building API');
  });

  it('returns false for non-existent member status update', () => {
    expect(updateMemberStatus('mem', 'ghost', 'running')).toBe(false);
  });

  it('gets a specific member', () => {
    addMember('mem', { id: 't1', name: 'finder', role: 'explore' });
    expect(getMember('mem', 'finder')?.role).toBe('explore');
    expect(getMember('mem', 'nope')).toBeUndefined();
  });

  it('throws when adding to non-existent team', () => {
    expect(() => addMember('nope', { id: 't1', name: 'x', role: 'y' })).toThrow('not found');
  });
});

// ── Heartbeat ─────────────────────────────────────────────────────────────

describe('heartbeat', () => {
  beforeEach(() => {
    createTeam('hb', 'leader');
    addMember('hb', { id: 't1', name: 'worker', role: 'executor' });
  });

  it('updates lastHeartbeat', () => {
    expect(heartbeat('hb', 'worker')).toBe(true);
    const m = getMember('hb', 'worker');
    expect(m!.lastHeartbeat).toBeDefined();
    expect(new Date(m!.lastHeartbeat!).getTime()).toBeGreaterThan(0);
  });

  it('returns false for non-existent member', () => {
    expect(heartbeat('hb', 'ghost')).toBe(false);
  });

  it('returns false for non-existent team', () => {
    expect(heartbeat('nope', 'worker')).toBe(false);
  });
});

// ── Queries ───────────────────────────────────────────────────────────────

describe('queries', () => {
  beforeEach(() => {
    createTeam('q', 'leader');
    addMember('q', { id: 't1', name: 'a', role: 'architect' });
    addMember('q', { id: 't2', name: 'b', role: 'executor' });
    addMember('q', { id: 't3', name: 'c', role: 'qa' });
    updateMemberStatus('q', 'a', 'running');
    updateMemberStatus('q', 'b', 'idle');
    updateMemberStatus('q', 'c', 'completed');
  });

  it('getActiveMembers returns running and idle only', () => {
    const active = getActiveMembers('q');
    expect(active.map((m) => m.name).sort()).toEqual(['a', 'b']);
  });

  it('getActiveMembers returns empty for non-existent team', () => {
    expect(getActiveMembers('nope')).toEqual([]);
  });

  it('getStaleMembers detects members without heartbeat', () => {
    const stale = getStaleMembers('q', 1000);
    // 'a' (running) and 'b' (idle) have no lastHeartbeat → stale
    expect(stale.map((m) => m.name).sort()).toEqual(['a', 'b']);
  });

  it('getStaleMembers excludes recently heartbeated members', () => {
    heartbeat('q', 'a');
    const stale = getStaleMembers('q', 60_000);
    // 'a' just heartbeated, 'b' never did
    expect(stale.map((m) => m.name)).toEqual(['b']);
  });
});

// ── Spawn graph ───────────────────────────────────────────────────────────

describe('spawn graph', () => {
  beforeEach(() => {
    createTeam('sg', 'leader');
  });

  it('starts with empty graph', () => {
    const graph = getSpawnGraph('sg');
    expect(graph.teamName).toBe('sg');
    expect(graph.edges).toEqual([]);
  });

  it('adds a spawn edge', () => {
    addSpawnEdge('sg', 'leader', 'architect-1');
    const graph = getSpawnGraph('sg');
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].parentName).toBe('leader');
    expect(graph.edges[0].childName).toBe('architect-1');
    expect(graph.edges[0].status).toBe('open');
  });

  it('closes a spawn edge', () => {
    addSpawnEdge('sg', 'leader', 'worker-1');
    closeSpawnEdge('sg', 'worker-1');
    const graph = getSpawnGraph('sg');
    expect(graph.edges[0].status).toBe('closed');
  });

  it('getOpenChildren returns only open children', () => {
    addSpawnEdge('sg', 'leader', 'a');
    addSpawnEdge('sg', 'leader', 'b');
    addSpawnEdge('sg', 'leader', 'c');
    closeSpawnEdge('sg', 'b');
    expect(getOpenChildren('sg', 'leader').sort()).toEqual(['a', 'c']);
  });

  it('getOpenChildren filters by parent', () => {
    addSpawnEdge('sg', 'leader', 'a');
    addSpawnEdge('sg', 'a', 'a-child');
    expect(getOpenChildren('sg', 'leader')).toEqual(['a']);
    expect(getOpenChildren('sg', 'a')).toEqual(['a-child']);
  });

  it('deleteTeam also removes spawn graph', () => {
    addSpawnEdge('sg', 'leader', 'x');
    deleteTeam('sg');
    // spawn-graph directory should be gone
    const graph = getSpawnGraph('sg');
    expect(graph.edges).toEqual([]);
  });
});
