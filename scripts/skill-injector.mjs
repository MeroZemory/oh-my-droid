#!/usr/bin/env node

/**
 * oh-my-droid Skill Injector Hook (Node.js)
 * Injects learned skills from local skills directory
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

// Read skill file safely
function readSkillFile(path) {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

// Parse skill frontmatter
function parseSkillMeta(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { triggers: [], body: content };

  const frontmatter = match[1];
  const body = match[2];

  const triggersMatch = frontmatter.match(/triggers:\s*\[(.*?)\]/);
  const triggers = triggersMatch
    ? triggersMatch[1].split(',').map(t => t.trim().replace(/['"]/g, '').toLowerCase())
    : [];

  return { triggers, body };
}

// Check if prompt matches skill triggers
function matchesSkillTriggers(prompt, triggers) {
  if (!prompt || triggers.length === 0) return false;
  const promptLower = prompt.toLowerCase();
  return triggers.some(trigger => promptLower.includes(trigger));
}

// Find and load skills
function findMatchingSkills(prompt, directory) {
  const skills = [];

  // Check global skills directory
  const globalSkillsDir = join(homedir(), '.factory', 'omd', 'skills');
  if (existsSync(globalSkillsDir)) {
    try {
      const files = readdirSync(globalSkillsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const content = readSkillFile(join(globalSkillsDir, file));
        if (content) {
          const { triggers, body } = parseSkillMeta(content);
          if (matchesSkillTriggers(prompt, triggers)) {
            skills.push({
              name: file.replace('.md', ''),
              source: 'global',
              content: body
            });
          }
        }
      }
    } catch {}
  }

  // Check local project skills directory
  const localSkillsDir = join(directory, '.omd', 'skills');
  if (existsSync(localSkillsDir)) {
    try {
      const files = readdirSync(localSkillsDir).filter(f => f.endsWith('.md'));
      for (const file of files) {
        const content = readSkillFile(join(localSkillsDir, file));
        if (content) {
          const { triggers, body } = parseSkillMeta(content);
          if (matchesSkillTriggers(prompt, triggers)) {
            skills.push({
              name: file.replace('.md', ''),
              source: 'project',
              content: body
            });
          }
        }
      }
    } catch {}
  }

  return skills;
}

// Main
async function main() {
  try {
    const input = await readStdin();
    let data = {};
    try { data = JSON.parse(input); } catch {}

    const prompt = data.prompt || '';
    const directory = data.cwd || process.cwd();

    // Find matching skills
    const skills = findMatchingSkills(prompt, directory);

    if (skills.length === 0) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    // Build skill injection message
    let message = '<skill-injection>\n\n[LEARNED SKILLS DETECTED]\n\n';
    message += 'The following learned skills apply to your request:\n\n';

    for (const skill of skills) {
      message += `### Skill: ${skill.name} (${skill.source})\n\n`;
      message += skill.content;
      message += '\n\n---\n\n';
    }

    message += '</skill-injection>\n\n';

    // Return with additional context
    console.log(JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext: message
      }
    }));
  } catch (error) {
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
