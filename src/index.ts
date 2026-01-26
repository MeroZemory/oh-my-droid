/**
 * Oh My Droid - Multi-agent orchestration plugin
 * Main entry point for plugin initialization
 */

// State Manager
export {
  StateLocation,
  StateData,
  StateReadResult,
  StateWriteResult,
  StateClearResult,
  StateManager,
  getStatePath,
  ensureStateDir,
  readState,
  writeState,
  clearState,
  stateExists,
  listStates,
  createStateManager
} from './state-manager.js';

// Config Loader
export {
  PluginConfig,
  ConfigPaths,
  DEFAULT_CONFIG,
  getConfigPaths,
  loadJsonFile,
  deepMerge,
  loadEnvConfig,
  loadConfig,
  getConfigValue,
  isFeatureEnabled,
  getAgentConfig,
  getAgentModel,
  isAgentEnabled
} from './config-loader.js';

// Utilities
export {
  getLocalStatePath,
  getGlobalStatePath,
  getLocalConfigPath,
  getGlobalConfigPath,
  ensureDir,
  ensureLocalStateDir,
  ensureGlobalStateDir,
  ensureLocalConfigDir,
  ensureGlobalConfigDir,
  resolveProjectPath,
  resolveHomePath,
  pathExists,
  getFileStats
} from './utils/paths.js';

export {
  JsonParseResult,
  safeJsonParse,
  safeJsonStringify,
  parseJsonOrDefault,
  deepCloneJson,
  isValidJson,
  prettyJson,
  compactJson
} from './utils/json.js';

export function initialize() {
  console.log('Oh My Droid plugin initialized');
}

export function shutdown() {
  console.log('Oh My Droid plugin shutting down');
}
