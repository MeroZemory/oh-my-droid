import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { swarmTool } from '../swarm-tool.js';
import { stopSwarm } from '../../hooks/swarm/index.js';

describe('swarm MCP tool', () => {
  let testDir: string;
  let secondTestDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = join(tmpdir(), `swarm-tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    secondTestDir = join(tmpdir(), `swarm-tool-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    mkdirSync(testDir, { recursive: true });
    mkdirSync(secondTestDir, { recursive: true });
    process.chdir(testDir);
  });

  afterEach(() => {
    stopSwarm(true);
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
    rmSync(secondTestDir, { recursive: true, force: true });
  });

  async function callTool(args: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result = await swarmTool.handler(args);
    const text = result.content[0]?.text ?? '{}';
    return JSON.parse(text) as Record<string, unknown>;
  }

  it('should reject unknown actions', async () => {
    const result = await callTool({ action: 'invalid' });
    expect(result.error).toContain('Unknown action');
  });

  it('should reject invalid start params', async () => {
    const result = await callTool({ action: 'start', cwd: testDir });
    expect(result.error).toBe('Validation failed');
  });

  it('should reject fields that do not belong to an action', async () => {
    const result = await callTool({
      action: 'start',
      cwd: testDir,
      agentCount: 1,
      tasks: ['test task'],
      unexpected: true,
    });
    expect(result.error).toBe('Validation failed');
  });

  it('should complete a start-claim-complete-stop lifecycle', async () => {
    const startResult = await callTool({
      action: 'start',
      cwd: testDir,
      agentCount: 1,
      tasks: ['test task'],
    });
    expect(startResult.started).toBe(true);

    const claimResult = await callTool({
      action: 'claim',
      cwd: testDir,
      agentId: 'worker-1',
    });
    expect(claimResult.success).toBe(true);
    expect(claimResult.taskId).toBe('task-1');

    const heartbeatResult = await callTool({
      action: 'heartbeat',
      cwd: testDir,
      agentId: 'worker-1',
    });
    expect(heartbeatResult.ok).toBe(true);

    const completeResult = await callTool({
      action: 'complete',
      cwd: testDir,
      agentId: 'worker-1',
      taskId: 'task-1',
      result: 'done',
    });
    expect(completeResult.ok).toBe(true);

    const stopResult = await callTool({ action: 'stop', cwd: testDir });
    expect(stopResult.stopped).toBe(true);
  });

  it('should switch databases when actions target a different cwd', async () => {
    await callTool({
      action: 'start',
      cwd: testDir,
      agentCount: 1,
      tasks: ['project A task'],
    });

    const projectBStatus = await callTool({
      action: 'status',
      cwd: secondTestDir,
    });
    expect(projectBStatus.state).toBeNull();

    const projectAStatus = await callTool({
      action: 'status',
      cwd: testDir,
    });
    expect(projectAStatus.state).toMatchObject({
      active: true,
      tasks: [expect.objectContaining({ description: 'project A task' })],
    });
  });

  it('should return no_pending_tasks when pool is empty', async () => {
    await callTool({
      action: 'start',
      cwd: testDir,
      agentCount: 1,
      tasks: ['only task'],
    });
    await callTool({ action: 'claim', cwd: testDir, agentId: 'w1' });

    const secondClaim = await callTool({
      action: 'claim',
      cwd: testDir,
      agentId: 'w2',
    });
    expect(secondClaim.success).toBe(false);
    expect(secondClaim.reason).toBe('no_pending_tasks');

    await callTool({ action: 'stop', cwd: testDir, deleteDatabase: true });
  });
});
