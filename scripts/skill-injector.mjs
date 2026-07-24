#!/usr/bin/env node

/**
 * Skill Injector Hook (UserPromptSubmit)
 * Injects relevant learned skills into context based on prompt triggers.
 *
 * STANDALONE SCRIPT - uses compiled bridge bundle from dist/hooks/skill-bridge.cjs
 * Falls back to inline implementation if bundle not available (first run before build)
 *
 * Enhancement in v3.5: Now uses RECURSIVE discovery (skills in subdirectories included)
 */

import { existsSync, readdirSync, readFileSync, realpathSync } from 'fs';
import { join, relative } from 'path';
import { homedir } from 'os';
import { createRequire } from 'module';

// Try to load the compiled bridge bundle
const require = createRequire(import.meta.url);
let bridge = null;
try {
  bridge = require('../dist/hooks/skill-bridge.cjs');
} catch {
  // Bridge not available - use fallback (first run before build, or dist/ missing)
}

// Constants (used by fallback). Canonical paths mirror learner/constants.ts.
const AGENTS_SKILLS_DIR = join(homedir(), '.agents', 'skills');
const USER_SKILLS_DIR = join(AGENTS_SKILLS_DIR, 'droid-learned');
const LEGACY_USER_SKILLS_DIRS = [
  join(homedir(), '.factory', 'skills', 'droid-learned'),
  join(homedir(), '.factory', 'skills', 'omc-learned'),
  join(homedir(), '.omd', 'skills'),
];
const PROJECT_SKILLS_SUBDIR = join('.agents', 'skills', 'droid-learned');
const LEGACY_PROJECT_SKILLS_SUBDIR = join('.omd', 'skills');
const SKILL_EXTENSION = '.md';
const MAX_SKILLS_PER_SESSION = 5;
const MAX_RECURSION_DEPTH = 10;

// =============================================================================
// Fallback Implementation (used when bridge bundle not available)
// =============================================================================

// In-memory cache (resets each process - known limitation, fixed by bridge)
const injectedCacheFallback = new Map();

// Parse YAML frontmatter from skill file (fallback)
function parseSkillFrontmatterFallback(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return null;

  const yamlContent = match[1];
  const body = match[2].trim();

  // Simple YAML parsing for triggers
  const triggers = [];
  const triggerMatch = yamlContent.match(/triggers:\s*\n((?:\s+-\s*.+\n?)*)/);
  if (triggerMatch) {
    const lines = triggerMatch[1].split('\n');
    for (const line of lines) {
      const itemMatch = line.match(/^\s+-\s*["']?([^"'\n]+)["']?\s*$/);
      if (itemMatch) triggers.push(itemMatch[1].trim().toLowerCase());
    }
  }

  // Extract name
  const nameMatch = yamlContent.match(/name:\s*["']?([^"'\n]+)["']?/);
  const name = nameMatch ? nameMatch[1].trim() : 'Unnamed Skill';

  return { name, triggers, content: body };
}

// Resolve symlinks safely with fallback.
function safeRealpathSyncFallback(filePath) {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
}

// Check if a resolved path is within a boundary directory.
function isWithinBoundaryFallback(realPath, boundary) {
  const boundaryReal = safeRealpathSyncFallback(boundary);
  const normalizedReal = realPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  const normalizedBoundary = boundaryReal.replace(/\\/g, '/').replace(/\/+/g, '/');
  return normalizedReal === normalizedBoundary ||
         normalizedReal.startsWith(normalizedBoundary + '/');
}

// Recursively find all skill files in a directory (fallback).
function findSkillFilesRecursiveFallback(dir, results, depth = 0) {
  if (!existsSync(dir)) return;
  if (depth > MAX_RECURSION_DEPTH) return;
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findSkillFilesRecursiveFallback(fullPath, results, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(SKILL_EXTENSION)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Permission denied or other errors - silently skip
  }
}

