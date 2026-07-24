/**
 * Swarm MCP Tool
 *
 * Exposes swarm coordination operations as a single MCP tool (mcp__t__swarm).
 * Workers and coordinators call this tool instead of importing source-relative
 * TypeScript modules, satisfying R13 (one shipped runtime surface).
 *
 * KTD11: Registry-facing schema is a raw shape; the handler applies a strict
 * discriminated-union Zod schema for action-specific validation.
 * KTD13: Actions are serialized via a module-level promise queue so concurrent
 * tool calls never observe the wrong project's global swarm state.
 */

import { z } from 'zod';
import {
  startSwarm,
  stopSwarm,
  connectToSwarm,
  claimTask,
  completeTask,
  failTask,
  releaseTask,
  heartbeat,
  cleanupStaleClaims,
  getSwarmStatus,
  getSwarmStats,
} from '../hooks/swarm/index.js';

// -- Registry-facing schema (raw shape) ---------------------------------------

const swarmSchema = {
  action: z
    .enum(['start', 'connect', 'status', 'claim', 'heartbeat', 'complete', 'fail', 'release', 'cleanup', 'stop'])
    .describe('Swarm operation to perform'),
  cwd: z.string().optional().describe('Working directory for the swarm database'),
  agentId: z.string().optional().describe('Agent identifier (for claim, heartbeat, complete, fail, release)'),
  taskId: z.string().nullable().optional().describe('Task identifier'),
  agentCount: z.number().int().positive().optional().describe('Number of agents (for start)'),
  tasks: z.array(z.string()).optional().describe('Task descriptions (for start)'),
  result: z.string().optional().describe('Task result output (for complete)'),
  error: z.string().optional().describe('Error message (for fail)'),
  leaseTimeout: z.number().int().positive().optional().describe('Lease timeout in ms (for cleanup)'),
  deleteDatabase: z.boolean().optional().describe('Whether to delete the database (for stop)'),
};

// -- Strict per-action validation (KTD11) -------------------------------------

const actionNames = [
  'start',
  'connect',
  'status',
  'claim',
  'heartbeat',
  'complete',
  'fail',
  'release',
  'cleanup',
  'stop',
] as const;
const actionNameSet = new Set<string>(actionNames);

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('start'),
    cwd: z.string(),
    agentCount: z.number().int().positive(),
    tasks: z.array(z.string().min(1)).min(1),
  }).strict(),
  z.object({ action: z.literal('connect'), cwd: z.string() }).strict(),
  z.object({ action: z.literal('status'), cwd: z.string() }).strict(),
  z.object({ action: z.literal('claim'), cwd: z.string(), agentId: z.string().min(1) }).strict(),
  z.object({ action: z.literal('heartbeat'), cwd: z.string(), agentId: z.string().min(1) }).strict(),
  z.object({
    action: z.literal('complete'),
    cwd: z.string(),
    agentId: z.string().min(1),
    taskId: z.string().min(1),
    result: z.string().optional(),
  }).strict(),
  z.object({
    action: z.literal('fail'),
    cwd: z.string(),
    agentId: z.string().min(1),
    taskId: z.string().min(1),
    error: z.string(),
  }).strict(),
  z.object({
    action: z.literal('release'),
    cwd: z.string(),
    agentId: z.string().min(1),
    taskId: z.string().min(1),
  }).strict(),
  z.object({
    action: z.literal('cleanup'),
    cwd: z.string(),
    leaseTimeout: z.number().int().positive().optional(),
  }).strict(),
  z.object({
    action: z.literal('stop'),
    cwd: z.string(),
    deleteDatabase: z.boolean().optional(),
  }).strict(),
]);

type SwarmAction = z.infer<typeof actionSchema>;

// -- Serialization queue (KTD13) ----------------------------------------------

let actionQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = actionQueue.then(fn, fn);
  actionQueue = next.then(() => undefined, () => undefined);
  return next as Promise<T>;
}

// -- Handler ------------------------------------------------------------------

async function handleSwarm(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const raw = args && typeof args === 'object' ? args as Record<string, unknown> : {};
  const action = typeof raw.action === 'string' ? raw.action : undefined;

  if (!action || !actionNameSet.has(action)) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown action: ${action ?? 'undefined'}` }) }],
    };
  }

  const parsed = actionSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }) }],
    };
  }

  try {
    const result = await serialized(() => executeAction(parsed.data));
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }],
    };
  }
}

async function requireConnection(cwd: string): Promise<void> {
  if (!await connectToSwarm(cwd)) {
    throw new Error(`Failed to connect to swarm database at ${cwd}`);
  }
}

async function executeAction(params: SwarmAction): Promise<unknown> {
  switch (params.action) {
    case 'start': {
      const ok = await startSwarm({
        cwd: params.cwd,
        agentCount: params.agentCount,
        tasks: params.tasks,
      });
      return { started: ok };
    }
    case 'connect': {
      const ok = await connectToSwarm(params.cwd);
      return { connected: ok };
    }
    case 'status': {
      await requireConnection(params.cwd);
      const state = getSwarmStatus();
      const stats = getSwarmStats();
      return { state, stats };
    }
    case 'claim': {
      await requireConnection(params.cwd);
      return claimTask(params.agentId);
    }
    case 'heartbeat': {
      await requireConnection(params.cwd);
      return { ok: heartbeat(params.agentId) };
    }
    case 'complete': {
      await requireConnection(params.cwd);
      return { ok: completeTask(params.agentId, params.taskId, params.result) };
    }
    case 'fail': {
      await requireConnection(params.cwd);
      return { ok: failTask(params.agentId, params.taskId, params.error) };
    }
    case 'release': {
      await requireConnection(params.cwd);
      return { ok: releaseTask(params.agentId, params.taskId) };
    }
    case 'cleanup': {
      await requireConnection(params.cwd);
      return { released: cleanupStaleClaims(params.leaseTimeout) };
    }
    case 'stop': {
      await requireConnection(params.cwd);
      return { stopped: stopSwarm(params.deleteDatabase) };
    }
  }
}

// -- Export -------------------------------------------------------------------

export const swarmTool = {
  name: 'swarm',
  description: 'Swarm coordination tool. Actions: start, connect, status, claim, heartbeat, complete, fail, release, cleanup, stop. Each action (except start) connects to the swarm database at cwd first.',
  schema: swarmSchema,
  handler: handleSwarm,
};
