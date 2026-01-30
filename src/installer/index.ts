/**
 * Installer Module
 *
 * Handles installation of OMD agents, commands, and configuration
 * into the Factory config directory (~/.factory/omd/).
 *
 * This replicates the functionality of scripts/install.sh but in TypeScript,
 * allowing npm postinstall to work properly.
 *
 * Cross-platform support:
 * - Windows: Uses Node.js-based hook scripts (.mjs)
 * - Unix (macOS, Linux): Uses Bash scripts (.sh) by default
 *
 * Environment variables:
 * - OMD_USE_NODE_HOOKS=1: Force Node.js hooks on any platform
 * - OMD_USE_BASH_HOOKS=1: Force Bash hooks (Unix only)
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, chmodSync, readdirSync, unlinkSync, rmdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { execSync } from 'child_process';
import {
  HOOK_SCRIPTS,
  getHookScripts,
  getHooksSettingsConfig,
  isWindows,
  shouldUseNodeHooks,
  MIN_NODE_VERSION
} from './hooks.js';

/** Factory configuration directory */
export const FACTORY_CONFIG_DIR = join(homedir(), '.factory', 'omd');
export const DROIDS_DIR = join(FACTORY_CONFIG_DIR, 'droids');
export const COMMANDS_DIR = join(FACTORY_CONFIG_DIR, 'commands');
export const SKILLS_DIR = join(FACTORY_CONFIG_DIR, 'skills');
export const HOOKS_DIR = join(FACTORY_CONFIG_DIR, 'hooks');
export const HUD_DIR = join(FACTORY_CONFIG_DIR, 'hud');
export const SETTINGS_FILE = join(FACTORY_CONFIG_DIR, 'settings.json');
export const VERSION_FILE = join(FACTORY_CONFIG_DIR, '.omd-version.json');

/** Factory Droid standard commands directory (slash commands) */
export const FACTORY_COMMANDS_DIR = join(homedir(), '.factory', 'commands');

/**
 * Core commands - DISABLED for v3.0+
 * All commands are now plugin-scoped skills managed by Factory.
 * The installer no longer copies commands to ~/.factory/omd/commands/
 */
export const CORE_COMMANDS: string[] = [];

/** Current version */
export const VERSION = '1.0.0';

/** Installation result */
export interface InstallResult {
  success: boolean;
  message: string;
  installedDroids: string[];
  installedCommands: string[];
  installedSkills: string[];
  hooksConfigured: boolean;
  errors: string[];
}

/** Installation options */
export interface InstallOptions {
  force?: boolean;
  verbose?: boolean;
  skipFactoryCheck?: boolean;
}

/**
 * Check if the current Node.js version meets the minimum requirement
 */
export function checkNodeVersion(): { valid: boolean; current: number; required: number } {
  const current = parseInt(process.versions.node.split('.')[0], 10);
  return {
    valid: current >= MIN_NODE_VERSION,
    current,
    required: MIN_NODE_VERSION
  };
}

/**
 * Check if Factory is installed
 * Uses 'where' on Windows, 'which' on Unix
 */
