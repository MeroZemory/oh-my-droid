/**
 * JSON Utilities
 *
 * Safe JSON parsing and serialization utilities.
 */

/**
 * Result of a JSON parse operation
 */
export interface JsonParseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Safely parse JSON string
 *
 * Returns a result object instead of throwing errors.
 */
export function safeJsonParse<T = unknown>(str: string): JsonParseResult<T> {
  try {
    const data = JSON.parse(str) as T;
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Safely stringify object to JSON
 *
 * Returns a result with the JSON string or error message.
 */
export function safeJsonStringify(
  obj: unknown,
  pretty: boolean = true
): { success: boolean; json?: string; error?: string } {
  try {
    const json = pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
    return {
      success: true,
      json
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Parse JSON with a default value fallback
 */
export function parseJsonOrDefault<T>(str: string, defaultValue: T): T {
  const result = safeJsonParse<T>(str);
  return result.success && result.data !== undefined ? result.data : defaultValue;
}

/**
 * Deep clone an object using JSON serialization
 *
 * Note: This loses functions, undefined values, and symbols.
 */
export function deepCloneJson<T>(obj: T): T | null {
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch {
    return null;
  }
}

/**
 * Check if a string is valid JSON
 */
export function isValidJson(str: string): boolean {
  return safeJsonParse(str).success;
}

/**
 * Pretty print JSON string
 */
export function prettyJson(obj: unknown, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch {
    return String(obj);
  }
}

/**
 * Compact JSON (no whitespace)
 */
export function compactJson(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}
