/**
 * Team Hook
 *
 * Bridges the team orchestrator to the Factory Droid runtime.
 * Handles agent spawning parameters, member completion, heartbeat
 * checking, and prompt injection.
 *
 * Does NOT call the Agent tool directly — returns spawn parameters
 * that the caller (skill or bridge) uses to spawn agents.
 */

import type {
  TeamMember,
  OrchestratorState,
  TaskAssignment,
  MemberToolPolicy,
} from '../../team/types.js';
import {
  getTeam,
  getStaleMembers,
} from '../../team/registry.js';
import {
  getOrchestratorState,
  notifyMemberComplete,
  handlePermissionRequest as orcHandlePermission,
} from '../../team/orchestrator.js';
import { getContextAsMarkdown } from '../../team/context.js';
import { readUnreadMessages } from '../../team/mailbox.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SpawnParams {
  memberName: string;
  role: string;
  prompt: string;
  subagentType: string;
  runInBackground: boolean;
  model?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
}

export interface SpawnResult {
  memberName: string;
  params: SpawnParams;
}

export interface StaleCheckResult {
  staleMembers: TeamMember[];
  totalActive: number;
}

export interface CompletionNotification {
  type: 'task-notification';
  taskId: string;
  memberName: string;
  status: 'completed' | 'failed';
  summary: string;
  filesModified: string[];
}

export interface TeamHookEvent {
  type: 'user_prompt_submit' | 'post_tool_use' | 'pre_compact';
  teamName?: string;
  memberName?: string;
  toolName?: string;
  toolOutput?: string;
  prompt?: string;
}

export interface TeamHookResult {
  handled: boolean;
  message?: string;
  spawnResults?: SpawnResult[];
  notification?: CompletionNotification;
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

function buildMemberPrompt(
  teamName: string,
  memberName: string,
  role: string,
  assignment: TaskAssignment | undefined,
): string {
  const contextMd = getContextAsMarkdown(teamName);
  const fileList = assignment?.files?.join(', ') || 'none specified';
  const desc = assignment?.description || 'Awaiting assignment';

  return `You are ${memberName}, a ${role} agent working as part of team "${teamName}".

## Your Assignment
${desc}

## File Ownership
You are responsible for: ${fileList}
Do NOT modify files outside your ownership.

## Team Context
${contextMd}

## Communication
When you complete your task, output your results clearly.
If you have questions or findings, state them explicitly.
When you need permission for destructive operations, request it explicitly.`;
}

// ---------------------------------------------------------------------------
// Agent spawning parameters
// ---------------------------------------------------------------------------

export function buildSpawnParams(teamName: string): SpawnResult[] {
  const state = getOrchestratorState(teamName);
  if (!state) return [];

  const team = getTeam(teamName);
  if (!team) return [];

  const results: SpawnResult[] = [];

  for (const assignment of state.assignments) {
    const member = team.members.find((m) => m.name === assignment.memberName);
    if (!member) continue;

    const prompt = buildMemberPrompt(teamName, member.name, member.role, assignment);
    const policy: MemberToolPolicy = member.toolPolicy ?? {};

    const params: SpawnParams = {
      memberName: member.name,
      role: member.role,
      prompt,
      subagentType: member.role,
      runInBackground: true,
      model: policy.model,
      allowedTools: policy.allowedTools,
      disallowedTools: policy.disallowedTools,
    };

    results.push({ memberName: member.name, params });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Member completion handler
// ---------------------------------------------------------------------------

export function handleMemberCompletion(
  teamName: string,
  memberName: string,
  result: string,
  filesModified: string[] = [],
  success: boolean = true,
): CompletionNotification {
  const member = getTeam(teamName)?.members.find((m) => m.name === memberName);

  notifyMemberComplete(teamName, memberName, {
    summary: result,
    filesModified,
    success,
  });

  return {
    type: 'task-notification',
    taskId: member?.id ?? memberName,
    memberName,
    status: success ? 'completed' : 'failed',
    summary: result,
    filesModified,
  };
}

// ---------------------------------------------------------------------------
// Heartbeat checker
// ---------------------------------------------------------------------------

export function checkHeartbeats(teamName: string, thresholdMs: number = 300_000): StaleCheckResult {
  const team = getTeam(teamName);
  if (!team) return { staleMembers: [], totalActive: 0 };

  const staleMembers = getStaleMembers(teamName, thresholdMs);
  const totalActive = team.members.filter(
    (m) => m.status === 'running' || m.status === 'idle',
  ).length;

  return { staleMembers, totalActive };
}

// ---------------------------------------------------------------------------
// Shutdown handler
// ---------------------------------------------------------------------------

export async function shutdownTeam(teamName: string): Promise<void> {
  const { cleanupTeam } = await import('../../team/orchestrator.js');
  cleanupTeam(teamName);
}

// ---------------------------------------------------------------------------
// Main hook entry point
// ---------------------------------------------------------------------------

export function processTeamHook(event: TeamHookEvent): TeamHookResult {
  const { type, teamName } = event;

  // No team context — pass through
  if (!teamName) {
    return { handled: false };
  }

  const state = getOrchestratorState(teamName);
  if (!state) {
    return { handled: false };
  }

  switch (type) {
    case 'user_prompt_submit': {
      // During coordinate phase, check for pending leader messages
      if (state.phase === 'coordinate') {
        const pending = readUnreadMessages(teamName, 'leader');
        const permReqs = pending.filter((m) => m.type === 'permission_request');

        // Auto-handle permission requests
        for (const req of permReqs) {
          const payload = req.payload as any;
          if (payload?.kind === 'permission_request') {
            orcHandlePermission(teamName, {
              memberName: req.from,
              requestId: payload.requestId,
              tool: payload.tool,
              args: payload.args,
            });
          }
        }

        if (pending.length > 0) {
          return {
            handled: true,
            message: `[TEAM: ${teamName}] ${pending.length} pending message(s) from members.`,
          };
        }
      }
      return { handled: false };
    }

    case 'post_tool_use': {
      // If a member agent completed, handle the completion
      if (event.memberName && event.toolOutput) {
        const notification = handleMemberCompletion(
          teamName,
          event.memberName,
          event.toolOutput,
        );
        return { handled: true, notification };
      }
      return { handled: false };
    }

    case 'pre_compact': {
      // Nothing to do here — context is already on disk
      return { handled: false };
    }

    default:
      return { handled: false };
  }
}
