#!/usr/bin/env node

/**
 * oh-my-droid Error Recovery Hook (Node.js)
 * Handles errors and provides recovery suggestions
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, writeFileSync, mkdirSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Error patterns and recovery suggestions
const ERROR_PATTERNS = [
  {
    pattern: /context.*(?:window|limit|exceeded|too large)/i,
    type: 'context_limit',
    message: `<error-recovery>

[CONTEXT WINDOW LIMIT EXCEEDED]

The conversation has grown too large. Suggested actions:

1. Use /compact to compress the conversation history
2. Save important context to notepad with <remember> tags
3. Start a new session with /clear if needed
4. Consider breaking work into smaller sub-droids

The system will attempt to compact automatically.

</error-recovery>`
  },
  {
    pattern: /edit.*(?:failed|error|not found|could not)/i,
    type: 'edit_error',
    message: `<error-recovery>

[EDIT TOOL ERROR]

The Edit tool failed to apply changes. Common fixes:

1. Re-read the file to get exact current content
2. Ensure old_string matches exactly (check whitespace)
3. Remove line number prefixes from old_string
4. Provide more context if string is not unique
5. Consider using Write tool for complete rewrites

</error-recovery>`
  },
  {
    pattern: /permission.*denied/i,
    type: 'permission_error',
    message: `<error-recovery>

[PERMISSION ERROR]

File or command access was denied. Suggested actions:

1. Check file permissions with ls -la
2. Ensure the file is not locked by another process
3. Use sudo for system-level operations (with caution)
4. Verify working directory is correct

</error-recovery>`
  },
  {
    pattern: /module.*not found|cannot find module/i,
    type: 'module_error',
    message: `<error-recovery>

[MODULE NOT FOUND]

A required dependency is missing. Suggested actions:

1. Install dependencies: npm install / pip install / cargo build
2. Check package.json or requirements.txt
3. Verify the import path is correct
4. Clear caches: rm -rf node_modules && npm install

</error-recovery>`
  },
  {
    pattern: /syntax error|unexpected token/i,
    type: 'syntax_error',
    message: `<error-recovery>

[SYNTAX ERROR]

Code contains syntax errors. Suggested actions:

1. Re-read the file to see exact current state
2. Use linter: eslint / pylint / cargo check
3. Check for mismatched brackets, quotes, or braces
4. Verify language-specific syntax rules

</error-recovery>`
  }
];

// Detect error type and get recovery message
function detectErrorType(errorText) {
  if (!errorText) return null;

  for (const { pattern, type, message } of ERROR_PATTERNS) {
    if (pattern.test(errorText)) {
      return { type, message };
    }
  }

  return null;
}

// Log error for future reference
function logError(directory, errorInfo) {
  const errorLogPath = join(directory, '.omd', 'error-log.jsonl');

  try {
    mkdirSync(join(directory, '.omd'), { recursive: true });

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: errorInfo.type,
      error: errorInfo.error,
      recovery: errorInfo.message
    };

    appendFileSync(errorLogPath, JSON.stringify(logEntry) + '\n');
  } catch {
    // Silently fail
  }
}

// Main
async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const directory = data.cwd || process.cwd();
    const toolResponse = data.tool_response || {};
    const error = data.error || toolResponse.error || '';

    // Convert error to string
    const errorText = typeof error === 'string' ? error : JSON.stringify(error);

    // Detect error type
    const errorInfo = detectErrorType(errorText);

    if (errorInfo) {
      // Log the error
      logError(directory, { ...errorInfo, error: errorText });

      // Return recovery message
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: errorInfo.message
        }
      }));
    } else {
      // No specific recovery guidance
      console.log(JSON.stringify({ continue: true }));
    }
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