export function isFactoryInstalled(): boolean {
  try {
    const command = isWindows() ? 'where factory' : 'which factory';
    execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if we're running in Factory plugin context
 *
 * When installed as a plugin, we should NOT copy files to ~/.factory/omd/
 * because the plugin system already handles file access via ${FACTORY_PLUGIN_ROOT}.
 *
 * Detection method:
 * - Check if FACTORY_PLUGIN_ROOT environment variable is set (primary method)
 * - This env var is set by the Factory plugin system when running plugin hooks
 *
 * @returns true if running in plugin context, false otherwise
 */
export function isRunningAsPlugin(): boolean {
  // Check for FACTORY_PLUGIN_ROOT env var (set by plugin system)
  // This is the most reliable indicator that we're running as a plugin
  return !!process.env.FACTORY_PLUGIN_ROOT;
}

/**
 * Get the package root directory
 * From dist/installer/index.js, go up to package root
 */
export function getPackageDir(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  // From dist/installer/index.js, go up to package root
  return join(__dirname, '..', '..');
}

/**
 * Load droid definitions from /droids/*.md files
 */
function loadDroidDefinitions(): Record<string, string> {
  const droidsDir = join(getPackageDir(), 'droids');
  const definitions: Record<string, string> = {};

  if (!existsSync(droidsDir)) {
    console.error(`FATAL: droids directory not found: ${droidsDir}`);
    process.exit(1);
  }

  for (const file of readdirSync(droidsDir)) {
    if (file.endsWith('.md')) {
      definitions[file] = readFileSync(join(droidsDir, file), 'utf-8');
    }
  }

  return definitions;
}

/**
 * Load command definitions from /commands/*.md files
 * Note: oh-my-droid uses skills instead of commands, so this returns empty if commands dir doesn't exist
 */
function loadCommandDefinitions(): Record<string, string> {
  const commandsDir = join(getPackageDir(), 'commands');
  const definitions: Record<string, string> = {};

  // Commands directory is optional in oh-my-droid (we use skills instead)
  if (!existsSync(commandsDir)) {
    return definitions;
  }

  for (const file of readdirSync(commandsDir)) {
    if (file.endsWith('.md')) {
      definitions[file] = readFileSync(join(commandsDir, file), 'utf-8');
    }
  }

  return definitions;
}

/**
 * Load FACTORY.md content from /docs/FACTORY.md
 */
function loadFactoryMdContent(): string {
  const factoryMdPath = join(getPackageDir(), 'docs', 'FACTORY.md');

  if (!existsSync(factoryMdPath)) {
    console.error(`FATAL: FACTORY.md not found: ${factoryMdPath}`);
    process.exit(1);
  }

  return readFileSync(factoryMdPath, 'utf-8');
}

/**
 * Install OMD agents, commands, skills, and hooks
 */
export function install(options: InstallOptions = {}): InstallResult {
  const result: InstallResult = {
    success: false,
    message: '',
    installedDroids: [],
    installedCommands: [],
    installedSkills: [],
    hooksConfigured: false,
    errors: []
  };

  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  // Check Node.js version (required for Node.js hooks on Windows)
  const nodeCheck = checkNodeVersion();
  if (!nodeCheck.valid) {
    log(`Warning: Node.js ${nodeCheck.required}+ required, found ${nodeCheck.current}`);
    if (isWindows()) {
      result.errors.push(`Node.js ${nodeCheck.required}+ is required for Windows support. Found: ${nodeCheck.current}`);
      result.message = `Installation failed: Node.js ${nodeCheck.required}+ required`;
      return result;
    }
    // On Unix, we can still use bash hooks, so just warn
  }

  // Log platform info
  log(`Platform: ${process.platform} (${shouldUseNodeHooks() ? 'Node.js hooks' : 'Bash hooks'})`);

  // Check if running as a plugin
  const runningAsPlugin = isRunningAsPlugin();
  if (runningAsPlugin) {
    log('Detected Factory plugin context - skipping agent/command file installation');
    log('Plugin files are managed by Factory plugin system');
    log('Will still install HUD statusline...');
    // Don't return early - continue to install HUD
  }

  // Check Factory installation (optional)
  if (!options.skipFactoryCheck && !isFactoryInstalled()) {
    log('Warning: Factory not found. Install it first:');
    if (isWindows()) {
      log('  Visit Factory documentation for Windows installation');
    } else {
      log('  Follow Factory installation instructions');
    }
    // Continue anyway - user might be installing ahead of time
  }

  try {
    // Ensure base config directory exists
    if (!existsSync(FACTORY_CONFIG_DIR)) {
      mkdirSync(FACTORY_CONFIG_DIR, { recursive: true });
    }

    // Skip droid/command/hook file installation when running as plugin
    // Plugin system handles these via ${DROID_PLUGIN_ROOT}
    if (!runningAsPlugin) {
      // Create directories
      log('Creating directories...');
      if (!existsSync(DROIDS_DIR)) {
        mkdirSync(DROIDS_DIR, { recursive: true });
      }
      if (!existsSync(COMMANDS_DIR)) {
        mkdirSync(COMMANDS_DIR, { recursive: true });
      }
      if (!existsSync(SKILLS_DIR)) {
        mkdirSync(SKILLS_DIR, { recursive: true });
      }
      if (!existsSync(HOOKS_DIR)) {
        mkdirSync(HOOKS_DIR, { recursive: true });
      }

      // Install droids
      log('Installing droid definitions...');
      for (const [filename, content] of Object.entries(loadDroidDefinitions())) {
        const filepath = join(DROIDS_DIR, filename);
        if (existsSync(filepath) && !options.force) {
          log(`  Skipping ${filename} (already exists)`);
        } else {
          writeFileSync(filepath, content as string);
          result.installedDroids.push(filename);
          log(`  Installed ${filename}`);
        }
      }

      // Skip command installation - all commands are now plugin-scoped skills
      // Commands are accessible via the plugin system (${FACTORY_PLUGIN_ROOT}/commands/)
      // and are managed by Factory's skill discovery mechanism.
      log('Skipping slash command installation (all commands are now plugin-scoped skills)');

      // The command installation loop is disabled - CORE_COMMANDS is empty
      for (const [filename, content] of Object.entries(loadCommandDefinitions())) {
        // All commands are skipped - they're managed by the plugin system
        if (!CORE_COMMANDS.includes(filename)) {
          log(`  Skipping ${filename} (plugin-scoped skill)`);
          continue;
        }

        const filepath = join(COMMANDS_DIR, filename);

        // Create command directory if needed (only for nested paths like 'ultrawork/skill.md')
        // Handle both Unix (/) and Windows (\) path separators
        if (filename.includes('/') || filename.includes('\\')) {
          const segments = filename.split(/[/\\]/);
          const commandDir = join(COMMANDS_DIR, segments[0]);
          if (!existsSync(commandDir)) {
            mkdirSync(commandDir, { recursive: true });
          }
        }

        if (existsSync(filepath) && !options.force) {
          log(`  Skipping ${filename} (already exists)`);
        } else {
          writeFileSync(filepath, content);
          result.installedCommands.push(filename);
          log(`  Installed ${filename}`);
        }
      }

      // NOTE: SKILL_DEFINITIONS removed - skills now only installed via COMMAND_DEFINITIONS
      // to avoid duplicate entries in Factory's available skills list

      // Install FACTORY.md (only if it doesn't exist)
      const factoryMdPath = join(FACTORY_CONFIG_DIR, 'FACTORY.md');
      const homeMdPath = join(homedir(), 'FACTORY.md');

      if (!existsSync(homeMdPath)) {
        if (!existsSync(factoryMdPath) || options.force) {
          writeFileSync(factoryMdPath, loadFactoryMdContent());
          log('Created FACTORY.md');
        } else {
          log('FACTORY.md already exists, skipping');
        }
      } else {
        log('FACTORY.md exists in home directory, skipping');
      }

      // Install hook scripts (platform-aware)
      const hookScripts = getHookScripts();
      const hookType = shouldUseNodeHooks() ? 'Node.js' : 'Bash';
      log(`Installing ${hookType} hook scripts...`);

      for (const [filename, content] of Object.entries(hookScripts)) {
        const filepath = join(HOOKS_DIR, filename);
        if (existsSync(filepath) && !options.force) {
          log(`  Skipping ${filename} (already exists)`);
        } else {
          writeFileSync(filepath, content);
          // Make script executable (skip on Windows - not needed)
          if (!isWindows()) {
            chmodSync(filepath, 0o755);
          }
          log(`  Installed ${filename}`);
        }
      }

      // Configure settings.json for hooks (merge with existing settings)
      log('Configuring hooks in settings.json...');
      try {
        let existingSettings: Record<string, unknown> = {};
        if (existsSync(SETTINGS_FILE)) {
          const settingsContent = readFileSync(SETTINGS_FILE, 'utf-8');
          existingSettings = JSON.parse(settingsContent);
        }

        // Merge hooks configuration (platform-aware)
        const existingHooks = (existingSettings.hooks || {}) as Record<string, unknown>;
        const hooksConfig = getHooksSettingsConfig();
        const newHooks = hooksConfig.hooks;

        // Deep merge: add our hooks, or update if --force is used
        for (const [eventType, eventHooks] of Object.entries(newHooks)) {
          if (!existingHooks[eventType]) {
            existingHooks[eventType] = eventHooks;
            log(`  Added ${eventType} hook`);
          } else if (options.force) {
            existingHooks[eventType] = eventHooks;
            log(`  Updated ${eventType} hook (--force)`);
          } else {
            log(`  ${eventType} hook already configured, skipping`);
          }
        }

        existingSettings.hooks = existingHooks;

        // Write back settings
        writeFileSync(SETTINGS_FILE, JSON.stringify(existingSettings, null, 2));
        log('  Hooks configured in settings.json');
        result.hooksConfigured = true;
      } catch (_e) {
        log('  Warning: Could not configure hooks in settings.json (non-fatal)');
        result.hooksConfigured = false;
      }
    } else {
      log('Skipping agent/command/hook files (managed by plugin system)');
    }

    // Install HUD statusline (always, even in plugin mode)
    log('Installing HUD statusline...');
    try {
      if (!existsSync(HUD_DIR)) {
        mkdirSync(HUD_DIR, { recursive: true });
      }

      // Build the HUD script content (compiled from src/hud/index.ts)
      // Create a wrapper that checks multiple locations for the HUD module
      const hudScriptPath = join(HUD_DIR, 'omd-hud.mjs');
      const hudScriptLines = [
        '#!/usr/bin/env node',
        '/**',
        ' * OMD HUD - Statusline Script',
        ' * Wrapper that imports from dev paths, plugin cache, or npm package',
        ' */',
        '',
        'import { existsSync, readdirSync } from "node:fs";',
        'import { homedir } from "node:os";',
        'import { join } from "node:path";',
        'import { pathToFileURL } from "node:url";',
        '',
        'async function main() {',
        '  const home = homedir();',
        '  let pluginCacheVersion = null;',
        '  let pluginCacheDir = null;',
        '  ',
        '  // 1. Development paths (preferred for local development)',
        '  const devPaths = [',
        '    join(home, "Workspace/oh-my-droid/dist/hud/index.js"),',
        '    join(home, "workspace/oh-my-droid/dist/hud/index.js"),',
        '    join(home, "projects/oh-my-droid/dist/hud/index.js"),',
        '  ];',
        '  ',
        '  for (const devPath of devPaths) {',
        '    if (existsSync(devPath)) {',
        '      try {',
        '        await import(pathToFileURL(devPath).href);',
        '        return;',
        '      } catch { /* continue */ }',
        '    }',
        '  }',
        '  ',
        '  // 2. Plugin cache (for production installs)',
        '  const pluginCacheBase = join(home, ".factory/omd/plugins/cache/omd/oh-my-droid");',
        '  if (existsSync(pluginCacheBase)) {',
        '    try {',
        '      const versions = readdirSync(pluginCacheBase);',
        '      if (versions.length > 0) {',
        '        const latestVersion = versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).reverse()[0];',
        '        pluginCacheVersion = latestVersion;',
        '        pluginCacheDir = join(pluginCacheBase, latestVersion);',
        '        const pluginPath = join(pluginCacheDir, "dist/hud/index.js");',
        '        if (existsSync(pluginPath)) {',
        '          await import(pathToFileURL(pluginPath).href);',
        '          return;',
        '        }',
        '      }',
        '    } catch { /* continue */ }',
        '  }',
        '  ',
        '  // 3. npm package (global or local install)',
        '  try {',
        '    await import("oh-my-droid/dist/hud/index.js");',
        '    return;',
        '  } catch { /* continue */ }',
        '  ',
        '  // 4. Fallback: provide detailed error message with fix instructions',
        '  if (pluginCacheDir && existsSync(pluginCacheDir)) {',
        '    // Plugin exists but dist/ folder is missing - needs build',
        '    const distDir = join(pluginCacheDir, "dist");',
        '    if (!existsSync(distDir)) {',
        '      console.log(`[OMD HUD] Plugin installed but not built. Run: cd "${pluginCacheDir}" && npm install && npm run build`);',
        '    } else {',
        '      console.log(`[OMD HUD] Plugin dist/ exists but HUD not found. Run: cd "${pluginCacheDir}" && npm run build`);',
        '    }',
        '  } else if (existsSync(pluginCacheBase)) {',
        '    // Plugin cache directory exists but no versions',
        '    console.log(`[OMD HUD] Plugin cache found but no versions installed. Run: /oh-my-droid:omd-setup`);',
        '  } else {',
        '    // No plugin installation found at all',
        '    console.log("[OMD HUD] Plugin not installed. Run: /oh-my-droid:omd-setup");',
        '  }',
        '}',
        '',
        'main();',
      ];
      const hudScript = hudScriptLines.join('\n');

      writeFileSync(hudScriptPath, hudScript);
      if (!isWindows()) {
        chmodSync(hudScriptPath, 0o755);
      }
      log('  Installed omd-hud.mjs');

      // Configure statusLine in settings.json if not already set
      try {
        let existingSettings: Record<string, unknown> = {};
        if (existsSync(SETTINGS_FILE)) {
          const settingsContent = readFileSync(SETTINGS_FILE, 'utf-8');
          existingSettings = JSON.parse(settingsContent);
        }

        // Only add statusLine if not already configured
        if (!existingSettings.statusLine) {
          existingSettings.statusLine = {
            type: 'command',
            command: 'node ' + hudScriptPath
          };
          writeFileSync(SETTINGS_FILE, JSON.stringify(existingSettings, null, 2));
          log('  Configured statusLine in settings.json');
        } else {
          log('  statusLine already configured, skipping (use --force to override)');
          if (options.force) {
            existingSettings.statusLine = {
              type: 'command',
              command: 'node ' + hudScriptPath
            };
            writeFileSync(SETTINGS_FILE, JSON.stringify(existingSettings, null, 2));
            log('  Updated statusLine in settings.json (--force)');
          }
        }
      } catch {
        log('  Warning: Could not configure statusLine in settings.json');
      }
    } catch (_e) {
      log('  Warning: Could not install HUD statusline (non-fatal)');
    }

    // Save version metadata
    const versionMetadata = {
      version: VERSION,
      installedAt: new Date().toISOString(),
      installMethod: 'npm' as const,
      lastCheckAt: new Date().toISOString()
    };
    writeFileSync(VERSION_FILE, JSON.stringify(versionMetadata, null, 2));
    log('Saved version metadata');

    result.success = true;
    const hookCount = Object.keys(HOOK_SCRIPTS).length;
    result.message = `Successfully installed ${result.installedDroids.length} droids, ${result.installedCommands.length} commands, ${result.installedSkills.length} skills, and ${hookCount} hooks`;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMessage);
    result.message = `Installation failed: ${errorMessage}`;
  }

  return result;
}

/**
 * Check if OMD is already installed
 */
export function isInstalled(): boolean {
  return existsSync(VERSION_FILE) && existsSync(DROIDS_DIR) && existsSync(COMMANDS_DIR);
}

/**
 * Get installation info
 */
export function getInstallInfo(): { version: string; installedAt: string; method: string } | null {
  if (!existsSync(VERSION_FILE)) {
    return null;
  }
  try {
    const content = readFileSync(VERSION_FILE, 'utf-8');
    const data = JSON.parse(content);
    return {
      version: data.version,
      installedAt: data.installedAt,
      method: data.installMethod
    };
  } catch {
    return null;
  }
}

/**
 * Install slash commands result
 */
export interface InstallCommandsResult {
  success: boolean;
  installed: string[];
  skipped: string[];
  errors: string[];
}

/**
 * Install oh-my-droid skills as Factory Droid slash commands
 *
 * This copies SKILL.md files from skills/ to ~/.factory/commands/
 * with omd- prefix to avoid conflicts with other plugins.
 * Factory Droid uses flat file structure (no subfolders).
 *
 * @param options.force - Overwrite existing commands
 * @param options.verbose - Print progress
 */

/**
 * Convert frontmatter from oh-my-claudecode format to Factory Droid format
 * Factory Droid uses: description, argument-hint (not name)
 */
function convertFrontmatterToFactoryFormat(content: string): string {
  // Match YAML frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return content;
  }

  const frontmatter = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Parse frontmatter lines
  const lines = frontmatter.split('\n');
  const newLines: string[] = [];

  for (const line of lines) {
    // Remove 'name:' field (Factory Droid uses filename as command name)
    if (line.startsWith('name:')) {
      continue;
    }
    newLines.push(line);
  }

  // Reconstruct content
  return `---\n${newLines.join('\n')}\n---\n${body}`;
}

