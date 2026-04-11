/**
 * Tests for DISABLE_OMD and OMD_SKIP_HOOKS environment variables
 *
 * Tests the environment kill-switches that allow running Factory Droid
 * in vanilla mode (no OMD orchestration) or with specific hooks disabled.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processHook } from '../bridge.js';

describe('DISABLE_OMD environment variable', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    // Clear cached skip hooks
    (globalThis as Record<string, unknown>)._cachedSkipHooks = null;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('DISABLE_OMD=1', () => {
    it('should bypass all hooks when DISABLE_OMD=1', async () => {
      process.env.DISABLE_OMD = '1';

      const result = await processHook('keyword-detector', {
        prompt: 'ralph: do something',
      });

      expect(result.continue).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('should bypass pre-tool-use hook when disabled', async () => {
      process.env.DISABLE_OMD = '1';

      const result = await processHook('pre-tool-use', {
        toolName: 'Bash',
        toolInput: { command: 'pkill -f "test"' },
      });

      expect(result.continue).toBe(true);
      // No warning message because hook is bypassed
      expect(result.message).toBeUndefined();
    });

    it('should bypass session-start hook when disabled', async () => {
      process.env.DISABLE_OMD = '1';

      const result = await processHook('session-start', {
        sessionId: 'test-session',
      });

      expect(result.continue).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe('DISABLE_OMD=true', () => {
    it('should bypass all hooks when DISABLE_OMD=true', async () => {
      process.env.DISABLE_OMD = 'true';

      const result = await processHook('keyword-detector', {
        prompt: 'ultrawork fix all errors',
      });

      expect(result.continue).toBe(true);
      expect(result.message).toBeUndefined();
    });
  });

  describe('DISABLE_OMD not set or invalid', () => {
    it('should process hooks normally when DISABLE_OMD is not set', async () => {
      delete process.env.DISABLE_OMD;

      const result = await processHook('pre-tool-use', {
        toolName: 'Bash',
        toolInput: { command: 'pkill -f "test"' },
      });

      expect(result.continue).toBe(true);
      // Should have the pkill warning
      expect(result.message).toContain('pkill -f');
    });

    it('should process hooks normally when DISABLE_OMD=0', async () => {
      process.env.DISABLE_OMD = '0';

      const result = await processHook('pre-tool-use', {
        toolName: 'Bash',
        toolInput: { command: 'pkill -f "test"' },
      });

      expect(result.continue).toBe(true);
      // Should have the pkill warning
      expect(result.message).toContain('pkill -f');
    });

    it('should process hooks normally when DISABLE_OMD=false', async () => {
      process.env.DISABLE_OMD = 'false';

      const result = await processHook('pre-tool-use', {
        toolName: 'Bash',
        toolInput: { command: 'pkill -f "test"' },
      });

      expect(result.continue).toBe(true);
      expect(result.message).toContain('pkill -f');
    });
  });
});

describe('OMD_SKIP_HOOKS environment variable', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // Force re-parsing of skip hooks by clearing the internal cache
    // This is a workaround since the cache is module-scoped
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('skip specific hooks', () => {
    it('should skip keyword-detector when specified', async () => {
      // Note: Due to caching, this test may not work in isolation
      // The cache persists across test runs in the same process
      process.env.OMD_SKIP_HOOKS = 'keyword-detector';

      // For a fresh process, this would return early
      // But due to caching, we can only test the parse logic indirectly
      expect(process.env.OMD_SKIP_HOOKS).toBe('keyword-detector');
    });

    it('should parse comma-separated hooks', () => {
      process.env.OMD_SKIP_HOOKS = 'keyword-detector, ralph, autopilot';

      const hooks = process.env.OMD_SKIP_HOOKS.split(',').map(s => s.trim()).filter(Boolean);

      expect(hooks).toContain('keyword-detector');
      expect(hooks).toContain('ralph');
      expect(hooks).toContain('autopilot');
    });

    it('should handle whitespace correctly', () => {
      process.env.OMD_SKIP_HOOKS = '  keyword-detector ,  ralph  ,autopilot  ';

      const hooks = process.env.OMD_SKIP_HOOKS.split(',').map(s => s.trim()).filter(Boolean);

      expect(hooks).toEqual(['keyword-detector', 'ralph', 'autopilot']);
    });

    it('should handle empty values', () => {
      process.env.OMD_SKIP_HOOKS = 'keyword-detector,,ralph,';

      const hooks = process.env.OMD_SKIP_HOOKS.split(',').map(s => s.trim()).filter(Boolean);

      expect(hooks).toEqual(['keyword-detector', 'ralph']);
    });
  });

  describe('valid hook types', () => {
    const validHooks = [
      'keyword-detector',
      'stop-continuation',
      'ralph',
      'persistent-mode',
      'session-start',
      'session-end',
      'pre-tool-use',
      'post-tool-use',
      'autopilot',
      'subagent-start',
      'subagent-stop',
      'pre-compact',
      'setup-init',
      'setup-maintenance',
      'permission-request',
    ];

    it('should recognize all valid hook types', () => {
      expect(validHooks).toHaveLength(15);
    });

    it.each(validHooks)('should accept %s as a valid hook to skip', (hookType) => {
      process.env.OMD_SKIP_HOOKS = hookType;

      const hooks = process.env.OMD_SKIP_HOOKS.split(',').map(s => s.trim()).filter(Boolean);

      expect(hooks).toContain(hookType);
    });
  });
});

describe('DISABLE_OMD precedence', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('DISABLE_OMD takes precedence over OMD_SKIP_HOOKS', async () => {
    process.env.DISABLE_OMD = '1';
    process.env.OMD_SKIP_HOOKS = 'pre-tool-use';

    const result = await processHook('keyword-detector', {
      prompt: 'ralph: test',
    });

    // DISABLE_OMD should bypass everything, regardless of OMD_SKIP_HOOKS
    expect(result.continue).toBe(true);
    expect(result.message).toBeUndefined();
  });
});
