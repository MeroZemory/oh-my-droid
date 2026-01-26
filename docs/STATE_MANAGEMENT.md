# State Management System

Complete state management implementation for the oh-my-droid plugin, adapted from oh-my-claudecode.

## Overview

This implementation provides unified state and configuration management for the oh-my-droid plugin with:

- **Type-safe operations** - Full TypeScript support with generics
- **Auto-directory creation** - Automatically creates required directories
- **Local and global state** - Support for both project-local and user-global state
- **Safe JSON handling** - Error-resistant parsing and serialization
- **Configuration hierarchy** - Multi-level config with proper precedence

## Directory Structure

```
src/
├── state-manager.ts           # State file management
├── config-loader.ts           # Configuration loading
├── utils/
│   ├── paths.ts              # Path utilities
│   └── json.ts               # JSON utilities
├── __tests__/
│   ├── state-manager.test.ts # State manager tests
│   └── config-loader.test.ts # Config loader tests
└── index.ts                   # Main entry point
```

## State File Locations

### Local State
- Location: `.omd/state/{name}.json`
- Use: Project-specific state
- Example: `.omd/state/droid-config.json`

### Global State
- Location: `~/.factory/omd/state/{name}.json`
- Use: User-level state across projects
- Example: `~/.factory/omd/state/user-prefs.json`

## Configuration File Locations

### Project Config
- Location: `.factory/omd.config.json`
- Priority: 2 (overrides user config)

### User Config
- Location: `~/.factory/omd/omd.config.json`
- Priority: 3 (overrides defaults)

### Environment Variables
- Priority: 1 (highest priority)
- Prefix: `OMD_*`
- Examples:
  - `OMD_DEFAULT_MODEL`
  - `OMD_PARALLEL_EXECUTION`
  - `OMD_AUTO_CONTEXT`

## Usage Examples

### State Manager - Function API

```typescript
import { readState, writeState, clearState, stateExists, StateLocation } from 'oh-my-droid';

// Write state
const result = writeState('my-state', { foo: 'bar' }, StateLocation.LOCAL);
if (result.success) {
  console.log(`State written to: ${result.path}`);
}

// Read state
const state = readState<{ foo: string }>('my-state', StateLocation.LOCAL);
if (state.exists) {
  console.log(`State value: ${state.data?.foo}`);
}

// Check if state exists
if (stateExists('my-state', StateLocation.LOCAL)) {
  console.log('State exists');
}

// Clear state
clearState('my-state', StateLocation.LOCAL);
```

### State Manager - Class API

```typescript
import { createStateManager, StateLocation } from 'oh-my-droid';

interface MyState {
  count: number;
  name: string;
}

// Create a state manager
const manager = createStateManager<MyState>('my-state', StateLocation.LOCAL);

// Set state
manager.set({ count: 0, name: 'initial' });

// Get state
const state = manager.get();
console.log(state?.count); // 0

// Update state
manager.update((current) => ({
  ...current,
  count: (current?.count ?? 0) + 1
}));

// Check existence
if (manager.exists()) {
  console.log('State exists');
}

// Clear state
manager.clear();
```

### Config Loader

```typescript
import {
  loadConfig,
  getConfigValue,
  isFeatureEnabled,
  getAgentModel,
  isAgentEnabled
} from 'oh-my-droid';

// Load configuration
const config = loadConfig();

// Get config values
const model = getConfigValue(config, 'defaultModel', 'fallback-model');

// Check features
if (isFeatureEnabled(config, 'parallelExecution')) {
  console.log('Parallel execution enabled');
}

// Get agent configuration
const agentModel = getAgentModel(config, 'executor');
const enabled = isAgentEnabled(config, 'executor');

console.log(`Agent model: ${agentModel}, enabled: ${enabled}`);
```

### Configuration File Format

```json
{
  "defaultModel": "claude-sonnet-4-5-20250929",
  "agents": {
    "executor": {
      "model": "claude-sonnet-4-5-20250929",
      "enabled": true
    },
    "architect": {
      "model": "claude-opus-4-5-20251101",
      "enabled": true
    }
  },
  "features": {
    "parallelExecution": true,
    "autoContextInjection": true
  }
}
```

## API Reference

### State Manager Functions

#### `readState<T>(name: string, location?: StateLocation): StateReadResult<T>`
Read state from file.

**Returns:**
```typescript
{
  exists: boolean;
  data?: T;
  foundAt?: string;
}
```

#### `writeState<T>(name: string, data: T, location?: StateLocation): StateWriteResult`
Write state to file.

**Returns:**
```typescript
{
  success: boolean;
  path: string;
  error?: string;
}
```

#### `clearState(name: string, location?: StateLocation): StateClearResult`
Remove state file.

**Returns:**
```typescript
{
  success: boolean;
  path?: string;
  error?: string;
}
```

#### `stateExists(name: string, location?: StateLocation): boolean`
Check if state file exists.

#### `listStates(location?: StateLocation): string[]`
List all state file names in a location.

### State Manager Class

#### `constructor(name: string, location?: StateLocation)`
Create a new state manager instance.