export function installSlashCommands(options: { force?: boolean; verbose?: boolean } = {}): InstallCommandsResult {
  const result: InstallCommandsResult = {
    success: false,
    installed: [],
    skipped: [],
    errors: []
  };

  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  try {
    // Ensure ~/.factory/commands/ exists
    if (!existsSync(FACTORY_COMMANDS_DIR)) {
      mkdirSync(FACTORY_COMMANDS_DIR, { recursive: true });
      log(`Created ${FACTORY_COMMANDS_DIR}`);
    }

    // Get skills directory from package
    const skillsDir = join(getPackageDir(), 'skills');
    if (!existsSync(skillsDir)) {
      result.errors.push(`Skills directory not found: ${skillsDir}`);
      return result;
    }

    // Scan skills directory
    const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    log(`Found ${skillDirs.length} skills to install`);

    for (const skillName of skillDirs) {
      const skillMdPath = join(skillsDir, skillName, 'SKILL.md');

      if (!existsSync(skillMdPath)) {
        log(`  Skipping ${skillName} (no SKILL.md)`);
        continue;
      }

      try {
        let content = readFileSync(skillMdPath, 'utf-8');

        // Convert frontmatter to Factory Droid format
        // Factory Droid uses: description, argument-hint (not name)
        content = convertFrontmatterToFactoryFormat(content);

        // Target filename: omd-{skillname}.md in commands root
        // Factory Droid doesn't support subfolders, so we use prefix
        const targetName = `omd-${skillName}.md`;
        const targetPath = join(FACTORY_COMMANDS_DIR, targetName);

        if (existsSync(targetPath) && !options.force) {
          result.skipped.push(skillName);
          log(`  Skipping ${skillName} (already exists)`);
          continue;
        }

        writeFileSync(targetPath, content);
        result.installed.push(skillName);
        log(`  Installed /omd-${skillName}`);

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${skillName}: ${errMsg}`);
        log(`  Error installing ${skillName}: ${errMsg}`);
      }
    }

    result.success = result.errors.length === 0;
    log(`\nInstalled ${result.installed.length} commands, skipped ${result.skipped.length}`);

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    result.errors.push(errMsg);
  }

  return result;
}

/**
 * List installed oh-my-droid slash commands
 */
export function listInstalledCommands(): string[] {
  if (!existsSync(FACTORY_COMMANDS_DIR)) {
    return [];
  }

  return readdirSync(FACTORY_COMMANDS_DIR)
    .filter(f => f.startsWith('omd-') && f.endsWith('.md'))
    .map(f => f.replace('.md', ''));
}

/**
 * Uninstall oh-my-droid slash commands
 */
export function uninstallSlashCommands(options: { verbose?: boolean } = {}): { removed: string[]; errors: string[] } {
  const result = { removed: [] as string[], errors: [] as string[] };

  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  if (!existsSync(FACTORY_COMMANDS_DIR)) {
    return result;
  }

  const commands = listInstalledCommands();

  for (const cmd of commands) {
    const filePath = join(FACTORY_COMMANDS_DIR, `${cmd}.md`);
    try {
      unlinkSync(filePath);
      result.removed.push(cmd);
      log(`Removed /${cmd}`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${cmd}: ${errMsg}`);
    }
  }

  return result;
}

