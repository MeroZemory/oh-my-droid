# Phase 3: Mailbox

## Goal

Implement file-based asynchronous message passing between team members. The mailbox is per-team and persisted as JSON.

## Depends On

- Phase 1 (types)

## Deliverables

### `src/team/mailbox.ts`

### API

```typescript
// Core operations
function sendMessage(teamName: string, msg: {
  from: string;
  to: string;           // Member name or '*' for broadcast
  type: MessageType;
  payload: unknown;
}): Message;

function readMessages(teamName: string, recipientName: string): Message[];
function readUnreadMessages(teamName: string, recipientName: string): Message[];
function markAsRead(teamName: string, messageIds: number[]): void;

// Convenience
function broadcastMessage(teamName: string, from: string, type: MessageType, payload: unknown): Message;

// Management
function getMailboxState(teamName: string): MailboxState;
function clearMailbox(teamName: string): void;
function pruneReadMessages(teamName: string): number;  // Returns count removed
```

### State File

`.omd/state/team/{name}/mailbox.json` containing a `MailboxState` object:

```json
{
  "nextId": 4,
  "messages": [
    { "id": 1, "from": "leader", "to": "architect-1", "type": "task", "payload": "...", "timestamp": "...", "read": false },
    { "id": 2, "from": "architect-1", "to": "leader", "type": "result", "payload": "...", "timestamp": "...", "read": false },
    { "id": 3, "from": "leader", "to": "*", "type": "shutdown", "payload": null, "timestamp": "...", "read": false }
  ]
}
```

### Implementation Notes

- `nextId` is monotonically increasing per mailbox (auto-increment on each send)
- `readMessages` returns messages where `to === recipientName` OR `to === '*'`
- `readUnreadMessages` additionally filters `read === false`
- `markAsRead` sets `read = true` for specified IDs
- `broadcastMessage` is shorthand for `sendMessage` with `to: '*'`
- Directory creation: `fs.mkdirSync('.omd/state/team/{name}', { recursive: true })`
- If mailbox.json doesn't exist, initialize with `{ nextId: 1, messages: [] }`
- `pruneReadMessages` removes all messages where `read === true` — keeps mailbox compact

### Typed Control Messages

The mailbox is not a simple text channel — it is a typed control plane. The `payload` field uses the `ControlPayload` union type to distinguish:

- `text` — free-form communication
- `task_assignment` — leader assigns work with file ownership
- `task_result` — member reports completion with modified files list
- `permission_request` / `permission_response` — member asks leader for permission to run a destructive tool
- `shutdown_request` / `shutdown_response` — graceful shutdown handshake

This separation is critical: without it, permission flows, approval flows, and shutdown flows get tangled with regular messages, and the orchestrator cannot reliably parse the mailbox.

### Write Safety

The leader is the primary writer. Members send messages by calling `sendMessage`, which reads the current state, appends, and writes back. In the rare case of concurrent writes (two members sending at the same time), the last writer wins — acceptable given small team sizes and the leader-centric design.

## Test Plan

### `src/team/__tests__/mailbox.test.ts`

**Core operations:**
- Send a message → appears in mailbox with auto-incremented id
- Send multiple → ids are sequential
- Read messages for a specific recipient → only their messages
- Broadcast → readable by all recipients
- Read unread → filters out already-read messages

**Mark as read:**
- Mark specific message ids → read flag changes
- Mark non-existent id → no error, no effect

**Management:**
- Clear mailbox → empty messages, nextId resets to 1
- Prune read messages → only unread remain, returns count removed

**Edge cases:**
- Read from empty mailbox → returns []
- Send to non-existent team directory → auto-creates

## Completion Criteria

- [ ] `src/team/mailbox.ts` compiles and all functions are exported
- [ ] `src/team/__tests__/mailbox.test.ts` — all tests pass
- [ ] Mailbox JSON is human/LLM-readable
- [ ] No dependency on registry (mailbox is independent, only needs team name)
