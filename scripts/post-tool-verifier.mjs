#!/usr/bin/env node

/**
 * oh-my-droid Post-Tool Verifier Hook (Node.js)
 * Verifies tool execution results and updates context
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Edit error patterns (from oh-my-claudecode)
const EDIT_ERROR_PATTERNS = [
  'could not be found',
  'not found in the file',
  'does not match',
  'could not find',
  'failed to find',
  'unable to locate',
  'no match found',
  'string not found',
  'text not found',
  'pattern not found'
];

// Detect edit error
function detectEditError(output) {
  if (!output) return false;
  const outputLower = output.toLowerCase();
  return EDIT_ERROR_PATTERNS.some(pattern => outputLower.includes(pattern.toLowerCase()));
}

// Update session statistics
function updateSessionStats(directory, toolName, success) {
  const statsPath = join(directory, '.omd', 'session-stats.json');

  try {
    mkdirSync(join(directory, '.omd'), { recursive: true });

    let stats = { toolUsage: {}, errors: 0, timestamp: new Date().toISOString() };
    if (existsSync(statsPath)) {
      stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    }

    // Update tool usage
    if (!stats.toolUsage) stats.toolUsage = {};
    if (!stats.toolUsage[toolName]) stats.toolUsage[toolName] = 0;
    stats.toolUsage[toolName]++;

    // Update error count
    if (!success && !stats.errors) stats.errors = 0;
    if (!success) stats.errors++;

    stats.lastUpdated = new Date().toISOString();

    writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  } catch {
    // Silently fail
  }
}

// Extract <remember> tags
function extractRememberTags(output) {
  if (!output) return [];

  const remembered = [];
  const priorityRegex = /<remember\s+priority>([\s\S]*?)<\/remember>/g;
  const normalRegex = /<remember>([\s\S]*?)<\/remember>/g;

  let match;
  while ((match = priorityRegex.exec(output)) !== null) {
    remembered.push({ priority: true, content: match[1].trim() });
  }
  while ((match = normalRegex.exec(output)) !== null) {
    remembered.push({ priority: false, content: match[1].trim() });
  }

  return remembered;
}

// Save remembered items to notepad
function saveRememberedItems(directory, remembered) {
  if (remembered.length === 0) return;

  const notepadPath = join(directory, '.omd', 'notepad.md');

  try {
    mkdirSync(join(directory, '.omd'), { recursive: true });

    let content = '';
    if (existsSync(notepadPath)) {
      content = readFileSync(notepadPath, 'utf-8');
    } else {
      content = '# oh-my-droid Notepad\n\n## Priority Context\n\n## Recent Learnings\n\n';
    }

    const timestamp = new Date().toISOString();

    for (const item of remembered) {
      const section = item.priority ? '## Priority Context' : '## Recent Learnings';
      const insertion = `\n\n[${timestamp}]\n${item.content}\n`;

      // Find section and append
      const sectionIndex = content.indexOf(section);
      if (sectionIndex !== -1) {
        const nextSectionIndex = content.indexOf('##', sectionIndex + section.length);
        const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;
        content = content.slice(0, insertIndex) + insertion + content.slice(insertIndex);
      } else {
        content += `\n${section}${insertion}`;
      }
    }

    writeFileSync(notepadPath, content);
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

    const toolName = data.tool_name || '';
    const toolResponse = data.tool_response || {};
    const directory = data.cwd || process.cwd();

    // Convert response to string for analysis
    const outputStr = typeof toolResponse === 'string'
      ? toolResponse
      : JSON.stringify(toolResponse);

    // Check for edit errors
    let message = '';
    if (toolName === 'Edit' && detectEditError(outputStr)) {
      message = '<edit-error-recovery>\n\n';
      message += '[EDIT ERROR DETECTED]\n\n';
      message += 'The Edit tool failed to find the target string. Common causes:\n\n';
      message += '1. Line number prefix included in old_string (remove line numbers)\n';
      message += '2. Indentation mismatch (preserve exact whitespace)\n';
      message += '3. String not unique (provide more context)\n\n';
      message += 'Action: Re-read the file and try again with the exact string.\n\n';
      message += '</edit-error-recovery>\n\n';
    }

    // Extract <remember> tags
    const remembered = extractRememberTags(outputStr);
    if (remembered.length > 0) {
      saveRememberedItems(directory, remembered);
    }

    // Update session statistics
    const success = toolResponse.success !== false;
    updateSessionStats(directory, toolName, success);

    // Return result
    if (message) {
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'PostToolUse',
          additionalContext: message
        }
      }));
    } else {
      console.log(JSON.stringify({ continue: true }));
    }
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
