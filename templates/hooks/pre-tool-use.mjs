#!/usr/bin/env node
/**
 * OMC Pre-Tool-Use Hook (Node.js)
 * - Enforces delegation by warning when orchestrator attempts direct source file edits
 * - Enables background Task/Agent delegations during ultrawork mode (parallelism)
 */

import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Dynamic import for the shared stdin module (pathToFileURL required on Windows)
const { readStdin } = await import(pathToFileURL(path.join(__dirname, 'lib', 'stdin.mjs')).href);

// Allowed path patterns (no warning)
const ALLOWED_PATH_PATTERNS = [
  /\.omd\//,
  /\.factory\//,
  /\/\.factory\//,
  /FACTORY\.md$/,
  /AGENTS\.md$/,
];

// Source file extensions (should warn)
const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.pyw',
  '.go', '.rs', '.java', '.kt', '.scala',
  '.c', '.cpp', '.cc', '.h', '.hpp',
  '.rb', '.php',
  '.svelte', '.vue',
  '.graphql', '.gql',
  '.sh', '.bash', '.zsh',
]);

function isAllowedPath(filePath) {
  if (!filePath) return true;
  return ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(filePath));
}

function isSourceFile(filePath) {
  if (!filePath) return false;
  const ext = path.extname(filePath).toLowerCase();
  return SOURCE_EXTENSIONS.has(ext);
}

// Patterns that indicate file modification in bash commands
const FILE_MODIFY_PATTERNS = [
  /sed\s+-i/,
  />\s*[^&]/,
  />>/,
  /tee\s+/,
  /cat\s+.*>\s*/,
  /echo\s+.*>\s*/,
  /printf\s+.*>\s*/,
];

// Source file pattern for command inspection
const SOURCE_EXT_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|py|pyw|go|rs|java|kt|scala|c|cpp|cc|h|hpp|rb|php|svelte|vue|graphql|gql|sh|bash|zsh)/i;

function checkBashCommand(command) {
  // Check if command might modify files
  const mayModify = FILE_MODIFY_PATTERNS.some(pattern => pattern.test(command));
  if (!mayModify) return null;

  // Check if it might affect source files
  if (SOURCE_EXT_PATTERN.test(command)) {
    return `[DELEGATION NOTICE] Bash command may modify source files: ${command}

Recommended: Delegate to executor agent instead:
  Task(subagent_type="oh-my-droid:executor", model="claude-sonnet-4-5-20250929", prompt="...")

This is a soft warning. Operation will proceed.`;
  }
  return null;
}

function safeReadJson(filePath) {
  try {
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function isModeActive(directory, modeName) {
  const localPath = path.join(directory, '.omd', 'state', `${modeName}-state.json`);
  const globalPath = path.join(process.env.HOME || homedir(), '.omd', 'state', `${modeName}-state.json`);

  const state = safeReadJson(localPath) || safeReadJson(globalPath);
  if (!state || typeof state !== 'object') return false;

  if (state.active === true) return true;
  if (state.status === 'running' || state.status === 'active') return true;
  return false;
}

function isUltraworkLikeModeActive(directory) {
  // ultrawork is the primary parallel mode; ralph often co-activates ultrawork but we include it defensively.
  return (
    isModeActive(directory, 'ultrawork') ||
    isModeActive(directory, 'ultrapilot') ||
    isModeActive(directory, 'ralph')
  );
}

function isDelegationTool(toolName) {
  const t = String(toolName || '').toLowerCase();
  return t === 'task' || t === 'agent';
}

function shouldAutoBackgroundDelegation(toolName, toolInput, directory) {
  if (!isDelegationTool(toolName)) return false;
  if (!isUltraworkLikeModeActive(directory)) return false;
  if (!toolInput || typeof toolInput !== 'object') return false;

  const input = toolInput;
  if (typeof input.subagent_type !== 'string') return false;

  // Respect explicit user/system choice.
  if (input.run_in_background === false || input.runInBackground === false) return false;
  if (input.run_in_background === true || input.runInBackground === true) return false;

  return input.run_in_background === undefined && input.runInBackground === undefined;
}

function createPreToolUseOutput({ additionalContext, updatedInput } = {}) {
  if (!additionalContext && !updatedInput) {
    return { continue: true };
  }
  return {
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      ...(additionalContext ? { additionalContext } : {}),
      ...(updatedInput ? { updatedInput } : {}),
    },
  };
}

async function main() {
  const input = await readStdin();

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  // Extract tool name (handle both cases)
  const toolName = data.tool_name || data.toolName || '';
  const directory = data.directory || process.cwd();

  // ULTRAWORK: automatically background Task/Agent delegations to enable parallel execution.
  if (shouldAutoBackgroundDelegation(toolName, data.tool_input || data.toolInput, directory)) {
    const toolInput = data.tool_input || data.toolInput || {};
    console.log(
      JSON.stringify(
        createPreToolUseOutput({
          updatedInput: {
            ...toolInput,
            run_in_background: true,
          },
        })
      )
    );
    return;
  }

  // Handle Bash tool separately - check for file modification patterns
  if (toolName === 'Bash' || toolName === 'bash') {
    const toolInput = data.tool_input || data.toolInput || {};
    const command = toolInput.command || '';
    const warning = checkBashCommand(command);
    if (warning) {
      console.log(JSON.stringify(createPreToolUseOutput({ additionalContext: warning })));
    } else {
      console.log(JSON.stringify(createPreToolUseOutput()));
    }
    return;
  }

  // Only check Edit and Write tools
  if (!['Edit', 'Write', 'edit', 'write'].includes(toolName)) {
    console.log(JSON.stringify(createPreToolUseOutput()));
    return;
  }

  // Extract file path (handle nested structures)
  const toolInput = data.tool_input || data.toolInput || {};
  const filePath = toolInput.file_path || toolInput.filePath || '';

  // No file path? Allow
  if (!filePath) {
    console.log(JSON.stringify(createPreToolUseOutput()));
    return;
  }

  // Check if allowed path
  if (isAllowedPath(filePath)) {
    console.log(JSON.stringify(createPreToolUseOutput()));
    return;
  }

  // Check if source file
  if (isSourceFile(filePath)) {
    const warning = `[DELEGATION NOTICE] Direct ${toolName} on source file: ${filePath}

Recommended: Delegate to executor agent instead:
  Task(subagent_type="oh-my-droid:executor", model="claude-sonnet-4-5-20250929", prompt="...")

This is a soft warning. Operation will proceed.`;

    console.log(JSON.stringify(createPreToolUseOutput({ additionalContext: warning })));
    return;
  }

  // Not a source file, allow without warning
  console.log(JSON.stringify(createPreToolUseOutput()));
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
