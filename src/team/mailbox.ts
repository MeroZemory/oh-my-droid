/**
 * Team Mailbox
 *
 * File-based asynchronous message passing between team members.
 * The mailbox is a typed control plane — permissions, approvals,
 * and shutdown are structured messages, not free text.
 *
 * Independent of the registry; only needs a team name.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Message, MessageType, MailboxState } from './types.js';

// ---------------------------------------------------------------------------
// Base directory — shares the same override mechanism as registry
// ---------------------------------------------------------------------------

let baseDir = path.join('.omd', 'state', 'team');

export function setBaseDir(dir: string): void {
  baseDir = dir;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mailboxPath(teamName: string): string {
  return path.join(baseDir, teamName, 'mailbox.json');
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function now(): string {
  return new Date().toISOString();
}

function readState(teamName: string): MailboxState {
  const fp = mailboxPath(teamName);
  if (!fs.existsSync(fp)) {
    return { nextId: 1, messages: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8')) as MailboxState;
  } catch {
    return { nextId: 1, messages: [] };
  }
}

function writeState(teamName: string, state: MailboxState): void {
  const fp = mailboxPath(teamName);
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, JSON.stringify(state, null, 2), 'utf-8');
}

// ---------------------------------------------------------------------------
// Core operations
// ---------------------------------------------------------------------------

export function sendMessage(
  teamName: string,
  msg: { from: string; to: string; type: MessageType; payload: unknown },
): Message {
  const state = readState(teamName);
  const message: Message = {
    id: state.nextId,
    from: msg.from,
    to: msg.to,
    type: msg.type,
    payload: msg.payload,
    timestamp: now(),
    read: false,
  };
  state.nextId++;
  state.messages.push(message);
  writeState(teamName, state);
  return message;
}

export function readMessages(teamName: string, recipientName: string): Message[] {
  const state = readState(teamName);
  return state.messages.filter((m) => m.to === recipientName || m.to === '*');
}

export function readUnreadMessages(teamName: string, recipientName: string): Message[] {
  const state = readState(teamName);
  return state.messages.filter(
    (m) => !m.read && (m.to === recipientName || m.to === '*'),
  );
}

export function markAsRead(teamName: string, messageIds: number[]): void {
  const state = readState(teamName);
  const idSet = new Set(messageIds);
  let changed = false;
  for (const msg of state.messages) {
    if (idSet.has(msg.id) && !msg.read) {
      msg.read = true;
      changed = true;
    }
  }
  if (changed) {
    writeState(teamName, state);
  }
}

// ---------------------------------------------------------------------------
// Convenience
// ---------------------------------------------------------------------------

export function broadcastMessage(
  teamName: string,
  from: string,
  type: MessageType,
  payload: unknown,
): Message {
  return sendMessage(teamName, { from, to: '*', type, payload });
}

// ---------------------------------------------------------------------------
// Management
// ---------------------------------------------------------------------------

export function getMailboxState(teamName: string): MailboxState {
  return readState(teamName);
}

export function clearMailbox(teamName: string): void {
  writeState(teamName, { nextId: 1, messages: [] });
}

export function pruneReadMessages(teamName: string): number {
  const state = readState(teamName);
  const before = state.messages.length;
  state.messages = state.messages.filter((m) => !m.read);
  const removed = before - state.messages.length;
  if (removed > 0) {
    writeState(teamName, state);
  }
  return removed;
}
