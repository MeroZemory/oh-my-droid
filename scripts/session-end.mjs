#!/usr/bin/env node

/**
 * oh-my-droid Session End Hook (Node.js)
 * Cleanup and statistics collection at session end
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Save final session statistics
function saveFinalStats(directory, reason) {
  const statsPath = join(directory, '.omd', 'session-stats.json');
  const summaryPath = join(directory, '.omd', 'session-summary.json');

  try {
    if (!existsSync(statsPath)) return;

    const stats = JSON.parse(readFileSync(statsPath, 'utf-8'));
    stats.endedAt = new Date().toISOString();
    stats.endReason = reason;

    // Calculate session duration
    if (stats.timestamp) {
      const start = new Date(stats.timestamp);
      const end = new Date(stats.endedAt);
      stats.durationMinutes = Math.round((end - start) / 60000);
    }

    // Save summary
    mkdirSync(join(directory, '.omd'), { recursive: true });
    writeFileSync(summaryPath, JSON.stringify(stats, null, 2));

    // Clean up active stats
    unlinkSync(statsPath);
  } catch {
    // Silently fail
  }
}

// Clean up temporary state files
function cleanupTempState(directory) {
  const tempFiles = [
    join(directory, '.omd', 'ultrawork-state.json'),
    join(directory, '.omd', 'autopilot-state.json'),
    join(directory, '.omd', 'ralph-state.json'),
    join(directory, '.omd', 'eco-state.json')
  ];

  for (const file of tempFiles) {
    try {
      if (existsSync(file)) {
        const state = JSON.parse(readFileSync(file, 'utf-8'));
        // Only delete if not active or explicitly ended
        if (!state.active || state.ended) {
          unlinkSync(file);
        }
      }
    } catch {
      // Silently continue
    }
  }
}

// Generate session summary message
function generateSummary(directory) {
  const summaryPath = join(directory, '.omd', 'session-summary.json');

  try {
    if (!existsSync(summaryPath)) return null;

    const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'));

    let message = '\n=== Session Summary ===\n\n';

    if (summary.durationMinutes) {
      message += `Duration: ${summary.durationMinutes} minutes\n`;
    }

    if (summary.toolUsage) {
      const tools = Object.entries(summary.toolUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      if (tools.length > 0) {
        message += '\nTop Tools Used:\n';
        tools.forEach(([tool, count]) => {
          message += `  - ${tool}: ${count}\n`;
        });
      }
    }

    if (summary.errors && summary.errors > 0) {
      message += `\nErrors encountered: ${summary.errors}\n`;
    }

    message += '\n=======================\n';

    return message;
  } catch {
    return null;
  }
}

// Main
async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const directory = data.cwd || process.cwd();
    const reason = data.reason || 'unknown';

    // Save final statistics
    saveFinalStats(directory, reason);

    // Clean up temporary state
    cleanupTempState(directory);

    // Generate summary
    const summary = generateSummary(directory);

    if (summary) {
      // Print to stderr so user sees it
      console.error(summary);
    }

    console.log(JSON.stringify({ continue: true }));
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
