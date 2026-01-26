#!/usr/bin/env node

/**
 * oh-my-droid Session Idle Hook (Node.js)
 * Handles session idle events and provides reminders
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Read JSON file safely
function readJsonFile(path) {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

// Count incomplete todos
function countIncompleteTodos(todosDir, projectDir) {
  let count = 0;
  const todos = [];

  // Check global todos
  if (existsSync(todosDir)) {
    try {
      const files = readdirSync(todosDir).filter(f => f.endsWith('.json'));
      for (const file of files) {
        const data = readJsonFile(join(todosDir, file));
        if (Array.isArray(data)) {
          const incomplete = data.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
          count += incomplete.length;
          todos.push(...incomplete.slice(0, 3)); // Take first 3
        }
      }
    } catch {}
  }

  // Check project todos
  for (const path of [
    join(projectDir, '.omd', 'todos.json'),
    join(projectDir, '.factory', 'todos.json')
  ]) {
    const data = readJsonFile(path);
    const todoList = data?.todos || data;
    if (Array.isArray(todoList)) {
      const incomplete = todoList.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
      count += incomplete.length;
      todos.push(...incomplete.slice(0, 3));
    }
  }

  return { count, todos: todos.slice(0, 3) };
}

// Check for active persistent modes
function checkPersistentModes(directory) {
  const modes = [];

  const boulderState = readJsonFile(join(directory, '.omd', 'boulder-state.json'));
  if (boulderState?.active) {
    modes.push({
      name: 'boulder',
      task: boulderState.original_prompt || 'Task in progress'
    });
  }

  const ultraworkState = readJsonFile(join(directory, '.omd', 'ultrawork-state.json'));
  if (ultraworkState?.active) {
    modes.push({
      name: 'ultrawork',
      task: ultraworkState.original_prompt || 'Parallel task execution'
    });
  }

  const autopilotState = readJsonFile(join(directory, '.omd', 'autopilot-state.json'));
  if (autopilotState?.active) {
    modes.push({
      name: 'autopilot',
      task: autopilotState.original_prompt || 'Autonomous execution'
    });
  }

  const ralphState = readJsonFile(join(directory, '.omd', 'ralph-state.json'));
  if (ralphState?.active) {
    modes.push({
      name: 'ralph',
      task: ralphState.prompt || 'Persistent task',
      iteration: ralphState.iteration || 1,
      max: ralphState.max_iterations || 100
    });
  }

  return modes;
}

// Main
async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const directory = data.cwd || process.cwd();
    const todosDir = join(homedir(), '.factory', 'todos');

    // Check for incomplete todos
    const { count, todos } = countIncompleteTodos(todosDir, directory);

    // Check for persistent modes
    const modes = checkPersistentModes(directory);

    // Build reminder message
    let message = '';

    if (modes.length > 0) {
      message += '<idle-reminder>\n\n';
      message += '[ACTIVE PERSISTENT MODES]\n\n';
      message += 'You have active persistent modes that should continue:\n\n';

      for (const mode of modes) {
        message += `- ${mode.name.toUpperCase()}: ${mode.task}\n`;
        if (mode.iteration) {
          message += `  Progress: ${mode.iteration}/${mode.max}\n`;
        }
      }

      message += '\nContinue working until all tasks are complete.\n\n';
      message += '</idle-reminder>\n\n';
    }

    if (count > 0) {
      message += '<idle-reminder>\n\n';
      message += `[PENDING TASKS: ${count}]\n\n`;
      message += 'You have incomplete tasks:\n\n';

      for (const todo of todos) {
        message += `- ${todo.description || todo.task}\n`;
      }

      if (count > 3) {
        message += `\n... and ${count - 3} more\n`;
      }

      message += '\nPlease continue working on these tasks.\n\n';
      message += '</idle-reminder>\n\n';
    }

    if (message) {
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'Notification',
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
