/**
 * Swarm Task Claiming
 *
 * Atomic task claiming with lease-based ownership.
 * Uses SQLite transactions to ensure only one agent can claim a task.
 * Implements 5-minute lease timeout and heartbeat monitoring.
 */

import type { ClaimResult, SwarmTask } from './types.js';
import { DEFAULT_SWARM_CONFIG } from './types.js';
import {
  getDb,
  updateTask,
  getTask,
  getTasksByStatus,
  recordHeartbeat,
  getHeartbeats,
  removeHeartbeat,
  runTransaction,
  writeSwarmSummary
} from './state.js';

// Store current working directory for summary writes
let currentCwd: string | null = null;

/**
 * Set the current working directory for summary writes
 * Called by the main swarm module when starting/connecting
 */
export function setSwarmCwd(cwd: string): void {
  currentCwd = cwd;
}

/**
 * Get the current working directory
 */
export function getSwarmCwd(): string | null {
  return currentCwd;
}

/**
 * Atomically claim the next available task
 *
 * Uses a transaction to ensure only one agent can claim a task.
 * Claims are lease-based with a 5-minute timeout.
 *
 * @param agentId - Unique identifier for the claiming agent
 * @returns ClaimResult indicating success/failure and task details
 */
export function claimTask(agentId: string): ClaimResult {
  const db = getDb();
  if (!db) {
    return {
      success: false,
      taskId: null,
      reason: 'Database not initialized'
    };
  }

  try {
    // Use a transaction for atomic claim
    const claimTransaction = db.transaction(() => {
      // Find the first pending task
      const findStmt = db.prepare(`
        SELECT id, description FROM tasks
        WHERE status = 'pending'
        ORDER BY id
        LIMIT 1
      `);
      const task = findStmt.get() as { id: string; description: string } | undefined;

      if (!task) {
        return {
          success: false,
          taskId: null,
          reason: 'No pending tasks available'
        } as ClaimResult;
      }

      // Claim the task
      const claimStmt = db.prepare(`
        UPDATE tasks
        SET status = 'claimed', claimed_by = ?, claimed_at = ?
        WHERE id = ? AND status = 'pending'
      `);
      const result = claimStmt.run(agentId, Date.now(), task.id);

      if (result.changes === 0) {
        // Task was claimed by another agent between SELECT and UPDATE
        return {
          success: false,
          taskId: null,
          reason: 'Task was claimed by another agent'
        } as ClaimResult;
      }

      // Update heartbeat
      const heartbeatStmt = db.prepare(`
        INSERT OR REPLACE INTO heartbeats (agent_id, last_heartbeat, current_task_id)
        VALUES (?, ?, ?)
      `);
      heartbeatStmt.run(agentId, Date.now(), task.id);

      return {
        success: true,
        taskId: task.id,
        description: task.description
      } as ClaimResult;
    });

    const result = claimTransaction.immediate();

    // Write summary after successful claim
    if (result.success && currentCwd) {
      writeSwarmSummary(currentCwd);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      taskId: null,
      reason: `Claim failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Release a claimed task back to the pending pool
 *
 * Used when an agent fails to complete a task or wants to give it up.
 *
 * @param agentId - Agent releasing the task
 * @param taskId - Task to release
 * @returns true if release was successful
 */
export function releaseTask(agentId: string, taskId: string): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    const releaseTransaction = db.transaction(() => {
      // Verify the agent owns this task
      const verifyStmt = db.prepare(`
        SELECT claimed_by FROM tasks WHERE id = ?
      `);
      const task = verifyStmt.get(taskId) as { claimed_by: string | null } | undefined;

      if (!task || task.claimed_by !== agentId) {
        return false;
      }

      // Release the task
      const releaseStmt = db.prepare(`
        UPDATE tasks
        SET status = 'pending', claimed_by = NULL, claimed_at = NULL
        WHERE id = ? AND claimed_by = ?
      `);
      releaseStmt.run(taskId, agentId);

      // Update heartbeat to show no current task
      const heartbeatStmt = db.prepare(`
        UPDATE heartbeats SET current_task_id = NULL WHERE agent_id = ?
      `);
      heartbeatStmt.run(agentId);

      return true;
    });

    return releaseTransaction.immediate();
  } catch (error) {
    console.error('Failed to release task:', error);
    return false;
  }
}

/**
 * Mark a task as completed
 *
 * @param agentId - Agent that completed the task
 * @param taskId - Completed task ID
 * @param result - Optional result/output from the task
 * @returns true if completion was recorded
 */
export function completeTask(agentId: string, taskId: string, result?: string): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    const completeTransaction = db.transaction(() => {
      // Verify the agent owns this task
      const verifyStmt = db.prepare(`
        SELECT claimed_by FROM tasks WHERE id = ?
      `);
      const task = verifyStmt.get(taskId) as { claimed_by: string | null } | undefined;

      if (!task || task.claimed_by !== agentId) {
        return false;
      }

      // Mark task as done
      const completeStmt = db.prepare(`
        UPDATE tasks
        SET status = 'done', completed_at = ?, result = ?
        WHERE id = ? AND claimed_by = ?
      `);
      completeStmt.run(Date.now(), result ?? null, taskId, agentId);

      // Update heartbeat to show no current task
      const heartbeatStmt = db.prepare(`
        UPDATE heartbeats SET current_task_id = NULL WHERE agent_id = ?
      `);
      heartbeatStmt.run(agentId);

      return true;
    });

    const result = completeTransaction.immediate();

    // Write summary after completion
    if (result && currentCwd) {
      writeSwarmSummary(currentCwd);
    }

    return result;
  } catch (error) {
    console.error('Failed to complete task:', error);
    return false;
  }
}

/**
 * Mark a task as failed
 *
 * @param agentId - Agent that failed the task
 * @param taskId - Failed task ID
 * @param error - Error message/reason for failure
 * @returns true if failure was recorded
 */
export function failTask(agentId: string, taskId: string, error: string): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    const failTransaction = db.transaction(() => {
      // Verify the agent owns this task
      const verifyStmt = db.prepare(`
        SELECT claimed_by FROM tasks WHERE id = ?
      `);
      const task = verifyStmt.get(taskId) as { claimed_by: string | null } | undefined;

      if (!task || task.claimed_by !== agentId) {
        return false;
      }

      // Mark task as failed
      const failStmt = db.prepare(`
        UPDATE tasks
        SET status = 'failed', completed_at = ?, error = ?
        WHERE id = ? AND claimed_by = ?
      `);
      failStmt.run(Date.now(), error, taskId, agentId);

      // Update heartbeat to show no current task
      const heartbeatStmt = db.prepare(`
        UPDATE heartbeats SET current_task_id = NULL WHERE agent_id = ?
      `);
      heartbeatStmt.run(agentId);

      return true;
    });

    return failTransaction.immediate();
  } catch (error) {
    console.error('Failed to fail task:', error);
    return false;
  }
}

/**
 * Record agent heartbeat
 *
 * Agents should call this every 60 seconds to indicate they're still alive.
 * Used by cleanupStaleClaims to detect dead agents.
 *
 * @param agentId - Agent sending heartbeat
 * @returns true if heartbeat was recorded
 */
export function heartbeat(agentId: string): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    // Get current task for this agent
    const taskStmt = db.prepare(`
      SELECT id FROM tasks WHERE claimed_by = ? AND status = 'claimed'
    `);
    const task = taskStmt.get(agentId) as { id: string } | undefined;

    return recordHeartbeat(agentId, task?.id ?? null);
  } catch (error) {
    console.error('Failed to record heartbeat:', error);
    return false;
  }
}

/**
 * Clean up stale claims from dead agents
 *
 * Releases tasks that have been claimed for longer than the lease timeout
 * (default 5 minutes) by agents that haven't sent a heartbeat.
 *
 * @param leaseTimeout - Lease timeout in milliseconds (default: 5 minutes)
 * @returns Number of tasks released
 */
export function cleanupStaleClaims(leaseTimeout: number = DEFAULT_SWARM_CONFIG.leaseTimeout): number {
  const db = getDb();
  if (!db) return 0;

  try {
    const cutoffTime = Date.now() - leaseTimeout;

    const cleanupTransaction = db.transaction(() => {
      // Find tasks claimed longer than the timeout
      // Only release if the agent hasn't sent a heartbeat recently
      const findStaleStmt = db.prepare(`
        SELECT t.id, t.claimed_by
        FROM tasks t
        LEFT JOIN heartbeats h ON t.claimed_by = h.agent_id
        WHERE t.status = 'claimed'
          AND t.claimed_at < ?
          AND (h.last_heartbeat IS NULL OR h.last_heartbeat < ?)
      `);
      const staleTasks = findStaleStmt.all(cutoffTime, cutoffTime) as Array<{
        id: string;
        claimed_by: string | null;
      }>;

      if (staleTasks.length === 0) {
        return 0;
      }

      // Release stale tasks
      const releaseStmt = db.prepare(`
        UPDATE tasks
        SET status = 'pending', claimed_by = NULL, claimed_at = NULL
        WHERE id = ?
      `);

      // Remove stale heartbeats
      const removeHeartbeatStmt = db.prepare(`
        DELETE FROM heartbeats WHERE agent_id = ?
      `);

      const staleAgents = new Set<string>();
      for (const task of staleTasks) {
        releaseStmt.run(task.id);
        if (task.claimed_by) {
          staleAgents.add(task.claimed_by);
        }
      }

      for (const agentId of staleAgents) {
        removeHeartbeatStmt.run(agentId);
      }

      return staleTasks.length;
    });

    return cleanupTransaction.immediate();
  } catch (error) {
    console.error('Failed to cleanup stale claims:', error);
    return 0;
  }
}

/**
 * Get tasks claimed by a specific agent
 *
 * @param agentId - Agent to query
 * @returns Array of tasks claimed by the agent
 */
export function getTasksClaimedBy(agentId: string): SwarmTask[] {
  const db = getDb();
  if (!db) return [];

  try {
    const stmt = db.prepare(`
      SELECT * FROM tasks WHERE claimed_by = ? AND status = 'claimed'
    `);
    const rows = stmt.all(agentId) as Array<{
      id: string;
      description: string;
      status: string;
      claimed_by: string | null;
      claimed_at: number | null;
      completed_at: number | null;
      error: string | null;
      result: string | null;
    }>;

    return rows.map(row => ({
      id: row.id,
      description: row.description,
      status: row.status as SwarmTask['status'],
      claimedBy: row.claimed_by,
      claimedAt: row.claimed_at,
      completedAt: row.completed_at,
      error: row.error ?? undefined,
      result: row.result ?? undefined
    }));
  } catch (error) {
    console.error('Failed to get tasks claimed by agent:', error);
    return [];
  }
}

/**
 * Check if there are any pending tasks
 *
 * @returns true if there are pending tasks
 */
export function hasPendingTasks(): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'
    `);
    const result = stmt.get() as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Failed to check pending tasks:', error);
    return false;
  }
}

