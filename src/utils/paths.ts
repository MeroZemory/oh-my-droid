/**
 * Path Utilities
 *
 * Centralized path management for oh-my-droid state and config files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// State directories
export const LOCAL_STATE_DIR = '.omd/state';
export const GLOBAL_STATE_DIR = path.join(os.homedir(), '.factory', 'omd', 'state');

// Config directories
export const LOCAL_CONFIG_DIR = '.factory';
export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.factory', 'omd');

/**
 * Get local state directory path (.omd/state)
 */
export function getLocalStatePath(): string {
  return path.join(process.cwd(), LOCAL_STATE_DIR);
}

/**
 * Get global state directory path (~/.factory/omd/state)
 */
export function getGlobalStatePath(): string {
  return GLOBAL_STATE_DIR;
}

/**
 * Get local config directory path (.factory)
 */
export function getLocalConfigPath(): string {
  return path.join(process.cwd(), LOCAL_CONFIG_DIR);
}

/**
 * Get global config directory path (~/.factory/omd)
 */
export function getGlobalConfigPath(): string {
  return GLOBAL_CONFIG_DIR;
}

/**
 * Ensure directory exists, creating it if necessary
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Ensure local state directory exists
 */
export function ensureLocalStateDir(): void {
  ensureDir(getLocalStatePath());
}

/**
 * Ensure global state directory exists
 */
export function ensureGlobalStateDir(): void {
  ensureDir(getGlobalStatePath());
}

/**
 * Ensure local config directory exists
 */
export function ensureLocalConfigDir(): void {
  ensureDir(getLocalConfigPath());
}

/**
 * Ensure global config directory exists
 */
export function ensureGlobalConfigDir(): void {
  ensureDir(getGlobalConfigPath());
}

/**
 * Resolve path relative to project root
 */
export function resolveProjectPath(...segments: string[]): string {
  return path.join(process.cwd(), ...segments);
}

/**
 * Resolve path relative to home directory
 */
export function resolveHomePath(...segments: string[]): string {
  return path.join(os.homedir(), ...segments);
}

/**
 * Check if path exists
 */
export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get file stats
 */
export function getFileStats(filePath: string): fs.Stats | null {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}
