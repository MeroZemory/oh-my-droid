/**
 * State Manager
 *
 * Unified state management that standardizes state file locations:
 * - Local state: .omd/state/{name}.json
 * - Global state: ~/.factory/omd/state/{name}.json
 *
 * Features:
 * - Type-safe read/write operations
 * - Auto-create directories
 * - Legacy location support (for migration)
 * - State cleanup utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getLocalStatePath,
  getGlobalStatePath,
  ensureDir,
  pathExists
} from './utils/paths.js';
import {
  safeJsonParse,
  safeJsonStringify
} from './utils/json.js';

/**
 * Location where state should be stored
 */
export enum StateLocation {
  /** Local project state: .omd/state/{name}.json */
  LOCAL = 'local',
  /** Global user state: ~/.factory/omd/state/{name}.json */
  GLOBAL = 'global'
}

/**
 * Generic state data structure
 */
export type StateData = Record<string, unknown>;

/**
 * Result of a state read operation
 */
export interface StateReadResult<T = StateData> {
  /** Whether state was found */
  exists: boolean;
  /** The state data (if found) */
  data?: T;
  /** Where the state was found */
  foundAt?: string;
}

/**
 * Result of a state write operation
 */
export interface StateWriteResult {
  /** Whether write was successful */
  success: boolean;
  /** Path where state was written */
  path: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Result of a state clear operation
 */
export interface StateClearResult {
  /** Whether state was cleared */
  success: boolean;
  /** Path that was cleared */
  path?: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Get the standard path for a state file
 */
export function getStatePath(name: string, location: StateLocation): string {
  const baseDir = location === StateLocation.LOCAL
    ? getLocalStatePath()
    : getGlobalStatePath();
  return path.join(baseDir, `${name}.json`);
}

/**
 * Ensure state directory exists
 */
export function ensureStateDir(location: StateLocation): void {
  const dir = location === StateLocation.LOCAL
    ? getLocalStatePath()
    : getGlobalStatePath();
  ensureDir(dir);
}

/**
 * Read state from file
 *
 * Reads state from the standard location.
 * Returns both the data and where it was found.
 */
export function readState<T = StateData>(
  name: string,
  location: StateLocation = StateLocation.LOCAL
): StateReadResult<T> {
  const statePath = getStatePath(name, location);

  if (!pathExists(statePath)) {
    return {
      exists: false
    };
  }

  try {
    const content = fs.readFileSync(statePath, 'utf-8');
    const parseResult = safeJsonParse<T>(content);

    if (!parseResult.success || parseResult.data === undefined) {
      console.warn(`Failed to parse state from ${statePath}:`, parseResult.error);
      return {
        exists: false
      };
    }

    return {
      exists: true,
      data: parseResult.data,
      foundAt: statePath
    };
  } catch (error) {
    console.warn(`Failed to read state from ${statePath}:`, error);
    return {
      exists: false
    };
  }
}

/**
 * Write state to file
 *
 * Always writes to the standard location.
 * Creates directories if they don't exist.
 */
export function writeState<T = StateData>(
  name: string,
  data: T,
  location: StateLocation = StateLocation.LOCAL
): StateWriteResult {
  const statePath = getStatePath(name, location);

  try {
    // Ensure directory exists
    ensureStateDir(location);

    // Serialize data
    const stringifyResult = safeJsonStringify(data, true);
    if (!stringifyResult.success || !stringifyResult.json) {
      return {
        success: false,
        path: statePath,
        error: stringifyResult.error || 'Failed to serialize data'
      };
    }

    // Write state
    fs.writeFileSync(statePath, stringifyResult.json, 'utf-8');

    return {
      success: true,
      path: statePath
    };
  } catch (error) {
    return {
      success: false,
      path: statePath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Clear state file
 *
 * Removes the state file from the specified location.
 */
export function clearState(
  name: string,
  location: StateLocation = StateLocation.LOCAL
): StateClearResult {
  const statePath = getStatePath(name, location);

  try {
    if (!pathExists(statePath)) {
      return {
        success: true,
        path: statePath
      };
    }

    fs.unlinkSync(statePath);

    return {
      success: true,
      path: statePath
    };
  } catch (error) {
    return {
      success: false,
      path: statePath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check if state exists
 *
 * Returns true if the state file exists in the specified location.
 */
export function stateExists(
  name: string,
  location: StateLocation = StateLocation.LOCAL
): boolean {
  const statePath = getStatePath(name, location);
  return pathExists(statePath);
}

/**
 * List all state files in a location
 */
export function listStates(location: StateLocation = StateLocation.LOCAL): string[] {
  const dir = location === StateLocation.LOCAL
    ? getLocalStatePath()
    : getGlobalStatePath();

  if (!pathExists(dir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(dir);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.slice(0, -5)); // Remove .json extension
  } catch (error) {
    console.warn(`Failed to list states from ${dir}:`, error);
    return [];
  }
}

/**
 * State Manager Class
 *
 * Object-oriented interface for managing a specific state.
 */
export class StateManager<T = StateData> {
  constructor(
    private name: string,
    private location: StateLocation = StateLocation.LOCAL
  ) {}

  read(): StateReadResult<T> {
    return readState<T>(this.name, this.location);
  }

  write(data: T): StateWriteResult {
    return writeState(this.name, data, this.location);
  }

  clear(): StateClearResult {
    return clearState(this.name, this.location);
  }

  exists(): boolean {
    return stateExists(this.name, this.location);
  }

  get(): T | undefined {
    return this.read().data;
  }

  set(data: T): boolean {
    return this.write(data).success;
  }

  update(updater: (current: T | undefined) => T): boolean {
    const current = this.get();
    const updated = updater(current);
    return this.set(updated);
  }
}

/**
 * Create a state manager for a specific state
 */
export function createStateManager<T = StateData>(
  name: string,
  location: StateLocation = StateLocation.LOCAL
): StateManager<T> {
  return new StateManager<T>(name, location);
}
