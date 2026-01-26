/**
 * Configuration Loader
 *
 * Handles loading and merging configuration from multiple sources:
 * - Default config
 * - User config: ~/.factory/omd.config.json
 * - Project config: .factory/omd.config.json
 * - Environment variables
 *
 * Priority (highest to lowest):
 * 1. Environment variables
 * 2. Project config
 * 3. User config
 * 4. Default config
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getLocalConfigPath,
  getGlobalConfigPath,
  pathExists
} from './utils/paths.js';
import {
  safeJsonParse
} from './utils/json.js';

/**
 * Plugin configuration structure
 */
export interface PluginConfig {
  /** Default model for agents */
  defaultModel?: string;
  /** Agent-specific configurations */
  agents?: Record<string, {
    model?: string;
    enabled?: boolean;
    [key: string]: unknown;
  }>;
  /** Feature flags */
  features?: {
    parallelExecution?: boolean;
    autoContextInjection?: boolean;
    [key: string]: unknown;
  };
  /** Custom configuration */
  [key: string]: unknown;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: PluginConfig = {
  defaultModel: 'claude-sonnet-4-5-20250929',
  agents: {},
  features: {
    parallelExecution: true,
    autoContextInjection: true
  }
};

/**
 * Configuration file locations
 */
export interface ConfigPaths {
  user: string;
  project: string;
}

/**
 * Get configuration file paths
 */
export function getConfigPaths(): ConfigPaths {
  return {
    user: path.join(getGlobalConfigPath(), 'omd.config.json'),
    project: path.join(getLocalConfigPath(), 'omd.config.json')
  };
}

/**
 * Load and parse a JSON file
 */
export function loadJsonFile(filePath: string): PluginConfig | null {
  if (!pathExists(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parseResult = safeJsonParse<PluginConfig>(content);

    if (!parseResult.success) {
      console.warn(`Warning: Parse error in ${filePath}:`, parseResult.error);
      return null;
    }

    return parseResult.data || null;
  } catch (error) {
    console.error(`Error loading config from ${filePath}:`, error);
    return null;
  }
}

/**
 * Deep merge two objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue !== undefined &&
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

/**
 * Load configuration from environment variables
 */
export function loadEnvConfig(): Partial<PluginConfig> {
  const config: Partial<PluginConfig> = {};

  // Default model from environment
  if (process.env.OMD_DEFAULT_MODEL) {
    config.defaultModel = process.env.OMD_DEFAULT_MODEL;
  }

  // Feature flags from environment
  if (process.env.OMD_PARALLEL_EXECUTION !== undefined) {
    config.features = {
      ...config.features,
      parallelExecution: process.env.OMD_PARALLEL_EXECUTION === 'true'
    };
  }

  if (process.env.OMD_AUTO_CONTEXT !== undefined) {
    config.features = {
      ...config.features,
      autoContextInjection: process.env.OMD_AUTO_CONTEXT === 'true'
    };
  }

  return config;
}

/**
 * Load and merge all configuration sources
 *
 * Priority (highest to lowest):
 * 1. Environment variables
 * 2. Project config
 * 3. User config
 * 4. Default config
 */
export function loadConfig(): PluginConfig {
  const paths = getConfigPaths();

  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Merge user config
  const userConfig = loadJsonFile(paths.user);
  if (userConfig) {
    config = deepMerge(config, userConfig);
  }

  // Merge project config (takes precedence over user)
  const projectConfig = loadJsonFile(paths.project);
  if (projectConfig) {
    config = deepMerge(config, projectConfig);
  }

  // Merge environment variables (highest precedence)
  const envConfig = loadEnvConfig();
  config = deepMerge(config, envConfig);

  return config;
}

/**
 * Get configuration value with fallback
 */
export function getConfigValue<T>(
  config: PluginConfig,
  path: string,
  defaultValue: T
): T {
  const keys = path.split('.');
  let current: unknown = config;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return (current as T) ?? defaultValue;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(
  config: PluginConfig,
  featureName: string
): boolean {
  return getConfigValue(config, `features.${featureName}`, false);
}

/**
 * Get agent configuration
 */
export function getAgentConfig(
  config: PluginConfig,
  agentName: string
): Record<string, unknown> | undefined {
  return config.agents?.[agentName];
}

/**
 * Get agent model
 */
export function getAgentModel(
  config: PluginConfig,
  agentName: string
): string {
  const agentConfig = getAgentConfig(config, agentName);
  return (agentConfig?.model as string) ?? config.defaultModel ?? DEFAULT_CONFIG.defaultModel!;
}

/**
 * Check if agent is enabled
 */
export function isAgentEnabled(
  config: PluginConfig,
  agentName: string
): boolean {
  const agentConfig = getAgentConfig(config, agentName);
  return agentConfig?.enabled !== false; // Enabled by default
}
