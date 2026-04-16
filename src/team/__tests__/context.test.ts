import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  setBaseDir,
  addContextEntry,
  getContext,
  getContextAsMarkdown,
  writeArtifact,
  readArtifact,
  listArtifacts,
  appendTranscript,
  getTranscriptPath,
  listTranscripts,
  clearContext,
} from '../context.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-context-test-'));
  setBaseDir(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Context entries ───────────────────────────────────────────────────────

describe('context entries', () => {
  it('adds an entry and retrieves it', () => {
    addContextEntry('t1', { author: 'architect-1', content: 'Use REST', category: 'decision' });
    const ctx = getContext('t1');
    expect(ctx.entries).toHaveLength(1);
    expect(ctx.entries[0].author).toBe('architect-1');
    expect(ctx.entries[0].content).toBe('Use REST');
    expect(ctx.entries[0].category).toBe('decision');
    expect(ctx.entries[0].timestamp).toBeDefined();
  });

  it('adds multiple entries from different authors', () => {
    addContextEntry('t1', { author: 'architect-1', content: 'Use REST', category: 'decision' });
    addContextEntry('t1', { author: 'executor-1', content: 'No index on email', category: 'finding' });
    addContextEntry('t1', { author: 'leader', content: 'Do not touch auth', category: 'constraint' });
    addContextEntry('t1', { author: 'architect-1', content: 'No sandbox in payment API', category: 'risk' });

    const ctx = getContext('t1');
    expect(ctx.entries).toHaveLength(4);
    expect(ctx.entries.map((e) => e.category)).toEqual(['decision', 'finding', 'constraint', 'risk']);
  });

  it('returns empty context for non-existent team', () => {
    const ctx = getContext('nope');
    expect(ctx.entries).toEqual([]);
  });
});

// ── Markdown generation ───────────────────────────────────────────────────

describe('getContextAsMarkdown', () => {
  it('generates grouped markdown with author attribution', () => {
    addContextEntry('t1', { author: 'architect-1', content: 'Use REST', category: 'decision' });
    addContextEntry('t1', { author: 'leader', content: 'Max 3 retries', category: 'decision' });
    addContextEntry('t1', { author: 'executor-1', content: 'No index on email', category: 'finding' });
    addContextEntry('t1', { author: 'leader', content: 'Do not touch auth', category: 'constraint' });
    addContextEntry('t1', { author: 'architect-1', content: 'Payment API no sandbox', category: 'risk' });

    const md = getContextAsMarkdown('t1');
    expect(md).toContain('## Team Context: t1');
    expect(md).toContain('### Decisions');
    expect(md).toContain('- [architect-1] Use REST');
    expect(md).toContain('- [leader] Max 3 retries');
    expect(md).toContain('### Findings');
    expect(md).toContain('- [executor-1] No index on email');
    expect(md).toContain('### Constraints');
    expect(md).toContain('- [leader] Do not touch auth');
    expect(md).toContain('### Risks');
    expect(md).toContain('- [architect-1] Payment API no sandbox');
  });

  it('omits empty categories', () => {
    addContextEntry('t1', { author: 'a', content: 'x', category: 'decision' });
    const md = getContextAsMarkdown('t1');
    expect(md).toContain('### Decisions');
    expect(md).not.toContain('### Findings');
    expect(md).not.toContain('### Constraints');
    expect(md).not.toContain('### Risks');
  });

  it('returns header only for empty context', () => {
    const md = getContextAsMarkdown('empty');
    expect(md).toBe('## Team Context: empty');
  });
});

// ── Artifacts ─────────────────────────────────────────────────────────────

describe('artifacts', () => {
  it('writes and reads an artifact', () => {
    const fp = writeArtifact('t1', 'analysis.md', '# Analysis\nLooks good.');
    expect(fs.existsSync(fp)).toBe(true);
    expect(readArtifact('t1', 'analysis.md')).toBe('# Analysis\nLooks good.');
  });

  it('returns undefined for non-existent artifact', () => {
    expect(readArtifact('t1', 'nope.md')).toBeUndefined();
  });

  it('lists artifacts', () => {
    writeArtifact('t1', 'a.md', 'aaa');
    writeArtifact('t1', 'b.txt', 'bbb');
    const list = listArtifacts('t1');
    expect(list.sort()).toEqual(['a.md', 'b.txt']);
  });

  it('returns empty list when no artifacts', () => {
    expect(listArtifacts('nope')).toEqual([]);
  });

  it('sanitizes artifact names (strips path traversal)', () => {
    const fp = writeArtifact('t1', '../../../etc/passwd', 'nope');
    expect(fp).not.toContain('..');
    // Sanitized name should be "etcpasswd"
    expect(readArtifact('t1', '../../../etc/passwd')).toBe('nope');
  });

  it('throws on empty sanitized name', () => {
    expect(() => writeArtifact('t1', '////', 'x')).toThrow('Invalid artifact name');
  });
});

// ── Transcripts ───────────────────────────────────────────────────────────

describe('transcripts', () => {
  it('appends transcript entries', () => {
    appendTranscript('t1', 'architect-1', '[10:00] Read src/api.ts');
    appendTranscript('t1', 'architect-1', '[10:01] Decided on REST');
    const fp = getTranscriptPath('t1', 'architect-1');
    const content = fs.readFileSync(fp, 'utf-8');
    expect(content).toContain('[10:00] Read src/api.ts');
    expect(content).toContain('[10:01] Decided on REST');
  });

  it('separate transcripts per member', () => {
    appendTranscript('t1', 'arch', 'arch entry');
    appendTranscript('t1', 'exec', 'exec entry');
    expect(fs.readFileSync(getTranscriptPath('t1', 'arch'), 'utf-8')).toContain('arch entry');
    expect(fs.readFileSync(getTranscriptPath('t1', 'exec'), 'utf-8')).toContain('exec entry');
  });

  it('lists transcripts', () => {
    appendTranscript('t1', 'a', 'x');
    appendTranscript('t1', 'b', 'y');
    const refs = listTranscripts('t1');
    expect(refs).toHaveLength(2);
    expect(refs.map((r) => r.memberName).sort()).toEqual(['a', 'b']);
    expect(refs[0].path).toBeDefined();
    expect(refs[0].startedAt).toBeDefined();
  });

  it('returns empty for non-existent team', () => {
    expect(listTranscripts('nope')).toEqual([]);
  });
});

// ── Cleanup ───────────────────────────────────────────────────────────────

describe('clearContext', () => {
  it('removes context, artifacts, and transcripts', () => {
    addContextEntry('t1', { author: 'a', content: 'x', category: 'decision' });
    writeArtifact('t1', 'doc.md', 'content');
    appendTranscript('t1', 'worker', 'log line');

    clearContext('t1');

    expect(getContext('t1').entries).toEqual([]);
    expect(listArtifacts('t1')).toEqual([]);
    expect(listTranscripts('t1')).toEqual([]);
  });

  it('no error on non-existent team', () => {
    expect(() => clearContext('nope')).not.toThrow();
  });
});
