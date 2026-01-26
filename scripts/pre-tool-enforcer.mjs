#!/usr/bin/env node

/**
 * oh-my-droid Pre-Tool Enforcer Hook (Node.js)
 * Enforces delegation rules before tool execution
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { homedir } from 'os';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Source file extensions that should be delegated
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx',
  '.py', '.go', '.rs', '.java',
  '.c', '.cpp', '.h', '.hpp',
  '.svelte', '.vue', '.rb', '.php',
  '.cs', '.kt', '.swift', '.dart'
]);

// System/config paths that are allowed for direct editing
const ALLOWED_PATHS = [
  '.omd/',
  '.factory/',
  '.claude/',
  '.github/workflows/',
  'CLAUDE.md',
  'AGENTS.md',
  'README.md'
];

// Check if path is allowed for direct editing
function isAllowedPath(filePath) {
  return ALLOWED_PATHS.some(allowed => filePath.includes(allowed));
}

// Check if file is a source file
function isSourceFile(filePath) {
  const ext = extname(filePath);
  return SOURCE_EXTENSIONS.has(ext);
}

// Count incomplete todos
function countIncompleteTodos(directory) {
  let count = 0;

  // Check project todos
  for (const path of [
    join(directory, '.omd', 'todos.json'),
    join(directory, '.factory', 'todos.json')
  ]) {
    try {
      if (!existsSync(path)) continue;
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      const todos = data?.todos || data;
      if (Array.isArray(todos)) {
        count += todos.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
      }
    } catch {}
  }

  // Check global todos
  const todosDir = join(homedir(), '.factory', 'todos');
  if (existsSync(todosDir)) {
    try {
      const files = readdirSync(todosDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = JSON.parse(readFileSync(join(todosDir, file), 'utf-8'));
        if (Array.isArray(data)) {
          count += data.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
        }
      }
    } catch {}
  }

  return count;
}

// Main
async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const toolName = data.tool_name || '';
    const toolInput = data.tool_input || {};
    const directory = data.cwd || process.cwd();

    // Only enforce for Edit and Write tools
    if (!['Edit', 'Write'].includes(toolName)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const filePath = toolInput.file_path || '';

    // Allow system/config files
    if (isAllowedPath(filePath)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Check if it's a source file
    if (!isSourceFile(filePath)) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Count incomplete todos
    const todoCount = countIncompleteTodos(directory);

    // Build warning message
    let message = '<delegation-warning>\n\n';
    message += `[DELEGATION REMINDER: ${toolName} on ${filePath}]\n\n`;
    message += 'You are directly modifying source code. Consider:\n\n';
    message += '1. For simple changes: Use executor-low droid\n';
    message += '2. For complex changes: Use executor or executor-high droid\n';
    message += '3. For multi-file refactoring: Use architect droid first\n\n';

    if (todoCount > 0) {
      message += `Note: You have ${todoCount} incomplete todos. Consider using boulder mode for persistent execution.\n\n`;
    }

    message += 'This is a soft reminder. The operation will proceed.\n\n';
    message += '</delegation-warning>\n\n';

    // Return with warning (but continue)
    console.log(JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext: message
      }
    }));
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
