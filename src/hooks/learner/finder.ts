/**
 * Skill Finder
 *
 * Discovers skill files using hybrid search (user + project).
 * Project skills override user skills with same ID.
 */

import { existsSync, readdirSync, realpathSync, mkdirSync } from 'fs';
import { join, normalize, sep, relative } from 'path';
import { USER_SKILLS_DIR, PROJECT_SKILLS_SUBDIR, LEGACY_USER_SKILLS_DIRS, LEGACY_PROJECT_SKILLS_SUBDIR, SKILL_EXTENSION, DEBUG_ENABLED, MAX_RECURSION_DEPTH } from './constants.js';
import type { SkillFileCandidate } from './types.js';

/**
 * Recursively find all skill files in a directory.
 */
function findSkillFilesRecursive(dir: string, results: string[], depth: number = 0): void {
  if (!existsSync(dir)) return;
  if (depth > MAX_RECURSION_DEPTH) return;

  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        findSkillFilesRecursive(fullPath, results, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith(SKILL_EXTENSION)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    if (DEBUG_ENABLED) {
      console.error('[learner] Error scanning directory:', error);
    }
  }
}

/**
 * Resolve symlinks safely with fallback.
 */
function safeRealpathSync(filePath: string): string {
  try {
    return realpathSync(filePath);
  } catch {
    return filePath;
  }
}

/**
 * Check if a resolved path is within a boundary directory.
 * Used to prevent symlink escapes.
 */
function isWithinBoundary(realPath: string, boundary: string): boolean {
  const normalizedReal = normalize(realPath);
  // On macOS, tmp paths may be under /var which resolves to /private/var via realpath.
  // Normalize the boundary via realpath as well to avoid false "symlink escape" blocks.
  const normalizedBoundary = normalize(safeRealpathSync(boundary));
  return normalizedReal === normalizedBoundary ||
         normalizedReal.startsWith(normalizedBoundary + sep);
}

/**
 * Find all skill files for a given project.
 * Returns project skills first (higher priority), then user skills.
 */
export function findSkillFiles(
  projectRoot: string | null,
  options?: { scope?: 'project' | 'user' | 'all' }
): SkillFileCandidate[] {
  const candidates: SkillFileCandidate[] = [];
  const seenRealPaths = new Set<string>();
  const scope = options?.scope ?? 'all';

  // Scan a list of dirs for a given scope. Dirs are ordered new-first so the
  // per-scope relative-path dedup keeps the migrated (~/.agents) copy and
  // skips a stale duplicate in a legacy dir, while distinct nested SKILL.md
  // files (e.g. alpha/SKILL.md vs beta/SKILL.md) remain loadable.
  // seenRealPaths still guards symlink loops globally.
  const scanDirs = (dirs: string[], scopeType: 'project' | 'user') => {
    const seenIdentities = new Set<string>();
    for (const dir of dirs) {
      const files: string[] = [];
      findSkillFilesRecursive(dir, files);

      for (const filePath of files) {
        const realPath = safeRealpathSync(filePath);
        if (seenRealPaths.has(realPath)) continue;
        if (!isWithinBoundary(realPath, dir)) {
          if (DEBUG_ENABLED) {
            console.warn('[learner] Symlink escape blocked:', filePath);
          }
          continue;
        }
        const identity = relative(dir, filePath).replace(/\\/g, '/');
        if (seenIdentities.has(identity)) continue;
        seenIdentities.add(identity);
        seenRealPaths.add(realPath);

        candidates.push({
          path: filePath,
          realPath,
          scope: scopeType,
          sourceDir: dir,
        });
      }
    }
  };

  // 1. Project-level skills: new (.agents/skills/droid-learned) then legacy (.omd/skills)
  if (projectRoot && (scope === 'project' || scope === 'all')) {
    scanDirs(
      [
        join(projectRoot, PROJECT_SKILLS_SUBDIR),
        join(projectRoot, LEGACY_PROJECT_SKILLS_SUBDIR),
      ],
      'project'
    );
  }

  // 2. User-level skills: new (~/.agents/skills/droid-learned) then legacy dirs
  if (scope === 'user' || scope === 'all') {
    scanDirs([USER_SKILLS_DIR, ...LEGACY_USER_SKILLS_DIRS], 'user');
  }

  return candidates;
}

/**
 * Get skills directory path for a scope.
 */
export function getSkillsDir(scope: 'user' | 'project', projectRoot?: string, sourceDir?: string): string {
  if (sourceDir) return sourceDir;
  if (scope === 'user') {
    return USER_SKILLS_DIR;
  }
  if (!projectRoot) {
    throw new Error('Project root is required for project-scoped skills');
  }
  return join(projectRoot, PROJECT_SKILLS_SUBDIR);
}

/**
 * Ensure skills directory exists.
 */
export function ensureSkillsDir(scope: 'user' | 'project', projectRoot?: string): boolean {
  const dir = getSkillsDir(scope, projectRoot);

  if (existsSync(dir)) {
    return true;
  }

  try {
    mkdirSync(dir, { recursive: true });
    return true;
  } catch (error) {
    if (DEBUG_ENABLED) {
      console.error('[learner] Error creating skills directory:', error);
    }
    return false;
  }
}
