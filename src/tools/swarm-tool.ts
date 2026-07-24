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

const startSchema = z.object({
  cwd: z.string(),
  agentCount: z.number().int().positive(),
  tasks: z.array(z.string().min(1)).min(1),
});

const connectSchema = z.object({ cwd: z.string() });
const statusSchema = z.object({ cwd: z.string() });
const claimSchema = z.object({ cwd: z.string(), agentId: z.string().min(1) });
const heartbeatSchema = z.object({ cwd: z.string(), agentId: z.string().min(1), taskId: z.string().nullable() });
const completeSchema = z.object({ cwd: z.string(), agentId: z.string().min(1), taskId: z.string().min(1), result: z.string() });
const failSchema = z.object({ cwd: z.string(), agentId: z.string().min(1), taskId: z.string().min(1), error: z.string() });
const releaseSchema = z.object({ cwd: z.string(), agentId: z.string().min(1), taskId: z.string().min(1) });
const cleanupSchema = z.object({ cwd: z.string(), leaseTimeout: z.number().int().positive() });
const stopSchema = z.object({ cwd: z.string(), deleteDatabase: z.boolean() });

const actionSchemas: Record<string, z.ZodTypeAny> = {
  start: startSchema,
  connect: connectSchema,
  status: statusSchema,
  claim: claimSchema,
  heartbeat: heartbeatSchema,
  complete: completeSchema,
  fail: failSchema,
  release: releaseSchema,
  cleanup: cleanupSchema,
  stop: stopSchema,
};

// -- Serialization queue (KTD13) ----------------------------------------------

let actionQueue: Promise<unknown> = Promise.resolve();

function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const next = actionQueue.then(fn, fn);
  actionQueue = next.then(() => undefined, () => undefined);
  return next as Promise<T>;
}

// -- Handler ------------------------------------------------------------------

async function handleSwarm(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const raw = args as Record<string, unknown>;
  const action = raw.action as string | undefined;

  if (!action || !actionSchemas[action]) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown action: ${action ?? 'undefined'}` }) }],
    };
  }

  const validator = actionSchemas[action];
  const parsed = validator.safeParse(raw);

  if (!parsed.success) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: 'Validation failed', details: parsed.error.issues }) }],
    };
  }

  const params = parsed.data as Record<string, unknown>;

  try {
    const result = await serialized(() => executeAction(action, params));
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: error instanceof Error ? error.message : String(error) }) }],
    };
  }
}

async function executeAction(action: string, params: Record<string, unknown>): Promise<unknown> {
  switch (action) {
    case 'start': {
      const ok = await startSwarm({
        cwd: params.cwd as string,
        agentCount: params.agentCount as number,
        tasks: params.tasks as string[],
      });
      return { started: ok };
    }
    case 'connect': {
      const ok = await connectToSwarm(params.cwd as string);
      return { connected: ok };
    }
    case 'status': {
      await connectToSwarm(params.cwd as string);
      const state = getSwarmStatus();
      const stats = getSwarmStats();
      return { state, stats };
    }
    case 'claim': {
      await connectToSwarm(params.cwd as string);
      return claimTask(params.agentId as string);
    }
    case 'heartbeat': {
      await connectToSwarm(params.cwd as string);
      return { ok: heartbeat(params.agentId as string) };
    }
    case 'complete': {
      await connectToSwarm(params.cwd as string);
      return { ok: completeTask(params.agentId as string, params.taskId as string, params.result as string) };
    }
    case 'fail': {
      await connectToSwarm(params.cwd as string);
      return { ok: failTask(params.agentId as string, params.taskId as string, params.error as string) };
    }
    case 'release': {
      await connectToSwarm(params.cwd as string);
      return { ok: releaseTask(params.agentId as string, params.taskId as string) };
    }
    case 'cleanup': {
      await connectToSwarm(params.cwd as string);
      return { released: cleanupStaleClaims(params.leaseTimeout as number) };
    }
    case 'stop': {
      await connectToSwarm(params.cwd as string);
      return { stopped: stopSwarm(params.deleteDatabase as boolean) };
    }
    default:
      return { error: `Unimplemented action: ${action}` };
  }
}

// -- Export -------------------------------------------------------------------

export const swarmTool = {
  name: 'swarm',
  description: 'Swarm coordination tool. Actions: start, connect, status, claim, heartbeat, complete, fail, release, cleanup, stop. Each action (except start) connects to the swarm database at cwd first.',
  schema: swarmSchema,
  handler: handleSwarm,
};
