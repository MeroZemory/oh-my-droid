/**
 * OMC HUD - State Management
 *
 * Manages HUD state file for background task tracking.
 * Follows patterns from ultrawork-state.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { OmdHudState, BackgroundTask, HudConfig } from './types.js';
import { DEFAULT_HUD_CONFIG, PRESET_CONFIGS } from './types.js';
import { cleanupStaleBackgroundTasks, markOrphanedTasksAsStale } from './background-cleanup.js';

// ============================================================================
// Path Helpers
// ============================================================================

/**
 * Get the HUD state file path in the project's .omd/state directory
 */
function getLocalStateFilePath(directory?: string): string {
  const baseDir = directory || process.cwd();
  const omdStateDir = join(baseDir, '.omd', 'state');
  return join(omdStateDir, 'hud-state.json');
}

/**
 * Get global HUD state file path (for cross-session persistence)
 */
function getGlobalStateFilePath(): string {
  return join(homedir(), '.factory', '.omd', 'hud-state.json');
}

/**
 * Get the HUD config file path
 */
function getConfigFilePath(): string {
  return join(homedir(), '.factory', '.omd', 'hud-config.json');
}

/**
 * Ensure the .omd/state directory exists
 */
function ensureStateDir(directory?: string): void {
  const baseDir = directory || process.cwd();
  const omdStateDir = join(baseDir, '.omd', 'state');
  if (!existsSync(omdStateDir)) {
    mkdirSync(omdStateDir, { recursive: true });
  }
}

/**
 * Ensure the ~/.factory/.omd directory exists
 */
function ensureGlobalConfigDir(): void {
  const configDir = join(homedir(), '.factory', '.omd');
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Ensure the ~/.factory directory exists
 */
function ensureGlobalStateDir(): void {
  const stateDir = join(homedir(), '.factory', '.omd');
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
}

// ============================================================================
// HUD State Operations
// ============================================================================

/**
 * Read HUD state from disk (checks new local, legacy local, then global)
 */
export function readHudState(directory?: string): OmdHudState | null {
  // Check new local state first (.omd/state/hud-state.json)
  const localStateFile = getLocalStateFilePath(directory);
  if (existsSync(localStateFile)) {
    try {
      const content = readFileSync(localStateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Fall through to legacy check
    }
  }

  // Check legacy local state (.omd/hud-state.json)
  const baseDir = directory || process.cwd();
  const legacyStateFile = join(baseDir, '.omd', 'hud-state.json');
  if (existsSync(legacyStateFile)) {
    try {
      const content = readFileSync(legacyStateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Fall through to global check
    }
  }

  // Check global state
  const globalStateFile = getGlobalStateFilePath();
  if (existsSync(globalStateFile)) {
    try {
      const content = readFileSync(globalStateFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Write HUD state to disk (both local and global for redundancy)
 */
export function writeHudState(
  state: OmdHudState,
  directory?: string
): boolean {
  try {
    // Write to local .omd
    ensureStateDir(directory);
    const localStateFile = getLocalStateFilePath(directory);
    writeFileSync(localStateFile, JSON.stringify(state, null, 2));

    // Write to global ~/.factory for cross-session persistence
    ensureGlobalStateDir();
    const globalStateFile = getGlobalStateFilePath();
    writeFileSync(globalStateFile, JSON.stringify(state, null, 2));

    return true;
  } catch {
    return false;
  }
}

/**
 * Create a new empty HUD state
 */
export function createEmptyHudState(): OmdHudState {
  return {
    timestamp: new Date().toISOString(),
    backgroundTasks: [],
  };
}

/**
 * Get running background tasks from state
 */
export function getRunningTasks(state: OmdHudState | null): BackgroundTask[] {
  if (!state) return [];
  return state.backgroundTasks.filter((task) => task.status === 'running');
}

/**
 * Get background task count string (e.g., "3/5")
 */
export function getBackgroundTaskCount(state: OmdHudState | null): {
  running: number;
  max: number;
} {
  const MAX_CONCURRENT = 5;
  const running = state
    ? state.backgroundTasks.filter((t) => t.status === 'running').length
    : 0;
  return { running, max: MAX_CONCURRENT };
}

// ============================================================================
// HUD Config Operations
// ============================================================================

/**
 * Read HUD configuration from disk
 */
export function readHudConfig(): HudConfig {
  const configFile = getConfigFilePath();
  if (!existsSync(configFile)) {
    return DEFAULT_HUD_CONFIG;
  }

  try {
    const content = readFileSync(configFile, 'utf-8');
    const config = JSON.parse(content) as Partial<HudConfig>;

    // Merge with defaults to ensure all fields exist
    return {
      preset: config.preset ?? DEFAULT_HUD_CONFIG.preset,
      elements: {
        ...DEFAULT_HUD_CONFIG.elements,
        ...config.elements,
      },
      thresholds: {
        ...DEFAULT_HUD_CONFIG.thresholds,
        ...config.thresholds,
      },
    };
  } catch {
    return DEFAULT_HUD_CONFIG;
  }
}

/**
 * Write HUD configuration to disk
 */
export function writeHudConfig(config: HudConfig): boolean {
  try {
    ensureGlobalConfigDir();
    const configFile = getConfigFilePath();
    writeFileSync(configFile, JSON.stringify(config, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Apply a preset to the configuration
 */
export function applyPreset(preset: HudConfig['preset']): HudConfig {
  const config = readHudConfig();
  const presetElements = PRESET_CONFIGS[preset];

  const newConfig: HudConfig = {
    ...config,
    preset,
    elements: {
      ...config.elements,
      ...presetElements,
    },
  };

  writeHudConfig(newConfig);
  return newConfig;
}

/**
 * Initialize HUD state with cleanup of stale/orphaned tasks.
 * Should be called on HUD startup.
 */
export async function initializeHUDState(): Promise<void> {
  // Clean up stale background tasks from previous sessions
  const removedStale = await cleanupStaleBackgroundTasks();
  const markedOrphaned = await markOrphanedTasksAsStale();

  if (removedStale > 0 || markedOrphaned > 0) {
    console.error(`HUD cleanup: removed ${removedStale} stale tasks, marked ${markedOrphaned} orphaned tasks`);
  }
}
