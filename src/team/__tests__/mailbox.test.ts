import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  setBaseDir,
  sendMessage,
  readMessages,
  readUnreadMessages,
  markAsRead,
  broadcastMessage,
  getMailboxState,
  clearMailbox,
  pruneReadMessages,
} from '../mailbox.js';
import type { ControlPayload } from '../types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omd-mailbox-test-'));
  setBaseDir(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ── Core operations ───────────────────────────────────────────────────────

describe('sendMessage', () => {
  it('sends a message with auto-incremented id', () => {
    const msg = sendMessage('team1', {
      from: 'leader',
      to: 'architect-1',
      type: 'task',
      payload: { kind: 'task_assignment', description: 'design API' },
    });
    expect(msg.id).toBe(1);
    expect(msg.from).toBe('leader');
    expect(msg.to).toBe('architect-1');
    expect(msg.type).toBe('task');
    expect(msg.read).toBe(false);
    expect(msg.timestamp).toBeDefined();
  });

  it('increments ids sequentially', () => {
    const m1 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    const m2 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    const m3 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    expect(m1.id).toBe(1);
    expect(m2.id).toBe(2);
    expect(m3.id).toBe(3);
  });

  it('auto-creates team directory', () => {
    sendMessage('new-team', { from: 'a', to: 'b', type: 'task', payload: null });
    const fp = path.join(tmpDir, 'new-team', 'mailbox.json');
    expect(fs.existsSync(fp)).toBe(true);
  });

  it('persists typed control payloads', () => {
    const payload: ControlPayload = {
      kind: 'permission_request',
      requestId: 'r1',
      tool: 'Bash',
      args: { command: 'rm -rf dist' },
    };
    sendMessage('team1', { from: 'executor-1', to: 'leader', type: 'permission_request', payload });
    const state = getMailboxState('team1');
    const stored = state.messages[0].payload as ControlPayload;
    expect(stored.kind).toBe('permission_request');
    expect((stored as any).requestId).toBe('r1');
  });
});

// ── Read operations ───────────────────────────────────────────────────────

describe('readMessages', () => {
  beforeEach(() => {
    sendMessage('team1', { from: 'leader', to: 'arch', type: 'task', payload: 'for arch' });
    sendMessage('team1', { from: 'leader', to: 'exec', type: 'task', payload: 'for exec' });
    sendMessage('team1', { from: 'leader', to: '*', type: 'feedback', payload: 'for all' });
  });

  it('returns messages for a specific recipient', () => {
    const msgs = readMessages('team1', 'arch');
    expect(msgs).toHaveLength(2); // direct + broadcast
    expect(msgs.map((m) => m.payload)).toContain('for arch');
    expect(msgs.map((m) => m.payload)).toContain('for all');
  });

  it('broadcast is readable by any recipient', () => {
    const exec = readMessages('team1', 'exec');
    const arch = readMessages('team1', 'arch');
    expect(exec.some((m) => m.to === '*')).toBe(true);
    expect(arch.some((m) => m.to === '*')).toBe(true);
  });

  it('returns empty for unknown recipient', () => {
    expect(readMessages('team1', 'nobody')).toHaveLength(1); // only broadcast
  });

  it('returns empty for empty mailbox', () => {
    expect(readMessages('empty-team', 'anyone')).toEqual([]);
  });
});

describe('readUnreadMessages', () => {
  it('filters out read messages', () => {
    const m1 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: 1 });
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: 2 });
    markAsRead('team1', [m1.id]);

    const unread = readUnreadMessages('team1', 'b');
    expect(unread).toHaveLength(1);
    expect(unread[0].payload).toBe(2);
  });
});

// ── Mark as read ──────────────────────────────────────────────────────────

describe('markAsRead', () => {
  it('marks specific messages as read', () => {
    const m1 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    const m2 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    markAsRead('team1', [m1.id]);

    const state = getMailboxState('team1');
    expect(state.messages.find((m) => m.id === m1.id)!.read).toBe(true);
    expect(state.messages.find((m) => m.id === m2.id)!.read).toBe(false);
  });

  it('no error on non-existent id', () => {
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    expect(() => markAsRead('team1', [999])).not.toThrow();
  });

  it('no write if nothing changed', () => {
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    markAsRead('team1', [999]); // non-existent
    // Just verifying no crash; state unchanged
    expect(getMailboxState('team1').messages[0].read).toBe(false);
  });
});

// ── Broadcast ─────────────────────────────────────────────────────────────

describe('broadcastMessage', () => {
  it('sends with to="*"', () => {
    const msg = broadcastMessage('team1', 'leader', 'shutdown_request', { kind: 'shutdown_request', reason: 'done' });
    expect(msg.to).toBe('*');
    expect(msg.type).toBe('shutdown_request');
  });
});

// ── Management ────────────────────────────────────────────────────────────

describe('getMailboxState', () => {
  it('returns current state', () => {
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    const state = getMailboxState('team1');
    expect(state.nextId).toBe(3);
    expect(state.messages).toHaveLength(2);
  });

  it('returns empty state for non-existent team', () => {
    const state = getMailboxState('nope');
    expect(state.nextId).toBe(1);
    expect(state.messages).toEqual([]);
  });
});

describe('clearMailbox', () => {
  it('resets to empty state', () => {
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    clearMailbox('team1');
    const state = getMailboxState('team1');
    expect(state.nextId).toBe(1);
    expect(state.messages).toEqual([]);
  });
});

describe('pruneReadMessages', () => {
  it('removes read messages and returns count', () => {
    const m1 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: 1 });
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: 2 });
    const m3 = sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: 3 });
    markAsRead('team1', [m1.id, m3.id]);

    const removed = pruneReadMessages('team1');
    expect(removed).toBe(2);
    const state = getMailboxState('team1');
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].payload).toBe(2);
  });

  it('returns 0 when nothing to prune', () => {
    sendMessage('team1', { from: 'a', to: 'b', type: 'task', payload: null });
    expect(pruneReadMessages('team1')).toBe(0);
  });

  it('returns 0 for empty mailbox', () => {
    expect(pruneReadMessages('empty')).toBe(0);
  });
});

// ── JSON readability ──────────────────────────────────────────────────────

describe('JSON readability', () => {
  it('mailbox file is human/LLM-readable JSON', () => {
    sendMessage('readable', { from: 'leader', to: 'worker', type: 'task', payload: { kind: 'text', text: 'hello' } });
    const fp = path.join(tmpDir, 'readable', 'mailbox.json');
    const raw = fs.readFileSync(fp, 'utf-8');
    // Should be indented (not minified)
    expect(raw).toContain('\n');
    // Should be valid JSON
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
