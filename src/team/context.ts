/**
 * Shared Context
 *
 * Team-wide knowledge store (decisions, findings, constraints, risks),
 * artifact storage, and per-member durable transcripts.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { SharedContext, ContextEntry, TranscriptRef } from './types.js';

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

function teamDir(teamName: string): string {
  return path.join(baseDir, teamName);
}

function contextPath(teamName: string): string {
  return path.join(teamDir(teamName), 'context.json');
}

function artifactsDir(teamName: string): string {
  return path.join(teamDir(teamName), 'artifacts');
}

function transcriptsDir(teamName: string): string {
  return path.join(teamDir(teamName), 'transcripts');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function now(): string {
  return new Date().toISOString();
}

function sanitizeName(name: string): string {
  // Strip path separators and traversal sequences, keep only safe chars
  const stripped = name.replace(/[^a-zA-Z0-9._-]/g, '');
  // Remove leading dots to prevent hidden files and .. traversal remnants
  return stripped.replace(/^\.+/, '');
}

function readContextFile(teamName: string): SharedContext {
  const fp = contextPath(teamName);
  if (!fs.existsSync(fp)) {
    return { teamName, entries: [], updatedAt: now() };
  }
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as SharedContext;
  } catch {
    return { teamName, entries: [], updatedAt: now() };
  }
}

function writeContextFile(teamName: string, ctx: SharedContext): void {
  const fp = contextPath(teamName);
  ensureDir(path.dirname(fp));
  ctx.updatedAt = now();
  fs.writeFileSync(fp, JSON.stringify(ctx, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Context entries
// ---------------------------------------------------------------------------

export function addContextEntry(
  teamName: string,
  entry: Omit<ContextEntry, 'timestamp'>,
): void {
  const ctx = readContextFile(teamName);
  ctx.entries.push({ ...entry, timestamp: now() });
  writeContextFile(teamName, ctx);
}

export function getContext(teamName: string): SharedContext {
  return readContextFile(teamName);
}

export function getContextAsMarkdown(teamName: string): string {
  const ctx = readContextFile(teamName);

  const categories: Array<{ key: ContextEntry['category']; label: string }> = [
    { key: 'decision', label: 'Decisions' },
    { key: 'finding', label: 'Findings' },
    { key: 'constraint', label: 'Constraints' },
    { key: 'risk', label: 'Risks' },
  ];

  const lines: string[] = [`## Team Context: ${teamName}`];

  for (const { key, label } of categories) {
    const entries = ctx.entries.filter((e) => e.category === key);
    if (entries.length === 0) continue;
    lines.push('');
    lines.push(`### ${label}`);
    for (const e of entries) {
      lines.push(`- [${e.author}] ${e.content}`);
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Artifacts
// ---------------------------------------------------------------------------

export function writeArtifact(teamName: string, name: string, content: string): string {
  const safe = sanitizeName(name);
  if (!safe) throw new Error('Invalid artifact name');
  const dir = artifactsDir(teamName);
  ensureDir(dir);
  const fp = path.join(dir, safe);
  fs.writeFileSync(fp, content, 'utf-8');
  return fp;
}

export function readArtifact(teamName: string, name: string): string | undefined {
  const safe = sanitizeName(name);
  const fp = path.join(artifactsDir(teamName), safe);
  if (!fs.existsSync(fp)) return undefined;
  return fs.readFileSync(fp, 'utf-8');
}

export function listArtifacts(teamName: string): string[] {
  const dir = artifactsDir(teamName);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

// ---------------------------------------------------------------------------
// Per-member transcripts
// ---------------------------------------------------------------------------

export function appendTranscript(teamName: string, memberName: string, entry: string): void {
  const dir = transcriptsDir(teamName);
  ensureDir(dir);
  const fp = path.join(dir, `${sanitizeName(memberName)}.log`);
  fs.appendFileSync(fp, entry + '\n', 'utf-8');
}

export function getTranscriptPath(teamName: string, memberName: string): string {
  return path.join(transcriptsDir(teamName), `${sanitizeName(memberName)}.log`);
}

export function listTranscripts(teamName: string): TranscriptRef[] {
  const dir = transcriptsDir(teamName);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.log'))
    .map((f) => {
      const fp = path.join(dir, f);
      const stats = fs.statSync(fp);
      return {
        memberName: f.slice(0, -4), // strip .log
        path: fp,
        startedAt: stats.birthtime.toISOString(),
      };
    });
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export function clearContext(teamName: string): void {
  const dir = teamDir(teamName);
  // Remove context.json
  const ctxFp = contextPath(teamName);
  if (fs.existsSync(ctxFp)) fs.unlinkSync(ctxFp);
  // Remove artifacts directory
  const artDir = artifactsDir(teamName);
  if (fs.existsSync(artDir)) fs.rmSync(artDir, { recursive: true, force: true });
  // Remove transcripts directory
  const txDir = transcriptsDir(teamName);
  if (fs.existsSync(txDir)) fs.rmSync(txDir, { recursive: true, force: true });
}