// Find all skill files (fallback - recursive, boundary-aware)
function findSkillFilesFallback(directory) {
  const candidates = [];
  const seenRealPaths = new Set();

  // Scan dirs ordered new-first; per-scope relative-path dedup keeps the
  // migrated (~/.agents) copy and skips a stale duplicate in a legacy dir,
  // while distinct nested SKILL.md files remain loadable.
  const scanDirs = (dirs, scope) => {
    const seenIdentities = new Set();
    for (const dir of dirs) {
      const files = [];
      findSkillFilesRecursiveFallback(dir, files);
      for (const filePath of files) {
        const realPath = safeRealpathSyncFallback(filePath);
        if (seenRealPaths.has(realPath)) continue;
        if (!isWithinBoundaryFallback(realPath, dir)) continue;
        const identity = relative(dir, filePath).replace(/\\/g, '/');
        if (seenIdentities.has(identity)) continue;
        seenIdentities.add(identity);
        seenRealPaths.add(realPath);
        candidates.push({ path: filePath, scope });
      }
    }
  };

  // Project-level skills: new then legacy
  scanDirs([
    join(directory, PROJECT_SKILLS_SUBDIR),
    join(directory, LEGACY_PROJECT_SKILLS_SUBDIR),
  ], 'project');

  // User-level skills: new then legacy dirs
  scanDirs([USER_SKILLS_DIR, ...LEGACY_USER_SKILLS_DIRS], 'user');

  return candidates;
}

// Find matching skills (fallback)
function findMatchingSkillsFallback(prompt, directory, sessionId) {
  const promptLower = prompt.toLowerCase();
  const candidates = findSkillFilesFallback(directory);
  const matches = [];

  // Get or create session cache
  if (!injectedCacheFallback.has(sessionId)) {
    injectedCacheFallback.set(sessionId, new Set());
  }
  const alreadyInjected = injectedCacheFallback.get(sessionId);

  for (const candidate of candidates) {
    // Skip if already injected this session
    if (alreadyInjected.has(candidate.path)) continue;

    try {
      const content = readFileSync(candidate.path, 'utf-8');
      const skill = parseSkillFrontmatterFallback(content);
      if (!skill) continue;

      // Check if any trigger matches
      let score = 0;
      for (const trigger of skill.triggers) {
        if (promptLower.includes(trigger)) {
          score += 10;
        }
      }

      if (score > 0) {
        matches.push({
          path: candidate.path,
          name: skill.name,
          content: skill.content,
          score,
          scope: candidate.scope,
          triggers: skill.triggers
        });
      }
    } catch {
      // Ignore file read errors
    }
  }

  // Sort by score (descending) and limit
  matches.sort((a, b) => b.score - a.score);
  const selected = matches.slice(0, MAX_SKILLS_PER_SESSION);

  // Mark as injected
  for (const skill of selected) {
    alreadyInjected.add(skill.path);
  }

  return selected;
}

// =============================================================================
// Main Logic (uses bridge if available, fallback otherwise)
// =============================================================================

// Read all stdin
async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Find matching skills - delegates to bridge or fallback
function findMatchingSkills(prompt, directory, sessionId) {
  if (bridge) {
    // Use bridge (RECURSIVE discovery, persistent session cache)
    const matches = bridge.matchSkillsForInjection(prompt, directory, sessionId, {
      maxResults: MAX_SKILLS_PER_SESSION
    });

    // Mark as injected via bridge
    if (matches.length > 0) {
      bridge.markSkillsInjected(sessionId, matches.map(s => s.path), directory);
    }

    return matches;
  }

  // Fallback (NON-RECURSIVE, in-memory cache)
  return findMatchingSkillsFallback(prompt, directory, sessionId);
}

// Format skills for injection
function formatSkillsMessage(skills) {
  const lines = [
    '<mnemosyne>',
    '',
    '## Relevant Learned Skills',
    '',
    'The following skills from previous sessions may help:',
    ''
  ];

  for (const skill of skills) {
    lines.push(`### ${skill.name} (${skill.scope})`);

    // Add metadata block for programmatic parsing
    const metadata = {
      path: skill.path,
      triggers: skill.triggers,
      score: skill.score,
      scope: skill.scope
    };
    lines.push(`<skill-metadata>${JSON.stringify(metadata)}</skill-metadata>`);
    lines.push('');

    lines.push(skill.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('</mnemosyne>');
  return lines.join('\n');
}

// Main
async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    let data = {};
    try { data = JSON.parse(input); } catch { /* ignore parse errors */ }

    const prompt = data.prompt || '';
    const sessionId = data.sessionId || 'unknown';
    const directory = data.cwd || process.cwd();

    // Skip if no prompt
    if (!prompt) {
      console.log(JSON.stringify({ continue: true }));
      return;
    }

    const matchingSkills = findMatchingSkills(prompt, directory, sessionId);

    if (matchingSkills.length > 0) {
      console.log(JSON.stringify({
        continue: true,
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: formatSkillsMessage(matchingSkills)
        }
      }));
    } else {
      console.log(JSON.stringify({ continue: true }));
    }
  } catch (error) {
    // On any error, allow continuation
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
