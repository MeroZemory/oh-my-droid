/**
 * Learned Skills Constants
 */

import { join } from 'path';
import { homedir } from 'os';

/**
 * Factory Droid's canonical skills directory (user/global): ~/.agents/skills.
 * Factory migrated installed skills here from ~/.factory/skills, which now holds
 * compatibility symlinks back to ~/.agents/skills/<name>.
 */
export const AGENTS_SKILLS_DIR = join(homedir(), '.agents', 'skills');

/**
 * User-level learned-skills directory (write target, read by skill-injector.mjs).
 * Namespaced under ~/.agents/skills so it never collides with Factory-native skills.
 */
export const USER_SKILLS_DIR = join(AGENTS_SKILLS_DIR, 'droid-learned');

/** Project-level learned-skills subdirectory (write target). */
export const PROJECT_SKILLS_SUBDIR = join('.agents', 'skills', 'droid-learned');

/**
 * Legacy learned-skills locations (read-only fallback for installs that haven't
 * migrated to ~/.agents yet). Kept so existing learned skills keep loading.
 * Covers both historical names (droid-learned and omc-learned).
 */
export const LEGACY_USER_SKILLS_DIRS = [
  join(homedir(), '.factory', 'skills', 'droid-learned'),
  join(homedir(), '.factory', 'skills', 'omc-learned'),
  join(homedir(), '.omd', 'skills'),
];

/** Legacy project-level skills subdirectory (read-only fallback). */
export const LEGACY_PROJECT_SKILLS_SUBDIR = join('.omd', 'skills');

/** Maximum recursion depth for skill file discovery */
export const MAX_RECURSION_DEPTH = 10;

/** Valid skill file extension */
export const SKILL_EXTENSION = '.md';

/** Feature flag key for enabling/disabling */
export const FEATURE_FLAG_KEY = 'learner.enabled';

/** Default feature flag value */
export const FEATURE_FLAG_DEFAULT = true;

/** Maximum skill content length (characters) */
export const MAX_SKILL_CONTENT_LENGTH = 4000;

/** Minimum quality score for auto-injection */
export const MIN_QUALITY_SCORE = 50;

/** Required metadata fields */
export const REQUIRED_METADATA_FIELDS = ['id', 'name', 'description', 'triggers', 'source'];

/** Maximum skills to inject per session */
export const MAX_SKILLS_PER_SESSION = 10;

/** Debug mode enabled */
export const DEBUG_ENABLED = process.env.OMC_DEBUG === '1';
