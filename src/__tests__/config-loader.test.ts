/**
 * Config Loader Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  loadConfig,
  deepMerge,
  getConfigValue,
  isFeatureEnabled,
  getAgentModel,
  isAgentEnabled
} from '../config-loader.js';

describe('Config Loader', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have expected default values', () => {
      expect(DEFAULT_CONFIG.defaultModel).toBe('claude-sonnet-4-5-20250929');
      expect(DEFAULT_CONFIG.agents).toBeDefined();
      expect(DEFAULT_CONFIG.features?.parallelExecution).toBe(true);
      expect(DEFAULT_CONFIG.features?.autoContextInjection).toBe(true);
    });
  });

  describe('deepMerge', () => {
    it('should merge nested objects', () => {
      const target = {
        a: 1,
        b: { c: 2, d: 3 },
        e: 'test'
      };

      const source: Partial<typeof target> = {
        b: { c: 4, d: 3 },
        a: 1,
        e: 'test'
      };
      (source as Record<string, unknown>).f = 'new';

      const result = deepMerge(target, source) as typeof target & { f: string };

      expect(result.a).toBe(1);
      expect(result.b.c).toBe(4);
      expect(result.b.d).toBe(3);
      expect(result.e).toBe('test');
      expect(result.f).toBe('new');
    });

    it('should handle arrays by replacing', () => {
      const target = { arr: [1, 2, 3] };
      const source: Partial<typeof target> = { arr: [4, 5] };

      const result = deepMerge(target, source);
      expect(result.arr).toEqual([4, 5]);
    });

    it('should not mutate original objects', () => {
      const target = { a: { b: 1 } };
      const source: Partial<typeof target> = { a: { b: 1 } };
      (source.a as Record<string, unknown>).c = 2;

      const result = deepMerge(target, source) as typeof target & { a: { b: number; c: number } };

      expect(target.a).toEqual({ b: 1 });
      expect(result.a.b).toBe(1);
      expect(result.a.c).toBe(2);
    });
  });

  describe('loadConfig', () => {
    it('should return a valid config object', () => {
      const config = loadConfig();

      expect(config).toBeDefined();
      expect(config.defaultModel).toBeDefined();
      expect(config.agents).toBeDefined();
      expect(config.features).toBeDefined();
    });
  });

  describe('getConfigValue', () => {
    const config = {
      level1: {
        level2: {
          level3: 'value'
        }
      },
      simple: 'test'
    };

    it('should get nested value', () => {
      const value = getConfigValue(config, 'level1.level2.level3', 'default');
      expect(value).toBe('value');
    });

    it('should get simple value', () => {
      const value = getConfigValue(config, 'simple', 'default');
      expect(value).toBe('test');
    });

    it('should return default for non-existent path', () => {
      const value = getConfigValue(config, 'non.existent.path', 'default');
      expect(value).toBe('default');
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check feature flag', () => {
      const config = {
        features: {
          testFeature: true,
          disabledFeature: false
        }
      };

      expect(isFeatureEnabled(config, 'testFeature')).toBe(true);
      expect(isFeatureEnabled(config, 'disabledFeature')).toBe(false);
      expect(isFeatureEnabled(config, 'nonExistent')).toBe(false);
    });
  });

  describe('getAgentModel', () => {
    it('should get agent-specific model', () => {
      const config = {
        defaultModel: 'default-model',
        agents: {
          testAgent: { model: 'agent-specific-model' }
        }
      };

      const model = getAgentModel(config, 'testAgent');
      expect(model).toBe('agent-specific-model');
    });

    it('should fall back to default model', () => {
      const config = {
        defaultModel: 'default-model',
        agents: {}
      };

      const model = getAgentModel(config, 'nonExistent');
      expect(model).toBe('default-model');
    });
  });

  describe('isAgentEnabled', () => {
    it('should check if agent is enabled', () => {
      const config = {
        agents: {
          enabledAgent: { enabled: true },
          disabledAgent: { enabled: false },
          defaultAgent: {}
        }
      };

      expect(isAgentEnabled(config, 'enabledAgent')).toBe(true);
      expect(isAgentEnabled(config, 'disabledAgent')).toBe(false);
      expect(isAgentEnabled(config, 'defaultAgent')).toBe(true); // Enabled by default
      expect(isAgentEnabled(config, 'nonExistent')).toBe(true); // Enabled by default
    });
  });
});