#### `read(): StateReadResult<T>`
Read the state.

#### `write(data: T): StateWriteResult`
Write the state.

#### `clear(): StateClearResult`
Clear the state.

#### `exists(): boolean`
Check if state exists.

#### `get(): T | undefined`
Get state data.

#### `set(data: T): boolean`
Set state data.

#### `update(updater: (current: T | undefined) => T): boolean`
Update state with a function.

### Config Loader Functions

#### `loadConfig(): PluginConfig`
Load and merge configuration from all sources.

#### `getConfigValue<T>(config: PluginConfig, path: string, defaultValue: T): T`
Get a configuration value by path.

#### `isFeatureEnabled(config: PluginConfig, featureName: string): boolean`
Check if a feature is enabled.

#### `getAgentModel(config: PluginConfig, agentName: string): string`
Get the model for an agent.

#### `isAgentEnabled(config: PluginConfig, agentName: string): boolean`
Check if an agent is enabled.

## Path Utilities

```typescript
import {
  getLocalStatePath,
  getGlobalStatePath,
  ensureDir,
  pathExists
} from 'oh-my-droid';

// Get state directory paths
const localPath = getLocalStatePath();  // .omd/state
const globalPath = getGlobalStatePath(); // ~/.factory/omd/state

// Ensure directory exists
ensureDir('/path/to/directory');

// Check if path exists
if (pathExists('/path/to/file')) {
  console.log('File exists');
}
```

## JSON Utilities

```typescript
import {
  safeJsonParse,
  safeJsonStringify,
  isValidJson
} from 'oh-my-droid';

// Safe parsing
const result = safeJsonParse<MyType>('{"foo": "bar"}');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}

// Safe stringification
const stringifyResult = safeJsonStringify({ foo: 'bar' }, true);
if (stringifyResult.success) {
  console.log(stringifyResult.json);
}

// Validation
if (isValidJson('{"valid": "json"}')) {
  console.log('Valid JSON');
}
```

## Testing

The implementation includes comprehensive tests:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Build TypeScript
npm run build
```

### Test Files
- `/Users/merozemory/projects/t-soft/oh-my-droid/src/__tests__/state-manager.test.ts`
- `/Users/merozemory/projects/t-soft/oh-my-droid/src/__tests__/config-loader.test.ts`

## Type Safety

All functions are fully typed with TypeScript:

```typescript
interface DroidState {
  activeTask: string;
  taskCount: number;
}

// Type-safe state management
const manager = createStateManager<DroidState>('droid-state');
manager.set({
  activeTask: 'testing',
  taskCount: 42
});

const state = manager.get();
// state is typed as DroidState | undefined
console.log(state?.taskCount); // ✓ Type-safe access
```

## Differences from oh-my-claudecode

1. **Path structure**: Uses `.omd` and `.factory/omd` instead of `.omc`
2. **Config naming**: Uses `omd.config.json` instead of multiple config files
3. **Legacy support**: Simplified, no legacy location migration
4. **Simpler API**: Focused on essential features for oh-my-droid

## Files Created

1. `/Users/merozemory/projects/t-soft/oh-my-droid/src/state-manager.ts` - State file management
2. `/Users/merozemory/projects/t-soft/oh-my-droid/src/config-loader.ts` - Configuration loading
3. `/Users/merozemory/projects/t-soft/oh-my-droid/src/utils/paths.ts` - Path utilities
4. `/Users/merozemory/projects/t-soft/oh-my-droid/src/utils/json.ts` - JSON utilities
5. `/Users/merozemory/projects/t-soft/oh-my-droid/src/index.ts` - Updated with exports
6. `/Users/merozemory/projects/t-soft/oh-my-droid/src/__tests__/state-manager.test.ts` - State tests
7. `/Users/merozemory/projects/t-soft/oh-my-droid/src/__tests__/config-loader.test.ts` - Config tests

## Build Output

All modules are compiled to `/Users/merozemory/projects/t-soft/oh-my-droid/dist/` with:
- JavaScript (.js)
- Type declarations (.d.ts)
- Source maps (.js.map, .d.ts.map)

## Next Steps

To use this in your droid implementations:

1. Import the state manager in your droid files
2. Create droid-specific state types
3. Use the config loader for droid configuration
4. Run tests to verify functionality
5. Build and integrate with Factory AI Droid CLI

## Example: Droid State Management

```typescript
// droids/my-droid.ts
import { createStateManager, StateLocation } from '../src/index.js';

interface MyDroidState {
  status: 'idle' | 'working' | 'error';
  lastTask?: string;
  completedTasks: number;
}

const stateManager = createStateManager<MyDroidState>(
  'my-droid',
  StateLocation.LOCAL
);

// Initialize state
if (!stateManager.exists()) {
  stateManager.set({
    status: 'idle',
    completedTasks: 0
  });
}

// Update on task completion
export function onTaskComplete(taskName: string) {
  stateManager.update((current) => ({
    ...current,
    status: 'idle',
    lastTask: taskName,
    completedTasks: (current?.completedTasks ?? 0) + 1
  }));
}
```
