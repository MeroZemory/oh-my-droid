/**
 * State Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  StateLocation,
  readState,
  writeState,
  clearState,
  stateExists,
  createStateManager,
  getStatePath
} from '../state-manager.js';

describe('State Manager', () => {
  const testStateName = 'test-state';
  const testData = { foo: 'bar', count: 42 };

  afterEach(() => {
    // Clean up test state files
    clearState(testStateName, StateLocation.LOCAL);
    clearState(testStateName, StateLocation.GLOBAL);
  });

  describe('writeState and readState', () => {
    it('should write and read state successfully', () => {
      // Write state
      const writeResult = writeState(testStateName, testData, StateLocation.LOCAL);
      expect(writeResult.success).toBe(true);
      expect(writeResult.path).toBeTruthy();

      // Read state
      const readResult = readState(testStateName, StateLocation.LOCAL);
      expect(readResult.exists).toBe(true);
      expect(readResult.data).toEqual(testData);
      expect(readResult.foundAt).toBe(writeResult.path);
    });

    it('should handle non-existent state', () => {
      const readResult = readState('non-existent-state', StateLocation.LOCAL);
      expect(readResult.exists).toBe(false);
      expect(readResult.data).toBeUndefined();
    });

    it('should create directories automatically', () => {
      const writeResult = writeState(testStateName, testData, StateLocation.LOCAL);
      expect(writeResult.success).toBe(true);

      // Verify directory exists
      const statePath = getStatePath(testStateName, StateLocation.LOCAL);
      const dir = path.dirname(statePath);
      expect(fs.existsSync(dir)).toBe(true);
    });
  });

  describe('clearState', () => {
    it('should clear existing state', () => {
      // Write state first
      writeState(testStateName, testData, StateLocation.LOCAL);
      expect(stateExists(testStateName, StateLocation.LOCAL)).toBe(true);

      // Clear state
      const clearResult = clearState(testStateName, StateLocation.LOCAL);
      expect(clearResult.success).toBe(true);
      expect(stateExists(testStateName, StateLocation.LOCAL)).toBe(false);
    });

    it('should succeed when clearing non-existent state', () => {
      const clearResult = clearState('non-existent-state', StateLocation.LOCAL);
      expect(clearResult.success).toBe(true);
    });
  });

  describe('stateExists', () => {
    it('should return true for existing state', () => {
      writeState(testStateName, testData, StateLocation.LOCAL);
      expect(stateExists(testStateName, StateLocation.LOCAL)).toBe(true);
    });

    it('should return false for non-existent state', () => {
      expect(stateExists('non-existent-state', StateLocation.LOCAL)).toBe(false);
    });
  });

  describe('StateManager class', () => {
    it('should manage state through class interface', () => {
      const manager = createStateManager<typeof testData>(testStateName, StateLocation.LOCAL);

      // Should not exist initially
      expect(manager.exists()).toBe(false);

      // Set state
      expect(manager.set(testData)).toBe(true);
      expect(manager.exists()).toBe(true);

      // Get state
      const data = manager.get();
      expect(data).toEqual(testData);

      // Update state
      const updated = manager.update((current) => ({
        ...current,
        foo: 'baz',
        count: (current?.count ?? 0) + 1
      }));
      expect(updated).toBe(true);

      const updatedData = manager.get();
      expect(updatedData).toEqual({ foo: 'baz', count: 43 });

      // Clear state
      const clearResult = manager.clear();
      expect(clearResult.success).toBe(true);
      expect(manager.exists()).toBe(false);
    });
  });

  describe('Type safety', () => {
    interface TypedState {
      name: string;
      value: number;
    }

    it('should preserve types with generic parameters', () => {
      const typedData: TypedState = { name: 'test', value: 100 };

      writeState<TypedState>(testStateName, typedData, StateLocation.LOCAL);
      const readResult = readState<TypedState>(testStateName, StateLocation.LOCAL);

      expect(readResult.exists).toBe(true);
      expect(readResult.data?.name).toBe('test');
      expect(readResult.data?.value).toBe(100);
    });
  });
});
