/**
 * Team Registry
 *
 * Team CRUD, member management, heartbeat, and spawn graph.
 * State is persisted as JSON files under a configurable base directory.
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  Team,
  TeamConfig,
  TeamStatus,
  TeamMember,
  MemberStatus,
  SpawnGraph,
  SpawnEdge,
} from './types.js';
import { DEFAULT_TEAM_CONFIG } from './types.js';

// ---------------------------------------------------------------------------
// Base directory — overridable for testing
// ---------------------------------------------------------------------------

let baseDir = path.join('.omd', 'state', 'team');

export function setBaseDir(dir: string): void {
  baseDir = dir;
}

export function getBaseDir(): string {
  return baseDir;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function teamPath(name: string): string {
  return path.join(baseDir, `${name}.json`);
}

function spawnGraphPath(name: string): string {
  return path.join(baseDir, name, 'spawn-graph.json');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJson<T>(filePath: string): T | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return undefined;
  }
}

function writeJson<T>(filePath: string, data: T): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function now(): string {
  return new Date().toISOString();
}

function saveTeam(team: Team): void {
  team.updatedAt = now();
  writeJson(teamPath(team.name), team);
}

// ---------------------------------------------------------------------------
// Team name validation
// ---------------------------------------------------------------------------

function validateTeamName(name: string): void {
  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`Invalid team name "${name}": must be non-empty, alphanumeric with hyphens/underscores only`);
  }
}

// ---------------------------------------------------------------------------
// Team lifecycle
// ---------------------------------------------------------------------------

export function createTeam(
  name: string,
  leaderId: string,
  config?: Partial<TeamConfig>,
): Team {
  validateTeamName(name);
  if (getTeam(name)) {
    throw new Error(`Team "${name}" already exists`);
  }
  const team: Team = {
    name,
    leader: leaderId,
    members: [],
    status: 'active',
    createdAt: now(),
    updatedAt: now(),
    config: { ...DEFAULT_TEAM_CONFIG, ...config },
  };
  writeJson(teamPath(name), team);
  return team;
}

export function getTeam(name: string): Team | undefined {
  return readJson<Team>(teamPath(name));
}

export function deleteTeam(name: string): boolean {
  const fp = teamPath(name);
  if (!fs.existsSync(fp)) return false;
  fs.unlinkSync(fp);
  // Also remove spawn-graph and team subdirectory if present
  const teamDir = path.join(baseDir, name);
  if (fs.existsSync(teamDir)) {
    fs.rmSync(teamDir, { recursive: true, force: true });
  }
  return true;
}

export function listTeams(): string[] {
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.slice(0, -5));
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

export function updateTeamStatus(name: string, status: TeamStatus): boolean {
  const team = getTeam(name);
  if (!team) return false;
  team.status = status;
  saveTeam(team);
  return true;
}

// ---------------------------------------------------------------------------
// Member management
// ---------------------------------------------------------------------------

function resolveUniqueName(team: Team, baseName: string): string {
  const existing = new Set(team.members.map((m) => m.name));
  if (!existing.has(baseName)) return baseName;
  // Strip trailing number if present, then increment
  const match = baseName.match(/^(.+)-(\d+)$/);
  const prefix = match ? match[1] : baseName;
  let n = match ? parseInt(match[2], 10) + 1 : 2;
  while (existing.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

export function addMember(
  teamName: string,
  member: Omit<TeamMember, 'status' | 'lastHeartbeat'>,
): TeamMember {
  const team = getTeam(teamName);
  if (!team) throw new Error(`Team "${teamName}" not found`);
  if (team.members.length >= team.config.maxMembers) {
    throw new Error(`Team "${teamName}" has reached maxMembers limit (${team.config.maxMembers})`);
  }

  const uniqueName = resolveUniqueName(team, member.name);
  const newMember: TeamMember = {
    ...member,
    name: uniqueName,
    status: 'pending',
  };
  team.members.push(newMember);
  saveTeam(team);
  return newMember;
}

export function removeMember(teamName: string, memberName: string): boolean {
  const team = getTeam(teamName);
  if (!team) return false;
  const before = team.members.length;
  team.members = team.members.filter((m) => m.name !== memberName);
  if (team.members.length === before) return false;
  saveTeam(team);
  return true;
}

export function updateMemberStatus(
  teamName: string,
  memberName: string,
  status: MemberStatus,
  currentTask?: string,
): boolean {
  const team = getTeam(teamName);
  if (!team) return false;
  const member = team.members.find((m) => m.name === memberName);
  if (!member) return false;
  member.status = status;
  if (currentTask !== undefined) member.currentTask = currentTask;
  saveTeam(team);
  return true;
}

export function getMember(teamName: string, memberName: string): TeamMember | undefined {
  const team = getTeam(teamName);
  if (!team) return undefined;
  return team.members.find((m) => m.name === memberName);
}

// ---------------------------------------------------------------------------
// Heartbeat
// ---------------------------------------------------------------------------

export function heartbeat(teamName: string, memberName: string): boolean {
  const team = getTeam(teamName);
  if (!team) return false;
  const member = team.members.find((m) => m.name === memberName);
  if (!member) return false;
  member.lastHeartbeat = now();
  saveTeam(team);
  return true;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function getActiveMembers(teamName: string): TeamMember[] {
  const team = getTeam(teamName);
  if (!team) return [];
  return team.members.filter((m) => m.status === 'running' || m.status === 'idle');
}

export function getStaleMembers(teamName: string, thresholdMs: number): TeamMember[] {
  const team = getTeam(teamName);
  if (!team) return [];
  const cutoff = Date.now() - thresholdMs;
  return team.members.filter((m) => {
    if (m.status !== 'running' && m.status !== 'idle') return false;
    if (!m.lastHeartbeat) return true; // Never heartbeated = stale
    return new Date(m.lastHeartbeat).getTime() < cutoff;
  });
}

// ---------------------------------------------------------------------------
// Spawn graph
// ---------------------------------------------------------------------------

function readSpawnGraph(teamName: string): SpawnGraph {
  const existing = readJson<SpawnGraph>(spawnGraphPath(teamName));
  return existing ?? { teamName, edges: [] };
}

function writeSpawnGraph(teamName: string, graph: SpawnGraph): void {
  writeJson(spawnGraphPath(teamName), graph);
}

export function addSpawnEdge(teamName: string, parentName: string, childName: string): void {
  const graph = readSpawnGraph(teamName);
  graph.edges.push({
    parentName,
    childName,
    status: 'open',
    spawnedAt: now(),
  });
  writeSpawnGraph(teamName, graph);
}

export function closeSpawnEdge(teamName: string, childName: string): void {
  const graph = readSpawnGraph(teamName);
  const edge = graph.edges.find((e) => e.childName === childName && e.status === 'open');
  if (edge) {
    edge.status = 'closed';
    writeSpawnGraph(teamName, graph);
  }
}

export function getSpawnGraph(teamName: string): SpawnGraph {
  return readSpawnGraph(teamName);
}

export function getOpenChildren(teamName: string, parentName: string): string[] {
  const graph = readSpawnGraph(teamName);
  return graph.edges
    .filter((e) => e.parentName === parentName && e.status === 'open')
    .map((e) => e.childName);
}