/**
 * Check if all tasks are complete (done or failed)
 *
 * @returns true if all tasks are complete
 */
export function allTasksComplete(): boolean {
  const db = getDb();
  if (!db) return false;

  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM tasks WHERE status IN ('pending', 'claimed')
    `);
    const result = stmt.get() as { count: number };
    return result.count === 0;
  } catch (error) {
    console.error('Failed to check if all tasks complete:', error);
    return false;
  }
}

/**
 * Get the number of active agents (with recent heartbeats)
 *
 * @param heartbeatTimeout - How old a heartbeat can be to still be considered active
 * @returns Number of active agents
 */
export function getActiveAgentCount(heartbeatTimeout: number = DEFAULT_SWARM_CONFIG.leaseTimeout): number {
  const db = getDb();
  if (!db) return 0;

  try {
    const cutoffTime = Date.now() - heartbeatTimeout;
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM heartbeats WHERE last_heartbeat > ?
    `);
    const result = stmt.get(cutoffTime) as { count: number };
    return result.count;
  } catch (error) {
    console.error('Failed to get active agent count:', error);
    return 0;
  }
}

/**
 * Attempt to reclaim a failed task
 *
 * @param agentId - Agent attempting to reclaim
 * @param taskId - Task to reclaim
 * @returns ClaimResult
 */