/**
 * Clean up legacy omd/ subfolder if it exists
 * Earlier versions tried to use subfolders which Factory Droid doesn't support
 */
export function cleanupLegacyCommands(options: { verbose?: boolean } = {}): { removed: string[]; errors: string[] } {
  const result = { removed: [] as string[], errors: [] as string[] };

  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  // Clean up legacy omd/ subfolder (Factory Droid doesn't support subfolders)
  const legacySubfolder = join(FACTORY_COMMANDS_DIR, 'omd');
  if (existsSync(legacySubfolder)) {
    try {
      // Remove all files in the subfolder
      const files = readdirSync(legacySubfolder);
      for (const file of files) {
        unlinkSync(join(legacySubfolder, file));
        result.removed.push(`omd/${file}`);
        log(`Removed legacy omd/${file}`);
      }
      // Remove the subfolder itself
      rmdirSync(legacySubfolder);
      log('Removed legacy omd/ subfolder');
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`omd/ subfolder: ${errMsg}`);
    }
  }

  return result;
}

/**
 * Uninstall all oh-my-droid components
 * Removes commands, state, and configuration
 */
export interface UninstallResult {
  success: boolean;
  removedCommands: string[];
  removedState: boolean;
  errors: string[];
}

export function uninstall(options: { verbose?: boolean } = {}): UninstallResult {
  const result: UninstallResult = {
    success: true,
    removedCommands: [],
    removedState: false,
    errors: []
  };

  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  // 1. Remove slash commands
  log('Removing slash commands...');
  const cmdResult = uninstallSlashCommands(options);
  result.removedCommands = cmdResult.removed;
  if (cmdResult.errors.length > 0) {
    result.errors.push(...cmdResult.errors);
  }

  // 2. Clean up legacy subfolder
  log('Cleaning up legacy commands...');
  const legacyResult = cleanupLegacyCommands(options);
  if (legacyResult.errors.length > 0) {
    result.errors.push(...legacyResult.errors);
  }

  // 3. Remove global state directory
  if (existsSync(FACTORY_CONFIG_DIR)) {
    try {
      log(`Removing state directory: ${FACTORY_CONFIG_DIR}`);
      rmSync(FACTORY_CONFIG_DIR, { recursive: true, force: true });
      result.removedState = true;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`State directory: ${errMsg}`);
      result.success = false;
    }
  }

  if (result.errors.length > 0) {
    result.success = false;
  }

  return result;
}

/**
 * Clean install - uninstall everything and reinstall fresh
 */
export interface CleanInstallResult {
  uninstallResult: UninstallResult;
  installResult: InstallResult;
  commandsResult: InstallCommandsResult;
}

export function cleanInstall(options: InstallOptions = {}): CleanInstallResult {
  const log = (msg: string) => {
    if (options.verbose) {
      console.log(msg);
    }
  };

  log('Starting clean install...');

  // 1. Uninstall everything
  log('\n=== Uninstalling ===');
  const uninstallResult = uninstall(options);

  // 2. Install fresh
  log('\n=== Installing ===');
  const installResult = install({ ...options, force: true });

  // 3. Install slash commands
  log('\n=== Installing Slash Commands ===');
  const commandsResult = installSlashCommands({ ...options, force: true });

  return {
    uninstallResult,
    installResult,
    commandsResult
  };
}
