#!/usr/bin/env node

/**
 * oh-my-droid Pre-Compact Hook (Node.js)
 * Preserves wisdom and important context before conversation compaction
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

// Read transcript and extract wisdom
function extractWisdomFromTranscript(transcriptPath) {
  if (!existsSync(transcriptPath)) return { learnings: [], decisions: [], issues: [] };

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());

    const learnings = [];
    const decisions = [];
    const issues = [];

    for (const line of lines) {
      try {
        const msg = JSON.parse(line);

        // Extract from assistant messages
        if (msg.role === 'assistant' && msg.content) {
          const text = Array.isArray(msg.content)
            ? msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n')
            : msg.content;

          // Look for key patterns
          if (text.includes('learned') || text.includes('discovered') || text.includes('found that')) {
            const match = text.match(/(?:learned|discovered|found that)[:\s]+([^\n.]{20,150})/i);
            if (match) learnings.push(match[1].trim());
          }

          if (text.includes('decided to') || text.includes('chose to') || text.includes('will use')) {
            const match = text.match(/(?:decided to|chose to|will use)[:\s]+([^\n.]{20,150})/i);
            if (match) decisions.push(match[1].trim());
          }

          if (text.includes('issue:') || text.includes('problem:') || text.includes('blocker:')) {
            const match = text.match(/(?:issue|problem|blocker)[:\s]+([^\n.]{20,150})/i);
            if (match) issues.push(match[1].trim());
          }
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    return { learnings, decisions, issues };
  } catch {
    return { learnings: [], decisions: [], issues: [] };
  }
}

// Save wisdom to notepad
function saveWisdomToNotepad(directory, wisdom) {
  const notepadPath = join(directory, '.omd', 'notepad.md');
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    mkdirSync(join(directory, '.omd'), { recursive: true });

    let content = '';
    if (existsSync(notepadPath)) {
      content = readFileSync(notepadPath, 'utf-8');
    } else {
      content = '# oh-my-droid Notepad\n\n## Priority Context\n\n## Recent Learnings\n\n## Decisions\n\n## Issues\n\n';
    }

    // Append learnings
    if (wisdom.learnings.length > 0) {
      const section = '## Recent Learnings';
      const additions = wisdom.learnings.map(l => `- [${timestamp}] ${l}`).join('\n');
      const sectionIndex = content.indexOf(section);
      if (sectionIndex !== -1) {
        const nextSectionIndex = content.indexOf('##', sectionIndex + section.length);
        const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;
        content = content.slice(0, insertIndex) + '\n' + additions + '\n' + content.slice(insertIndex);
      }
    }

    // Append decisions
    if (wisdom.decisions.length > 0) {
      const section = '## Decisions';
      const additions = wisdom.decisions.map(d => `- [${timestamp}] ${d}`).join('\n');
      const sectionIndex = content.indexOf(section);
      if (sectionIndex !== -1) {
        const nextSectionIndex = content.indexOf('##', sectionIndex + section.length);
        const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;
        content = content.slice(0, insertIndex) + '\n' + additions + '\n' + content.slice(insertIndex);
      }
    }

    // Append issues
    if (wisdom.issues.length > 0) {
      const section = '## Issues';
      const additions = wisdom.issues.map(i => `- [${timestamp}] ${i}`).join('\n');
      const sectionIndex = content.indexOf(section);
      if (sectionIndex !== -1) {
        const nextSectionIndex = content.indexOf('##', sectionIndex + section.length);
        const insertIndex = nextSectionIndex !== -1 ? nextSectionIndex : content.length;
        content = content.slice(0, insertIndex) + '\n' + additions + '\n' + content.slice(insertIndex);
      }
    }

    writeFileSync(notepadPath, content);
  } catch {
    // Silently fail
  }
}

// Preserve session statistics
function preserveSessionStats(directory) {
  const statsPath = join(directory, '.omd', 'session-stats.json');
  const historyPath = join(directory, '.omd', 'session-history.json');

  try {
    if (!existsSync(statsPath)) return;

    const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    stats.compactedAt = new Date().toISOString();

    // Append to history
    let history = [];
    if (existsSync(historyPath)) {
      history = JSON.parse(readFileSync(historyPath, 'utf-8'));
    }
    history.push(stats);

    // Keep last 10 sessions
    if (history.length > 10) {
      history = history.slice(-10);
    }

    writeFileSync(historyPath, JSON.stringify(history, null, 2));
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
    const transcriptPath = data.transcript_path;

    // Extract wisdom from transcript
    if (transcriptPath) {
      const wisdom = extractWisdomFromTranscript(transcriptPath);
      const totalItems = wisdom.learnings.length + wisdom.decisions.length + wisdom.issues.length;

      if (totalItems > 0) {
        saveWisdomToNotepad(directory, wisdom);
      }
    }

    // Preserve session statistics
    preserveSessionStats(directory);

    console.log(JSON.stringify({ continue: true }));
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