export function reclaimFailedTask(agentId: string, taskId: string): ClaimResult {
  const db = getDb();
  if (!db) {
    return {
      success: false,
      taskId: null,
      reason: 'Database not initialized'
    };
  }

  try {
    const reclaimTransaction = db.transaction(() => {
      // Check if task is failed
      const checkStmt = db.prepare(`
        SELECT id, description, status FROM tasks WHERE id = ?
      `);
      const task = checkStmt.get(taskId) as { id: string; description: string; status: string } | undefined;

      if (!task) {
        return {
          success: false,
          taskId: null,
          reason: 'Task not found'
        } as ClaimResult;
      }

      if (task.status !== 'failed') {
        return {
          success: false,
          taskId: null,
          reason: `Task is ${task.status}, not failed`
        } as ClaimResult;
      }

      // Reclaim the task
      const reclaimStmt = db.prepare(`
        UPDATE tasks
        SET status = 'claimed', claimed_by = ?, claimed_at = ?, error = NULL
        WHERE id = ?
      `);
      reclaimStmt.run(agentId, Date.now(), taskId);

      // Update heartbeat
      const heartbeatStmt = db.prepare(`
        INSERT OR REPLACE INTO heartbeats (agent_id, last_heartbeat, current_task_id)
        VALUES (?, ?, ?)
      `);
      heartbeatStmt.run(agentId, Date.now(), taskId);

      return {
        success: true,
        taskId: task.id,
        description: task.description
      } as ClaimResult;
    });

    return reclaimTransaction.immediate();
  } catch (error) {
    return {
      success: false,
      taskId: null,
      reason: `Reclaim failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
