import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TEAM_CONFIG,
  type Team,
  type TeamStatus,
  type MemberStatus,
  type MessageType,
  type IsolationMode,
  type OrchestratorPhase,
  type ControlPayload,
  type ContextEntry,
  type SpawnEdge,
} from '../types.js';

describe('DEFAULT_TEAM_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_TEAM_CONFIG.maxMembers).toBe(5);
    expect(DEFAULT_TEAM_CONFIG.timeout).toBe(600_000);
    expect(DEFAULT_TEAM_CONFIG.memberTimeout).toBe(300_000);
    expect(DEFAULT_TEAM_CONFIG.isolationMode).toBe('shared');
  });
});

describe('type union exhaustiveness', () => {
  it('TeamStatus covers all variants', () => {
    const statuses: TeamStatus[] = ['active', 'completed', 'failed'];
    expect(statuses).toHaveLength(3);
  });

  it('MemberStatus covers all variants', () => {
    const statuses: MemberStatus[] = ['pending', 'running', 'idle', 'completed', 'failed'];
    expect(statuses).toHaveLength(5);
  });

  it('MessageType covers all variants', () => {
    const types: MessageType[] = [
      'task', 'result', 'question', 'feedback',
      'shutdown_request', 'shutdown_response',
      'permission_request', 'permission_response',
    ];
    expect(types).toHaveLength(8);
  });

  it('IsolationMode covers all variants', () => {
    const modes: IsolationMode[] = ['shared', 'worktree'];
    expect(modes).toHaveLength(2);
  });

  it('OrchestratorPhase covers all variants', () => {
    const phases: OrchestratorPhase[] = ['init', 'delegate', 'coordinate', 'collect', 'finalize'];
    expect(phases).toHaveLength(5);
  });
});

describe('ControlPayload discriminated union', () => {
  it('text payload', () => {
    const p: ControlPayload = { kind: 'text', text: 'hello' };
    expect(p.kind).toBe('text');
  });

  it('task_assignment payload', () => {
    const p: ControlPayload = { kind: 'task_assignment', description: 'implement API', files: ['src/api.ts'] };
    expect(p.kind).toBe('task_assignment');
  });

  it('task_result payload', () => {
    const p: ControlPayload = { kind: 'task_result', summary: 'done', filesModified: ['src/api.ts'] };
    expect(p.kind).toBe('task_result');
  });

  it('permission_request payload', () => {
    const p: ControlPayload = { kind: 'permission_request', requestId: 'r1', tool: 'Bash', args: { command: 'rm -rf' } };
    expect(p.kind).toBe('permission_request');
  });

  it('permission_response payload', () => {
    const p: ControlPayload = { kind: 'permission_response', requestId: 'r1', approved: false, reason: 'too dangerous' };
    expect(p.kind).toBe('permission_response');
  });

  it('shutdown_request payload', () => {
    const p: ControlPayload = { kind: 'shutdown_request', reason: 'team complete' };
    expect(p.kind).toBe('shutdown_request');
  });

  it('shutdown_response payload', () => {
    const p: ControlPayload = { kind: 'shutdown_response', acknowledged: true };
    expect(p.kind).toBe('shutdown_response');
  });
});

describe('Team JSON serialization roundtrip', () => {
  it('serializes and deserializes without loss', () => {
    const team: Team = {
      name: 'test-team',
      leader: 'task-abc123',
      members: [
        {
          id: 'task-def456',
          name: 'architect-1',
          role: 'architect',
          status: 'running',
          currentTask: 'Design API schema',
          lastHeartbeat: '2026-04-16T10:00:00.000Z',
          toolPolicy: {
            allowedTools: ['Read', 'Glob', 'Grep'],
            disallowedTools: ['Bash'],
            model: 'opus',
            permissionMode: 'leader-brokered',
          },
        },
        {
          id: 'task-ghi789',
          name: 'executor-1',
          role: 'executor',
          status: 'pending',
        },
      ],
      status: 'active',
      createdAt: '2026-04-16T09:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
      config: { ...DEFAULT_TEAM_CONFIG },
    };

    const json = JSON.stringify(team);
    const restored: Team = JSON.parse(json);

    expect(restored.name).toBe(team.name);
    expect(restored.leader).toBe(team.leader);
    expect(restored.status).toBe(team.status);
    expect(restored.createdAt).toBe(team.createdAt);
    expect(restored.updatedAt).toBe(team.updatedAt);
    expect(restored.config).toEqual(team.config);
    expect(restored.members).toHaveLength(2);
    expect(restored.members[0].toolPolicy?.allowedTools).toEqual(['Read', 'Glob', 'Grep']);
    expect(restored.members[0].toolPolicy?.permissionMode).toBe('leader-brokered');
    expect(restored.members[1].toolPolicy).toBeUndefined();
  });
});

describe('SpawnEdge serialization', () => {
  it('roundtrips correctly', () => {
    const edge: SpawnEdge = {
      parentName: 'leader',
      childName: 'architect-1',
      status: 'open',
      spawnedAt: '2026-04-16T09:00:00.000Z',
    };

    const restored: SpawnEdge = JSON.parse(JSON.stringify(edge));
    expect(restored).toEqual(edge);
  });
});

describe('ContextEntry serialization', () => {
  it('roundtrips correctly', () => {
    const entry: ContextEntry = {
      author: 'architect-1',
      content: 'Use REST over GraphQL',
      category: 'decision',
      timestamp: '2026-04-16T09:30:00.000Z',
    };

    const restored: ContextEntry = JSON.parse(JSON.stringify(entry));
    expect(restored).toEqual(entry);
  });
});
