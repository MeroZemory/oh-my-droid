/**
 * Team Orchestrator
 *
 * 5-phase leader lifecycle: INIT → DELEGATE → COORDINATE → COLLECT → FINALIZE.
 * Ties registry, mailbox, and shared context together.
 * Does NOT spawn agents — only prepares data structures and assignments.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  TeamConfig,
  TeamMember,
  OrchestratorState,
  OrchestratorPhase,
  TaskAssignment,
  Message,
} from './types.js';
import {
  createTeam,
  getTeam,
  addMember,
  updateMemberStatus,
  getActiveMembers,
  getStaleMembers,
  addSpawnEdge,
  closeSpawnEdge,
  getSpawnGraph,
  updateTeamStatus,
  deleteTeam,
} from './registry.js';
import {
  sendMessage,
  readUnreadMessages,
  broadcastMessage,
  clearMailbox,
} from './mailbox.js';
import { addContextEntry, clearContext } from './context.js';

// ---------------------------------------------------------------------------
// Base directory
// ---------------------------------------------------------------------------

let baseDir = path.join('.omd', 'state', 'team');

export function setBaseDir(dir: string): void {
  baseDir = dir;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function statePath(teamName: string): string {
  return path.join(baseDir, teamName, 'orchestrator.json');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function now(): string {
  return new Date().toISOString();
}

function readOrcState(teamName: string): OrchestratorState | undefined {
  const fp = statePath(teamName);
  if (!fs.existsSync(fp)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as OrchestratorState;
  } catch {
    return undefined;
  }
}

function writeOrcState(teamName: string, state: OrchestratorState): void {
  const fp = statePath(teamName);
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(state, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export function initTeam(options: {
  name: string;
  taskDescription: string;
  roles: Array<{ role: string; count?: number }>;
  config?: Partial<TeamConfig>;
}): OrchestratorState {
  const { name, taskDescription, roles, config } = options;

  // Create team in registry
  const team = createTeam(name, 'leader', config);

  // Generate members from roles
  for (const { role, count = 1 } of roles) {
    for (let i = 0; i < count; i++) {
      const memberName = count > 1 || i > 0 ? `${role}-${i + 1}` : `${role}-1`;
      const member = addMember(name, { id: `task-${role}-${i}`, name: memberName, role });
      addSpawnEdge(name, 'leader', member.name);
    }
  }

  // Create orchestrator state
  const state: OrchestratorState = {
    teamName: name,
    phase: 'init',
    taskDescription,
    startedAt: now(),
    assignments: [],
  };
  writeOrcState(name, state);

  // Advance to delegate
  state.phase = 'delegate';
  writeOrcState(name, state);

  return state;
}

export function delegateWork(
  teamName: string,
  assignments: Array<{ memberName: string; description: string; files?: string[] }>,
): void {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);

  // Validate no file ownership overlap
  const allFiles = new Map<string, string>(); // file → memberName
  for (const a of assignments) {
    for (const f of a.files ?? []) {
      const existing = allFiles.get(f);
      if (existing) {
        throw new Error(`File ownership conflict: "${f}" assigned to both "${existing}" and "${a.memberName}"`);
      }
      allFiles.set(f, a.memberName);
    }
  }

  // Record assignments
  state.assignments = assignments.map((a) => ({
    memberName: a.memberName,
    description: a.description,
    status: 'pending' as const,
    files: a.files,
  }));

  // Send task messages and update member status
  for (const a of assignments) {
    sendMessage(teamName, {
      from: 'leader',
      to: a.memberName,
      type: 'task',
      payload: { kind: 'task_assignment', description: a.description, files: a.files },
    });
    updateMemberStatus(teamName, a.memberName, 'running', a.description);
    // Update assignment status
    const assignment = state.assignments.find((sa) => sa.memberName === a.memberName);
    if (assignment) assignment.status = 'in_progress';
  }

  state.phase = 'coordinate';
  writeOrcState(teamName, state);
}

export function pollTeamStatus(teamName: string): {
  phase: OrchestratorPhase;
  members: TeamMember[];
  pendingMessages: Message[];
  staleMembers: TeamMember[];
} {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);

  const team = getTeam(teamName);
  const members = team?.members ?? [];
  const pendingMessages = readUnreadMessages(teamName, 'leader');
  const staleMembers = getStaleMembers(teamName, 300_000); // 5min default

  return {
    phase: state.phase,
    members,
    pendingMessages,
    staleMembers,
  };
}

export function collectResults(teamName: string): {
  completed: TaskAssignment[];
  failed: TaskAssignment[];
  pending: TaskAssignment[];
} {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);

  const completed = state.assignments.filter((a) => a.status === 'completed');
  const failed = state.assignments.filter((a) => a.status === 'failed');
  const pending = state.assignments.filter((a) => a.status === 'pending' || a.status === 'in_progress');

  // Advance phase if all resolved
  if (pending.length === 0 && state.phase === 'coordinate') {
    state.phase = 'collect';
    writeOrcState(teamName, state);
  }

  return { completed, failed, pending };
}

export function finalizeTeam(teamName: string): {
  success: boolean;
  summary: string;
} {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);

  const completed = state.assignments.filter((a) => a.status === 'completed');
  const failed = state.assignments.filter((a) => a.status === 'failed');
  const success = failed.length === 0 && completed.length > 0;

  // Broadcast shutdown
  broadcastMessage(teamName, 'leader', 'shutdown_request', { kind: 'shutdown_request', reason: 'team finalized' });

  // Close all spawn edges (children before parents — all are direct children of leader)
  const graph = getSpawnGraph(teamName);
  for (const edge of graph.edges) {
    if (edge.status === 'open') {
      closeSpawnEdge(teamName, edge.childName);
    }
  }

  // Update team status
  updateTeamStatus(teamName, success ? 'completed' : 'failed');

  // Write summary to context
  const summary = `Team "${teamName}": ${completed.length} completed, ${failed.length} failed.`;
  addContextEntry(teamName, { author: 'leader', content: summary, category: 'decision' });

  // Advance phase
  state.phase = 'finalize';
  writeOrcState(teamName, state);

  return { success, summary };
}

// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------

export function getOrchestratorState(teamName: string): OrchestratorState | undefined {
  return readOrcState(teamName);
}

const VALID_TRANSITIONS: Record<OrchestratorPhase, OrchestratorPhase[]> = {
  init: ['delegate'],
  delegate: ['coordinate'],
  coordinate: ['collect', 'finalize'],
  collect: ['finalize'],
  finalize: [],
};

export function advancePhase(teamName: string, phase: OrchestratorPhase): void {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);
  const allowed = VALID_TRANSITIONS[state.phase];
  if (!allowed.includes(phase)) {
    throw new Error(`Invalid phase transition: "${state.phase}" → "${phase}"`);
  }
  state.phase = phase;
  writeOrcState(teamName, state);
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

export function handleMemberFailure(
  teamName: string,
  memberName: string,
  error: string,
): { action: 'reassign' | 'skip' | 'abort'; reassignedTo?: string } {
  const state = readOrcState(teamName);
  if (!state) throw new Error(`Orchestrator state not found for "${teamName}"`);

  // Mark assignment as failed
  const assignment = state.assignments.find((a) => a.memberName === memberName);
  if (assignment) {
    assignment.status = 'failed';
    assignment.result = error;
  }
  updateMemberStatus(teamName, memberName, 'failed', error);

  // Find an idle member with the same role
  const failedMember = getTeam(teamName)?.members.find((m) => m.name === memberName);
  if (!failedMember) {
    writeOrcState(teamName, state);
    return { action: 'skip' };
  }

  const idle = getActiveMembers(teamName).find(
    (m) => m.role === failedMember.role && m.status === 'idle',
  );

  if (idle && assignment) {
    // Reassign
    const newAssignment: TaskAssignment = {
      memberName: idle.name,
      description: assignment.description,
      status: 'in_progress',
      files: assignment.files,
    };
    state.assignments.push(newAssignment);
    sendMessage(teamName, {
      from: 'leader',
      to: idle.name,
      type: 'task',
      payload: { kind: 'task_assignment', description: assignment.description, files: assignment.files },
    });
    updateMemberStatus(teamName, idle.name, 'running', assignment.description);
    writeOrcState(teamName, state);
    return { action: 'reassign', reassignedTo: idle.name };
  }

  // Critical role check — if architect fails with no replacement, abort
  if (failedMember.role === 'architect') {
    updateTeamStatus(teamName, 'failed');
    state.phase = 'finalize';
    writeOrcState(teamName, state);
    return { action: 'abort' };
  }

  writeOrcState(teamName, state);
  return { action: 'skip' };
}

// ---------------------------------------------------------------------------
// Permission broker
// ---------------------------------------------------------------------------

export function handlePermissionRequest(
  teamName: string,
  request: { memberName: string; requestId: string; tool: string; args: unknown },
): { approved: boolean; reason?: string } {
  // Default policy: approve read-only tools, reject destructive ones
  const readOnlyTools = new Set(['Read', 'Glob', 'Grep', 'LSP']);
  const approved = readOnlyTools.has(request.tool);
  const reason = approved ? undefined : `Tool "${request.tool}" requires leader approval`;

  // Send response back
  sendMessage(teamName, {
    from: 'leader',
    to: request.memberName,
    type: 'permission_response',
    payload: { kind: 'permission_response', requestId: request.requestId, approved, reason },
  });

  return { approved, reason };
}

// ---------------------------------------------------------------------------
// Completion notification
// ---------------------------------------------------------------------------

export function notifyMemberComplete(
  teamName: string,
  memberName: string,
  result: { summary: string; filesModified: string[]; success: boolean },
): void {
  const state = readOrcState(teamName);
  if (!state) return;

  // Update assignment
  const assignment = state.assignments.find(
    (a) => a.memberName === memberName && (a.status === 'in_progress' || a.status === 'pending'),
  );
  if (assignment) {
    assignment.status = result.success ? 'completed' : 'failed';
    assignment.result = result.summary;
  }

  // Update member status
  updateMemberStatus(teamName, memberName, result.success ? 'completed' : 'failed', result.summary);

  // Send result message to leader
  sendMessage(teamName, {
    from: memberName,
    to: 'leader',
    type: 'result',
    payload: { kind: 'task_result', summary: result.summary, filesModified: result.filesModified },
  });

  // Record in context
  addContextEntry(teamName, {
    author: memberName,
    content: result.summary,
    category: 'finding',
  });

  writeOrcState(teamName, state);
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function cleanupTeam(teamName: string): void {
  // Broadcast shutdown
  broadcastMessage(teamName, 'leader', 'shutdown_request', { kind: 'shutdown_request', reason: 'cleanup' });

  // Close all spawn edges
  const graph = getSpawnGraph(teamName);
  for (const edge of graph.edges) {
    if (edge.status === 'open') {
      closeSpawnEdge(teamName, edge.childName);
    }
  }

  // Clear all state
  clearMailbox(teamName);
  clearContext(teamName);
  deleteTeam(teamName);

  // Remove orchestrator state
  const fp = statePath(teamName);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);

  // Remove team subdirectory if empty
  const teamDir = path.join(baseDir, teamName);
  if (fs.existsSync(teamDir)) {
    fs.rmSync(teamDir, { recursive: true, force: true });
  }
}
