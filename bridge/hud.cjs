#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/features/state-manager/types.ts
var DEFAULT_STATE_CONFIG;
var init_types = __esm({
  "src/features/state-manager/types.ts"() {
    "use strict";
    DEFAULT_STATE_CONFIG = {
      createDirs: true,
      checkLegacy: true
    };
  }
});

// src/features/state-manager/index.ts
function getStatePath(name, location) {
  const baseDir = location === "local" /* LOCAL */ ? LOCAL_STATE_DIR : GLOBAL_STATE_DIR;
  return path.join(baseDir, `${name}.json`);
}
function getLegacyPaths(name) {
  return LEGACY_LOCATIONS[name] || [];
}
function ensureStateDir2(location) {
  const dir = location === "local" /* LOCAL */ ? LOCAL_STATE_DIR : GLOBAL_STATE_DIR;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
function readState(name, location = "local" /* LOCAL */, options) {
  const checkLegacy = options?.checkLegacy ?? DEFAULT_STATE_CONFIG.checkLegacy;
  const standardPath = getStatePath(name, location);
  const legacyPaths = checkLegacy ? getLegacyPaths(name) : [];
  if (fs.existsSync(standardPath)) {
    try {
      const content = fs.readFileSync(standardPath, "utf-8");
      const data = JSON.parse(content);
      return {
        exists: true,
        data,
        foundAt: standardPath,
        legacyLocations: []
      };
    } catch (error) {
      console.warn(`Failed to read state from ${standardPath}:`, error);
    }
  }
  if (checkLegacy) {
    for (const legacyPath of legacyPaths) {
      const resolvedPath = path.isAbsolute(legacyPath) ? legacyPath : path.join(process.cwd(), legacyPath);
      if (fs.existsSync(resolvedPath)) {
        try {
          const content = fs.readFileSync(resolvedPath, "utf-8");
          const data = JSON.parse(content);
          return {
            exists: true,
            data,
            foundAt: resolvedPath,
            legacyLocations: legacyPaths
          };
        } catch (error) {
          console.warn(`Failed to read legacy state from ${resolvedPath}:`, error);
        }
      }
    }
  }
  return {
    exists: false,
    legacyLocations: checkLegacy ? legacyPaths : []
  };
}
function writeState(name, data, location = "local" /* LOCAL */, options) {
  const createDirs = options?.createDirs ?? DEFAULT_STATE_CONFIG.createDirs;
  const statePath = getStatePath(name, location);
  try {
    if (createDirs) {
      ensureStateDir2(location);
    }
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(statePath, content, "utf-8");
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
var fs, path, os, LOCAL_STATE_DIR, GLOBAL_STATE_DIR, LEGACY_LOCATIONS;
var init_state_manager = __esm({
  "src/features/state-manager/index.ts"() {
    "use strict";
    fs = __toESM(require("fs"), 1);
    path = __toESM(require("path"), 1);
    os = __toESM(require("os"), 1);
    init_types();
    init_types();
    LOCAL_STATE_DIR = ".omd/state";
    GLOBAL_STATE_DIR = path.join(os.homedir(), ".omd", "state");
    LEGACY_LOCATIONS = {
      "boulder": [".omd/boulder.json"],
      "autopilot": [".omd/autopilot-state.json"],
      "autopilot-state": [".omd/autopilot-state.json"],
      "ralph": [".omd/ralph-state.json"],
      "ralph-state": [".omd/ralph-state.json"],
      "ralph-verification": [".omd/ralph-verification.json"],
      "ultrawork": [".omd/ultrawork-state.json"],
      "ultrawork-state": [".omd/ultrawork-state.json"],
      "ultraqa": [".omd/ultraqa-state.json"],
      "ultraqa-state": [".omd/ultraqa-state.json"],
      "hud-state": [".omd/hud-state.json"],
      "prd": [".omd/prd.json"]
    };
  }
});

// src/analytics/types.ts
var PRICING;
var init_types2 = __esm({
  "src/analytics/types.ts"() {
    "use strict";
    PRICING = {
      "claude-haiku-4": {
        inputPerMillion: 0.8,
        outputPerMillion: 4,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9
      },
      "claude-sonnet-4.5": {
        inputPerMillion: 3,
        outputPerMillion: 15,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9
      },
      "claude-opus-4.5": {
        inputPerMillion: 15,
        outputPerMillion: 75,
        cacheWriteMarkup: 0.25,
        cacheReadDiscount: 0.9
      }
    };
  }
});

// src/analytics/tokscale-adapter.ts
async function getTokscaleAdapter() {
  if (cachedAdapter !== null) {
    return cachedAdapter;
  }
  if (loadAttempted) {
    return FALLBACK_ADAPTER;
  }
  loadAttempted = true;
  try {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const msg = args[0];
      if (typeof msg === "string" && msg.startsWith("[tokscale]")) {
        return;
      }
      originalWarn.apply(console, args);
    };
    let tokscale;
    try {
      tokscale = await import("@tokscale/core");
      if (typeof tokscale.healthCheck === "function") {
        const health = tokscale.healthCheck();
        if (!health || typeof health === "object" && !health.nativeAvailable) {
          console.warn("[tokscale-adapter] Native module not available, using fallback");
          cachedAdapter = FALLBACK_ADAPTER;
          return cachedAdapter;
        }
      }
    } finally {
      console.warn = originalWarn;
    }
    const convertEntriesToByModel = (entries) => {
      const result = {};
      if (!entries || !Array.isArray(entries)) {
        return result;
      }
      for (const entry of entries) {
        const modelName = entry.model ?? "unknown";
        result[modelName] = {
          tokens: (entry.input ?? 0) + (entry.output ?? 0),
          cost: entry.cost ?? 0
        };
      }
      return result;
    };
    cachedAdapter = {
      isAvailable: true,
      version: (typeof tokscale.version === "function" ? tokscale.version() : tokscale.version) ?? "unknown",
      getReport: async () => {
        try {
          const report = await tokscale.getModelReport({ sources: ["claude"] });
          return {
            totalInputTokens: report.totalInput ?? 0,
            totalOutputTokens: report.totalOutput ?? 0,
            totalCacheCreationTokens: report.totalCacheWrite ?? 0,
            totalCacheReadTokens: report.totalCacheRead ?? 0,
            totalCost: report.totalCost ?? 0,
            totalEntries: report.totalMessages ?? 0,
            byModel: convertEntriesToByModel(report.entries ?? [])
          };
        } catch (error) {
          console.warn("[tokscale-adapter] getReport failed:", error instanceof Error ? error.message : String(error));
          throw error;
        }
      },
      lookupPricing: async (modelName) => {
        try {
          const result = await tokscale.lookupPricing(modelName);
          if (result && result.pricing) {
            const pricing = result.pricing;
            const inputPerMillion = (pricing.inputCostPerToken ?? 0) * 1e6;
            const outputPerMillion = (pricing.outputCostPerToken ?? 0) * 1e6;
            const cacheWriteMarkup = pricing.inputCostPerToken > 0 ? (pricing.cacheCreationInputTokenCost ?? pricing.inputCostPerToken * 1.25) / pricing.inputCostPerToken - 1 : 0.25;
            const cacheReadDiscount = pricing.inputCostPerToken > 0 ? 1 - (pricing.cacheReadInputTokenCost ?? pricing.inputCostPerToken * 0.1) / pricing.inputCostPerToken : 0.9;
            return {
              inputPerMillion,
              outputPerMillion,
              cacheWriteMarkup,
              cacheReadDiscount
            };
          }
          return null;
        } catch (error) {
          console.warn("[tokscale-adapter] lookupPricing failed for", modelName, ":", error instanceof Error ? error.message : String(error));
          return null;
        }
      }
    };
    return cachedAdapter;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("Cannot find module") && !message.includes("MODULE_NOT_FOUND")) {
      console.warn(`[tokscale-adapter] Failed to load: ${message}`);
    }
    cachedAdapter = FALLBACK_ADAPTER;
    return cachedAdapter;
  }
}
function normalizeModelName(modelName) {
  const lower = modelName.toLowerCase();
  if (lower.includes("haiku")) return "claude-haiku-4";
  if (lower.includes("sonnet")) return "claude-sonnet-4.5";
  if (lower.includes("opus")) return "claude-opus-4.5";
  if (PRICING[modelName]) return modelName;
  return "claude-sonnet-4.5";
}
function getFallbackPricing(modelName) {
  const normalized = normalizeModelName(modelName);
  return PRICING[normalized] ?? PRICING["claude-sonnet-4.5"];
}
function hasUsableRates(pricing) {
  return Number.isFinite(pricing.inputPerMillion) && Number.isFinite(pricing.outputPerMillion) && pricing.inputPerMillion > 0 && pricing.outputPerMillion > 0;
}
async function lookupPricingWithFallback(modelName) {
  const adapter = await getTokscaleAdapter();
  if (adapter.isAvailable && adapter.lookupPricing) {
    try {
      const pricing = await adapter.lookupPricing(modelName);
      if (pricing !== null && hasUsableRates(pricing)) {
        return pricing;
      }
    } catch {
    }
  }
  return getFallbackPricing(modelName);
}
var FALLBACK_ADAPTER, cachedAdapter, loadAttempted;
var init_tokscale_adapter = __esm({
  "src/analytics/tokscale-adapter.ts"() {
    "use strict";
    init_types2();
    FALLBACK_ADAPTER = {
      isAvailable: false
    };
    cachedAdapter = null;
    loadAttempted = false;
  }
});

// src/analytics/cost-estimator.ts
var cost_estimator_exports = {};
__export(cost_estimator_exports, {
  batchCalculateCost: () => batchCalculateCost,
  calculateCost: () => calculateCost,
  calculateCostAsync: () => calculateCostAsync,
  estimateDailyCost: () => estimateDailyCost,
  estimateMonthlyCost: () => estimateMonthlyCost,
  formatCost: () => formatCost,
  getCostColor: () => getCostColor
});
function calculateCost(input) {
  const pricing = getPricingForModel(input.modelName);
  const inputCost = input.inputTokens / 1e6 * pricing.inputPerMillion;
  const outputCost = input.outputTokens / 1e6 * pricing.outputPerMillion;
  const cacheWriteCost = input.cacheCreationTokens / 1e6 * pricing.inputPerMillion * (1 + pricing.cacheWriteMarkup);
  const cacheReadCost = input.cacheReadTokens / 1e6 * pricing.inputPerMillion * (1 - pricing.cacheReadDiscount);
  const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;
  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost
  };
}
async function calculateCostAsync(input) {
  const pricing = await lookupPricingWithFallback(input.modelName);
  const inputCost = input.inputTokens / 1e6 * pricing.inputPerMillion;
  const outputCost = input.outputTokens / 1e6 * pricing.outputPerMillion;
  const cacheWriteCost = input.cacheCreationTokens / 1e6 * pricing.inputPerMillion * (1 + pricing.cacheWriteMarkup);
  const cacheReadCost = input.cacheReadTokens / 1e6 * pricing.inputPerMillion * (1 - pricing.cacheReadDiscount);
  const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;
  return {
    inputCost,
    outputCost,
    cacheWriteCost,
    cacheReadCost,
    totalCost
  };
}
async function batchCalculateCost(inputs) {
  const models = [...new Set(inputs.map((i) => i.modelName))];
  const pricingMap = /* @__PURE__ */ new Map();
  for (const model of models) {
    pricingMap.set(model, await lookupPricingWithFallback(model));
  }
  return inputs.map((input) => {
    const pricing = pricingMap.get(input.modelName);
    const inputCost = input.inputTokens / 1e6 * pricing.inputPerMillion;
    const outputCost = input.outputTokens / 1e6 * pricing.outputPerMillion;
    const cacheWriteCost = input.cacheCreationTokens / 1e6 * pricing.inputPerMillion * (1 + pricing.cacheWriteMarkup);
    const cacheReadCost = input.cacheReadTokens / 1e6 * pricing.inputPerMillion * (1 - pricing.cacheReadDiscount);
    const totalCost = inputCost + outputCost + cacheWriteCost + cacheReadCost;
    return {
      inputCost,
      outputCost,
      cacheWriteCost,
      cacheReadCost,
      totalCost
    };
  });
}
function getPricingForModel(modelName) {
  const normalized = normalizeModelName2(modelName);
  if (PRICING[normalized]) {
    return PRICING[normalized];
  }
  console.warn(`Unknown model: ${modelName}, defaulting to Sonnet pricing`);
  return PRICING["claude-sonnet-4.5"];
}
function normalizeModelName2(modelName) {
  const lower = modelName.toLowerCase();
  if (lower.includes("haiku")) return "claude-haiku-4";
  if (lower.includes("sonnet")) return "claude-sonnet-4.5";
  if (lower.includes("opus")) return "claude-opus-4.5";
  if (PRICING[modelName]) return modelName;
  return "claude-sonnet-4.5";
}
function formatCost(cost) {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}\xA2`;
  }
  return `$${cost.toFixed(4)}`;
}
function getCostColor(cost) {
  if (cost < 1) return "green";
  if (cost < 5) return "yellow";
  return "red";
}
function estimateDailyCost(tokensPerHour, modelName) {
  const pricing = getPricingForModel(modelName);
  const tokensPerDay = tokensPerHour * 24;
  const costPerDay = tokensPerDay / 1e6 * pricing.inputPerMillion;
  return costPerDay;
}
function estimateMonthlyCost(tokensPerHour, modelName) {
  return estimateDailyCost(tokensPerHour, modelName) * 30;
}
var init_cost_estimator = __esm({
  "src/analytics/cost-estimator.ts"() {
    "use strict";
    init_types2();
    init_tokscale_adapter();
  }
});

// src/analytics/token-tracker.ts
var token_tracker_exports = {};
__export(token_tracker_exports, {
  TokenTracker: () => TokenTracker,
  getTokenTracker: () => getTokenTracker,
  resetTokenTracker: () => resetTokenTracker
});
function getTokenTracker(sessionId) {
  if (!globalTracker) {
    globalTracker = new TokenTracker(sessionId);
  }
  return globalTracker;
}
function resetTokenTracker(sessionId) {
  globalTracker = new TokenTracker(sessionId);
  return globalTracker;
}
var fs2, path2, import_os3, TOKEN_LOG_FILE, SESSION_STATS_FILE, TokenTracker, globalTracker;
var init_token_tracker = __esm({
  "src/analytics/token-tracker.ts"() {
    "use strict";
    init_state_manager();
    init_tokscale_adapter();
    fs2 = __toESM(require("fs/promises"), 1);
    path2 = __toESM(require("path"), 1);
    import_os3 = require("os");
    TOKEN_LOG_FILE = path2.join((0, import_os3.homedir)(), ".omd", "state", "token-tracking.jsonl");
    SESSION_STATS_FILE = path2.join((0, import_os3.homedir)(), ".omd", "state", "session-token-stats.json");
    TokenTracker = class {
      currentSessionId;
      sessionStats;
      constructor(sessionId) {
        this.currentSessionId = sessionId || this.generateSessionId();
        this.sessionStats = this.initializeSessionStats();
      }
      generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      initializeSessionStats() {
        return {
          sessionId: this.currentSessionId,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheCreation: 0,
          totalCacheRead: 0,
          totalCost: 0,
          byAgent: {},
          byModel: {},
          startTime: (/* @__PURE__ */ new Date()).toISOString(),
          lastUpdate: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      async recordTokenUsage(usage) {
        const record = {
          ...usage,
          sessionId: this.currentSessionId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        await this.appendToLog(record);
        this.updateSessionStats(record);
        await this.saveSessionStats();
      }
      async appendToLog(record) {
        const logDir = path2.dirname(TOKEN_LOG_FILE);
        await fs2.mkdir(logDir, { recursive: true });
        await fs2.appendFile(TOKEN_LOG_FILE, JSON.stringify(record) + "\n", "utf-8");
      }
      updateSessionStats(record) {
        this.sessionStats.totalInputTokens += record.inputTokens;
        this.sessionStats.totalOutputTokens += record.outputTokens;
        this.sessionStats.totalCacheCreation += record.cacheCreationTokens;
        this.sessionStats.totalCacheRead += record.cacheReadTokens;
        this.sessionStats.lastUpdate = record.timestamp;
        const agentKey = record.agentName || "(main session)";
        if (!this.sessionStats.byAgent[agentKey]) {
          this.sessionStats.byAgent[agentKey] = [];
        }
        this.sessionStats.byAgent[agentKey].push(record);
        if (!this.sessionStats.byModel[record.modelName]) {
          this.sessionStats.byModel[record.modelName] = [];
        }
        this.sessionStats.byModel[record.modelName].push(record);
      }
      async saveSessionStats() {
        writeState("session-token-stats", this.sessionStats, "global" /* GLOBAL */);
      }
      async loadSessionStats(sessionId) {
        const sid = sessionId || this.currentSessionId;
        const result = readState("session-token-stats", "global" /* GLOBAL */);
        if (result.exists && result.data && result.data.sessionId === sid) {
          this.sessionStats = result.data;
          return result.data;
        }
        return this.rebuildStatsFromLog(sid);
      }
      async rebuildStatsFromLog(sessionId) {
        try {
          const content = await fs2.readFile(TOKEN_LOG_FILE, "utf-8");
          const lines = content.trim().split("\n");
          const stats = this.initializeSessionStats();
          stats.sessionId = sessionId;
          for (const line of lines) {
            const record = JSON.parse(line);
            if (record.sessionId === sessionId) {
              this.updateSessionStats(record);
            }
          }
          return stats.totalInputTokens > 0 ? stats : null;
        } catch (error) {
          return null;
        }
      }
      getSessionStats() {
        return { ...this.sessionStats };
      }
      async getAllStats() {
        const adapter = await getTokscaleAdapter();
        if (adapter.isAvailable && adapter.getReport) {
          return this.getAllStatsViaTokscale(adapter);
        }
        return this.getAllStatsLegacy();
      }
      async getAllStatsViaTokscale(adapter) {
        try {
          const report = await adapter.getReport();
          const agentData = await this.getAgentDataFromLocalLog();
          return {
            totalInputTokens: report.totalInputTokens,
            totalOutputTokens: report.totalOutputTokens,
            totalCacheCreation: report.totalCacheCreationTokens,
            totalCacheRead: report.totalCacheReadTokens,
            totalCost: report.totalCost,
            byAgent: agentData.byAgent,
            // From local JSONL
            byModel: report.byModel || {},
            sessionCount: agentData.sessionCount || 1,
            entryCount: report.totalEntries,
            firstEntry: agentData.firstEntry,
            lastEntry: agentData.lastEntry
          };
        } catch (error) {
          return this.getAllStatsLegacy();
        }
      }
      // Hybrid data merging: Read agent attribution from local JSONL
      async getAgentDataFromLocalLog() {
        const { calculateCost: calculateCost2 } = await Promise.resolve().then(() => (init_cost_estimator(), cost_estimator_exports));
        const result = {
          byAgent: {},
          sessionCount: 0,
          entryCount: 0,
          firstEntry: null,
          lastEntry: null
        };
        try {
          const content = await fs2.readFile(TOKEN_LOG_FILE, "utf-8");
          const lines = content.trim().split("\n").filter((line) => line.trim());
          if (lines.length === 0) {
            return result;
          }
          const sessions = /* @__PURE__ */ new Set();
          for (const line of lines) {
            const record = JSON.parse(line);
            result.entryCount++;
            sessions.add(record.sessionId);
            if (!result.firstEntry || record.timestamp < result.firstEntry) {
              result.firstEntry = record.timestamp;
            }
            if (!result.lastEntry || record.timestamp > result.lastEntry) {
              result.lastEntry = record.timestamp;
            }
            const cost = calculateCost2({
              modelName: record.modelName,
              inputTokens: record.inputTokens,
              outputTokens: record.outputTokens,
              cacheCreationTokens: record.cacheCreationTokens,
              cacheReadTokens: record.cacheReadTokens
            });
            const agentKey = record.agentName || "(main session)";
            if (!result.byAgent[agentKey]) {
              result.byAgent[agentKey] = { tokens: 0, cost: 0 };
            }
            result.byAgent[agentKey].tokens += record.inputTokens + record.outputTokens;
            result.byAgent[agentKey].cost += cost.totalCost;
          }
          result.sessionCount = sessions.size;
          return result;
        } catch (error) {
          return result;
        }
      }
      async getAllStatsLegacy() {
        const { calculateCost: calculateCost2 } = await Promise.resolve().then(() => (init_cost_estimator(), cost_estimator_exports));
        const stats = {
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCacheCreation: 0,
          totalCacheRead: 0,
          totalCost: 0,
          byAgent: {},
          byModel: {},
          sessionCount: 0,
          entryCount: 0,
          firstEntry: null,
          lastEntry: null
        };
        try {
          const content = await fs2.readFile(TOKEN_LOG_FILE, "utf-8");
          const lines = content.trim().split("\n").filter((line) => line.trim());
          if (lines.length === 0) {
            return stats;
          }
          const sessions = /* @__PURE__ */ new Set();
          for (const line of lines) {
            const record = JSON.parse(line);
            stats.entryCount++;
            sessions.add(record.sessionId);
            if (!stats.firstEntry || record.timestamp < stats.firstEntry) {
              stats.firstEntry = record.timestamp;
            }
            if (!stats.lastEntry || record.timestamp > stats.lastEntry) {
              stats.lastEntry = record.timestamp;
            }
            stats.totalInputTokens += record.inputTokens;
            stats.totalOutputTokens += record.outputTokens;
            stats.totalCacheCreation += record.cacheCreationTokens;
            stats.totalCacheRead += record.cacheReadTokens;
            const cost = calculateCost2({
              modelName: record.modelName,
              inputTokens: record.inputTokens,
              outputTokens: record.outputTokens,
              cacheCreationTokens: record.cacheCreationTokens,
              cacheReadTokens: record.cacheReadTokens
            });
            stats.totalCost += cost.totalCost;
            const agentKey = record.agentName || "(main session)";
            if (!stats.byAgent[agentKey]) {
              stats.byAgent[agentKey] = { tokens: 0, cost: 0 };
            }
            stats.byAgent[agentKey].tokens += record.inputTokens + record.outputTokens;
            stats.byAgent[agentKey].cost += cost.totalCost;
            if (!stats.byModel[record.modelName]) {
              stats.byModel[record.modelName] = { tokens: 0, cost: 0 };
            }
            stats.byModel[record.modelName].tokens += record.inputTokens + record.outputTokens;
            stats.byModel[record.modelName].cost += cost.totalCost;
          }
          stats.sessionCount = sessions.size;
          return stats;
        } catch (error) {
          return stats;
        }
      }
      async getTopAgentsAllSessions(limit = 5) {
        const allStats = await this.getAllStats();
        const agentStats = Object.entries(allStats.byAgent).map(([agent, stats]) => ({
          agent,
          tokens: stats.tokens,
          cost: stats.cost
        }));
        return agentStats.sort((a, b) => b.cost - a.cost).slice(0, limit);
      }
      async getTopAgents(limit = 5) {
        const { calculateCost: calculateCost2 } = await Promise.resolve().then(() => (init_cost_estimator(), cost_estimator_exports));
        const agentStats = Object.entries(this.sessionStats.byAgent).map(([agent, usages]) => {
          const totalTokens = usages.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
          const totalCost = usages.reduce((sum, u) => {
            const cost = calculateCost2({
              modelName: u.modelName,
              inputTokens: u.inputTokens,
              outputTokens: u.outputTokens,
              cacheCreationTokens: u.cacheCreationTokens,
              cacheReadTokens: u.cacheReadTokens
            });
            return sum + cost.totalCost;
          }, 0);
          return { agent, tokens: totalTokens, cost: totalCost };
        });
        return agentStats.sort((a, b) => b.cost - a.cost).slice(0, limit);
      }
      async cleanupOldLogs(retentionDays = 30) {
        const cutoffDate = /* @__PURE__ */ new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
        try {
          const content = await fs2.readFile(TOKEN_LOG_FILE, "utf-8");
          const lines = content.trim().split("\n");
          let kept = 0;
          let removed = 0;
          const filteredLines = lines.filter((line) => {
            const record = JSON.parse(line);
            const recordDate = new Date(record.timestamp);
            if (recordDate >= cutoffDate) {
              kept++;
              return true;
            }
            removed++;
            return false;
          });
          await fs2.writeFile(TOKEN_LOG_FILE, filteredLines.join("\n") + "\n", "utf-8");
          return removed;
        } catch (error) {
          return 0;
        }
      }
    };
    globalTracker = null;
  }
});

// src/hooks/omd-orchestrator/constants.ts
var init_constants = __esm({
  "src/hooks/omd-orchestrator/constants.ts"() {
    "use strict";
  }
});

// src/features/boulder-state/constants.ts
var BOULDER_DIR, BOULDER_FILE, BOULDER_STATE_PATH, NOTEPAD_DIR, NOTEPAD_BASE_PATH;
var init_constants2 = __esm({
  "src/features/boulder-state/constants.ts"() {
    "use strict";
    BOULDER_DIR = ".omd";
    BOULDER_FILE = "boulder.json";
    BOULDER_STATE_PATH = `${BOULDER_DIR}/${BOULDER_FILE}`;
    NOTEPAD_DIR = "notepads";
    NOTEPAD_BASE_PATH = `${BOULDER_DIR}/${NOTEPAD_DIR}`;
  }
});

// src/features/boulder-state/storage.ts
var init_storage = __esm({
  "src/features/boulder-state/storage.ts"() {
    "use strict";
    init_constants2();
  }
});

// src/features/boulder-state/index.ts
var init_boulder_state = __esm({
  "src/features/boulder-state/index.ts"() {
    "use strict";
    init_constants2();
    init_storage();
  }
});

// src/hooks/notepad/index.ts
var init_notepad = __esm({
  "src/hooks/notepad/index.ts"() {
    "use strict";
  }
});

// src/hooks/omd-orchestrator/audit.ts
var init_audit = __esm({
  "src/hooks/omd-orchestrator/audit.ts"() {
    "use strict";
  }
});

// src/hooks/omd-orchestrator/index.ts
function getGitDiffStats(directory) {
  try {
    const output = (0, import_child_process2.execSync)("git diff --numstat HEAD", {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5e3
    }).trim();
    if (!output) return [];
    const statusOutput = (0, import_child_process2.execSync)("git status --porcelain", {
      cwd: directory,
      encoding: "utf-8",
      timeout: 5e3
    }).trim();
    const statusMap = /* @__PURE__ */ new Map();
    for (const line of statusOutput.split("\n")) {
      if (!line) continue;
      const status = line.substring(0, 2).trim();
      const filePath = line.substring(3);
      if (status === "A" || status === "??") {
        statusMap.set(filePath, "added");
      } else if (status === "D") {
        statusMap.set(filePath, "deleted");
      } else {
        statusMap.set(filePath, "modified");
      }
    }
    const stats = [];
    for (const line of output.split("\n")) {
      const parts = line.split("	");
      if (parts.length < 3) continue;
      const [addedStr, removedStr, path4] = parts;
      const added = addedStr === "-" ? 0 : parseInt(addedStr, 10);
      const removed = removedStr === "-" ? 0 : parseInt(removedStr, 10);
      stats.push({
        path: path4,
        added,
        removed,
        status: statusMap.get(path4) ?? "modified"
      });
    }
    return stats;
  } catch {
    return [];
  }
}
var import_child_process2;
var init_omd_orchestrator = __esm({
  "src/hooks/omd-orchestrator/index.ts"() {
    "use strict";
    import_child_process2 = require("child_process");
    init_constants();
    init_boulder_state();
    init_notepad();
    init_audit();
    init_constants();
  }
});

// src/analytics/session-manager.ts
var session_manager_exports = {};
__export(session_manager_exports, {
  SessionManager: () => SessionManager,
  clearSessionActivity: () => clearSessionActivity,
  getSessionActivity: () => getSessionActivity,
  getSessionManager: () => getSessionManager,
  recordError: () => recordError,
  recordTaskCompleted: () => recordTaskCompleted,
  resetSessionManager: () => resetSessionManager
});
function recordTaskCompleted(sessionId) {
  const activity = sessionActivity.get(sessionId) || { tasksCompleted: 0, errorCount: 0 };
  activity.tasksCompleted++;
  sessionActivity.set(sessionId, activity);
}
function recordError(sessionId) {
  const activity = sessionActivity.get(sessionId) || { tasksCompleted: 0, errorCount: 0 };
  activity.errorCount++;
  sessionActivity.set(sessionId, activity);
}
function getSessionActivity(sessionId) {
  return sessionActivity.get(sessionId) || { tasksCompleted: 0, errorCount: 0 };
}
function clearSessionActivity(sessionId) {
  sessionActivity.delete(sessionId);
}
function getModifiedSourceFiles(projectPath) {
  try {
    const gitStats = getGitDiffStats(projectPath);
    return gitStats.map((stat) => stat.path).filter((filePath) => {
      const ext = path3.extname(filePath).toLowerCase();
      return SOURCE_FILE_EXTENSIONS.has(ext);
    });
  } catch {
    return [];
  }
}
function calculateSuccessRate(tasksCompleted, errorCount) {
  const total = tasksCompleted + errorCount;
  if (total === 0) {
    return 1;
  }
  return tasksCompleted / total;
}
function getSessionManager() {
  if (!globalManager) {
    globalManager = new SessionManager();
  }
  return globalManager;
}
function resetSessionManager() {
  globalManager = new SessionManager();
  return globalManager;
}
var path3, SESSION_HISTORY_FILE, SOURCE_FILE_EXTENSIONS, sessionActivity, SessionManager, globalManager;
var init_session_manager = __esm({
  "src/analytics/session-manager.ts"() {
    "use strict";
    init_state_manager();
    init_token_tracker();
    init_omd_orchestrator();
    path3 = __toESM(require("path"), 1);
    SESSION_HISTORY_FILE = "session-history";
    SOURCE_FILE_EXTENSIONS = /* @__PURE__ */ new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".py",
      ".rb",
      ".go",
      ".rs",
      ".java",
      ".kt",
      ".scala",
      ".c",
      ".cpp",
      ".cc",
      ".h",
      ".hpp",
      ".cs",
      ".fs",
      ".vb",
      ".swift",
      ".m",
      ".mm",
      ".php",
      ".lua",
      ".pl",
      ".pm",
      ".sh",
      ".bash",
      ".zsh",
      ".fish",
      ".sql",
      ".graphql",
      ".gql",
      ".html",
      ".css",
      ".scss",
      ".sass",
      ".less",
      ".json",
      ".yaml",
      ".yml",
      ".toml",
      ".xml",
      ".md",
      ".mdx",
      ".txt",
      ".vue",
      ".svelte",
      ".astro"
    ]);
    sessionActivity = /* @__PURE__ */ new Map();
    SessionManager = class {
      currentSession = null;
      history = null;
      async startSession(goals, tags = ["other"], notes = "") {
        const session = {
          id: this.generateSessionId(),
          projectPath: process.cwd(),
          goals,
          tags,
          startTime: (/* @__PURE__ */ new Date()).toISOString(),
          status: "active",
          outcomes: [],
          notes
        };
        this.currentSession = session;
        await this.saveCurrentSession();
        return session;
      }
      async endSession(outcomes, status = "completed") {
        if (!this.currentSession) {
          throw new Error("No active session to end");
        }
        const endTime = (/* @__PURE__ */ new Date()).toISOString();
        const startTime = new Date(this.currentSession.startTime);
        const duration = new Date(endTime).getTime() - startTime.getTime();
        this.currentSession.endTime = endTime;
        this.currentSession.duration = duration;
        this.currentSession.status = status;
        this.currentSession.outcomes = outcomes;
        await this.addToHistory(this.currentSession);
        const completedSession = { ...this.currentSession };
        this.currentSession = null;
        return completedSession;
      }
      async getCurrentSession() {
        if (!this.currentSession) {
          const result = readState("current-session", "local" /* LOCAL */);
          if (result.exists && result.data && result.data.status === "active") {
            this.currentSession = result.data;
          }
        }
        return this.currentSession;
      }
      async resumeSession(sessionId) {
        const history = await this.loadHistory();
        const session = history.sessions.find((s) => s.id === sessionId);
        if (!session) {
          throw new Error(`Session ${sessionId} not found in history`);
        }
        if (session.status !== "active") {
          session.status = "active";
          delete session.endTime;
          delete session.duration;
        }
        this.currentSession = session;
        await this.saveCurrentSession();
        return session;
      }
      async getSessionAnalytics(sessionId) {
        const tracker = getTokenTracker();
        const stats = await tracker.loadSessionStats(sessionId);
        const activity = getSessionActivity(sessionId);
        const history = await this.loadHistory();
        const sessionMeta = history.sessions.find((s) => s.id === sessionId);
        const projectPath = sessionMeta?.projectPath || this.currentSession?.projectPath || process.cwd();
        const filesModified = getModifiedSourceFiles(projectPath);
        const successRate = calculateSuccessRate(activity.tasksCompleted, activity.errorCount);
        if (!stats) {
          return {
            sessionId,
            totalTokens: 0,
            totalCost: 0,
            agentUsage: {},
            modelUsage: {},
            filesModified,
            tasksCompleted: activity.tasksCompleted,
            errorCount: activity.errorCount,
            successRate
          };
        }
        const agentUsage = {};
        for (const [agent, usages] of Object.entries(stats.byAgent)) {
          agentUsage[agent] = usages.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
        }
        const modelUsage = {};
        for (const [model, usages] of Object.entries(stats.byModel)) {
          modelUsage[model] = usages.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
        }
        const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
        return {
          sessionId,
          totalTokens,
          totalCost: stats.totalCost,
          agentUsage,
          modelUsage,
          filesModified,
          tasksCompleted: activity.tasksCompleted,
          errorCount: activity.errorCount,
          successRate
        };
      }
      async getSessionSummary(sessionId) {
        const history = await this.loadHistory();
        const metadata = history.sessions.find((s) => s.id === sessionId);
        if (!metadata) {
          throw new Error(`Session ${sessionId} not found`);
        }
        const analytics = await this.getSessionAnalytics(sessionId);
        return { metadata, analytics };
      }
      async getHistory() {
        return this.loadHistory();
      }
      async searchSessions(query) {
        const history = await this.loadHistory();
        return history.sessions.filter((session) => {
          if (query.tags && !query.tags.some((tag) => session.tags.includes(tag))) {
            return false;
          }
          if (query.status && session.status !== query.status) {
            return false;
          }
          if (query.projectPath && session.projectPath !== query.projectPath) {
            return false;
          }
          if (query.startDate && session.startTime < query.startDate) {
            return false;
          }
          if (query.endDate && session.endTime && session.endTime > query.endDate) {
            return false;
          }
          return true;
        });
      }
      async saveCurrentSession() {
        if (this.currentSession) {
          writeState("current-session", this.currentSession, "local" /* LOCAL */);
        }
      }
      async loadHistory() {
        if (this.history) {
          return this.history;
        }
        const result = readState(SESSION_HISTORY_FILE, "local" /* LOCAL */);
        if (result.exists && result.data) {
          this.history = result.data;
          return result.data;
        }
        this.history = {
          sessions: [],
          totalSessions: 0,
          totalCost: 0,
          averageDuration: 0,
          successRate: 0,
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
        };
        return this.history;
      }
      async addToHistory(session) {
        const history = await this.loadHistory();
        history.sessions.push(session);
        history.totalSessions++;
        history.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
        const completedSessions = history.sessions.filter((s) => s.status === "completed");
        if (completedSessions.length > 0) {
          const totalDuration = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
          history.averageDuration = totalDuration / completedSessions.length;
          history.successRate = completedSessions.length / history.totalSessions;
        }
        let totalCost = 0;
        for (const s of history.sessions) {
          const analytics = await this.getSessionAnalytics(s.id);
          totalCost += analytics.totalCost;
        }
        history.totalCost = totalCost;
        writeState(SESSION_HISTORY_FILE, history, "local" /* LOCAL */);
        this.history = history;
      }
      generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    };
    globalManager = null;
  }
});

// src/analytics/output-estimator.ts
var output_estimator_exports = {};
__export(output_estimator_exports, {
  estimateOutputTokens: () => estimateOutputTokens,
  extractSessionId: () => extractSessionId
});
function estimateOutputTokens(inputTokens, modelName) {
  if (inputTokens === 0) return 0;
  const ratio = detectModelRatio(modelName);
  return Math.round(inputTokens * ratio);
}
function extractSessionId(transcriptPath) {
  if (!transcriptPath) {
    return crypto.createHash("md5").update("unknown").digest("hex").slice(0, 16);
  }
  const match = transcriptPath.match(/projects\/([a-f0-9]{8,})/i);
  if (match) {
    return match[1];
  }
  return crypto.createHash("md5").update(transcriptPath).digest("hex").slice(0, 16);
}
function detectModelRatio(modelName) {
  const normalized = modelName.toLowerCase();
  for (const [tier, ratio] of Object.entries(MODEL_OUTPUT_RATIOS)) {
    if (normalized.includes(tier)) {
      return ratio;
    }
  }
  return DEFAULT_RATIO;
}
var crypto, MODEL_OUTPUT_RATIOS, DEFAULT_RATIO;
var init_output_estimator = __esm({
  "src/analytics/output-estimator.ts"() {
    "use strict";
    crypto = __toESM(require("crypto"), 1);
    MODEL_OUTPUT_RATIOS = {
      "haiku": 0.3,
      "sonnet": 0.4,
      "opus": 0.5
    };
    DEFAULT_RATIO = 0.4;
  }
});

// src/hud/stdin.ts
async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  const chunks = [];
  try {
    process.stdin.setEncoding("utf8");
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    const raw = chunks.join("");
    if (!raw.trim()) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function getTotalTokens(stdin) {
  const usage = stdin.context_window?.current_usage;
  return (usage?.input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0);
}
function getContextPercent(stdin) {
  const nativePercent = stdin.context_window?.used_percentage;
  if (typeof nativePercent === "number" && !Number.isNaN(nativePercent)) {
    return Math.min(100, Math.max(0, Math.round(nativePercent)));
  }
  const size = stdin.context_window?.context_window_size;
  if (!size || size <= 0) {
    return 0;
  }
  const totalTokens = getTotalTokens(stdin);
  return Math.min(100, Math.round(totalTokens / size * 100));
}
function getModelName(stdin) {
  return stdin.model?.display_name ?? stdin.model?.id ?? "Unknown";
}

// src/hud/transcript.ts
var import_fs = require("fs");
var import_readline = require("readline");
var import_path = require("path");
var MAX_TAIL_BYTES = 512 * 1024;
var MAX_AGENT_MAP_SIZE = 50;
var PERMISSION_TOOLS = [
  "Edit",
  "Write",
  "Bash",
  "proxy_Edit",
  "proxy_Write",
  "proxy_Bash"
];
var PERMISSION_THRESHOLD_MS = 3e3;
var pendingPermissionMap = /* @__PURE__ */ new Map();
var THINKING_PART_TYPES = ["thinking", "reasoning"];
var THINKING_RECENCY_MS = 3e4;
async function parseTranscript(transcriptPath, options) {
  pendingPermissionMap.clear();
  const result = {
    agents: [],
    todos: [],
    lastActivatedSkill: void 0
  };
  if (!transcriptPath || !(0, import_fs.existsSync)(transcriptPath)) {
    return result;
  }
  const agentMap = /* @__PURE__ */ new Map();
  const backgroundAgentMap = /* @__PURE__ */ new Map();
  let latestTodos = [];
  try {
    const stat = (0, import_fs.statSync)(transcriptPath);
    const fileSize = stat.size;
    if (fileSize > MAX_TAIL_BYTES) {
      const lines = readTailLines(transcriptPath, fileSize, MAX_TAIL_BYTES);
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          processEntry(entry, agentMap, latestTodos, result, MAX_AGENT_MAP_SIZE, backgroundAgentMap);
        } catch {
        }
      }
    } else {
      const fileStream = (0, import_fs.createReadStream)(transcriptPath);
      const rl = (0, import_readline.createInterface)({
        input: fileStream,
        crlfDelay: Infinity
      });
      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          processEntry(entry, agentMap, latestTodos, result, MAX_AGENT_MAP_SIZE, backgroundAgentMap);
        } catch {
        }
      }
    }
  } catch {
  }
  const staleMinutes = options?.staleTaskThresholdMinutes ?? 30;
  const STALE_AGENT_THRESHOLD_MS = staleMinutes * 60 * 1e3;
  const now = Date.now();
  for (const agent of agentMap.values()) {
    if (agent.status === "running") {
      const runningTime = now - agent.startTime.getTime();
      if (runningTime > STALE_AGENT_THRESHOLD_MS) {
        agent.status = "completed";
        agent.endTime = new Date(agent.startTime.getTime() + STALE_AGENT_THRESHOLD_MS);
      }
    }
  }
  for (const [id, permission] of pendingPermissionMap) {
    const age = now - permission.timestamp.getTime();
    if (age <= PERMISSION_THRESHOLD_MS) {
      result.pendingPermission = permission;
      break;
    }
  }
  if (result.thinkingState?.lastSeen) {
    const age = now - result.thinkingState.lastSeen.getTime();
    result.thinkingState.active = age <= THINKING_RECENCY_MS;
  }
  const running = Array.from(agentMap.values()).filter((a) => a.status === "running");
  const completed = Array.from(agentMap.values()).filter((a) => a.status === "completed");
  result.agents = [...running, ...completed.slice(-(10 - running.length))].slice(0, 10);
  result.todos = latestTodos;
  return result;
}
function readTailLines(filePath, fileSize, maxBytes) {
  const startOffset = Math.max(0, fileSize - maxBytes);
  const bytesToRead = fileSize - startOffset;
  const fd = (0, import_fs.openSync)(filePath, "r");
  const buffer = Buffer.alloc(bytesToRead);
  try {
    (0, import_fs.readSync)(fd, buffer, 0, bytesToRead, startOffset);
  } finally {
    (0, import_fs.closeSync)(fd);
  }
  const content = buffer.toString("utf8");
  const lines = content.split("\n");
  if (startOffset > 0 && lines.length > 0) {
    lines.shift();
  }
  return lines;
}
function extractBackgroundAgentId(content) {
  const text = typeof content === "string" ? content : content.find((c) => c.type === "text")?.text || "";
  const match = text.match(/agentId:\s*([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
function parseTaskOutputResult(content) {
  const text = typeof content === "string" ? content : content.find((c) => c.type === "text")?.text || "";
  const taskIdMatch = text.match(/<task_id>([^<]+)<\/task_id>/);
  const statusMatch = text.match(/<status>([^<]+)<\/status>/);
  if (taskIdMatch && statusMatch) {
    return { taskId: taskIdMatch[1], status: statusMatch[1] };
  }
  return null;
}
function extractTargetSummary(input, toolName) {
  if (!input || typeof input !== "object") return "...";
  const inp = input;
  if (toolName.includes("Edit") || toolName.includes("Write")) {
    const filePath = inp.file_path;
    if (filePath) {
      return (0, import_path.basename)(filePath) || filePath;
    }
  }
  if (toolName.includes("Bash")) {
    const cmd = inp.command;
    if (cmd) {
      const trimmed = cmd.trim().substring(0, 20);
      return trimmed.length < cmd.trim().length ? `${trimmed}...` : trimmed;
    }
  }
  return "...";
}
function processEntry(entry, agentMap, latestTodos, result, maxAgentMapSize = 50, backgroundAgentMap) {
  const timestamp = entry.timestamp ? new Date(entry.timestamp) : /* @__PURE__ */ new Date();
  if (!result.sessionStart && entry.timestamp) {
    result.sessionStart = timestamp;
  }
  const content = entry.message?.content;
  if (!content || !Array.isArray(content)) return;
  for (const block of content) {
    if (THINKING_PART_TYPES.includes(block.type)) {
      result.thinkingState = {
        active: true,
        lastSeen: timestamp
      };
    }
    if (block.type === "tool_use" && block.id && block.name) {
      if (block.name === "Task" || block.name === "proxy_Task") {
        const input = block.input;
        const agentEntry = {
          id: block.id,
          type: input?.subagent_type ?? "unknown",
          model: input?.model,
          description: input?.description,
          status: "running",
          startTime: timestamp
        };
        if (agentMap.size >= maxAgentMapSize) {
          let oldestCompleted = null;
          let oldestTime = Infinity;
          for (const [id, agent] of agentMap) {
            if (agent.status === "completed" && agent.startTime) {
              const time = agent.startTime.getTime();
              if (time < oldestTime) {
                oldestTime = time;
                oldestCompleted = id;
              }
            }
          }
          if (oldestCompleted) {
            agentMap.delete(oldestCompleted);
          }
        }
        agentMap.set(block.id, agentEntry);
      } else if (block.name === "TodoWrite") {
        const input = block.input;
        if (input?.todos && Array.isArray(input.todos)) {
          latestTodos.length = 0;
          latestTodos.push(
            ...input.todos.map((t) => ({
              content: t.content,
              status: t.status,
              activeForm: t.activeForm
            }))
          );
        }
      } else if (block.name === "Skill" || block.name === "proxy_Skill") {
        const input = block.input;
        if (input?.skill) {
          result.lastActivatedSkill = {
            name: input.skill,
            args: input.args,
            timestamp
          };
        }
      }
      if (PERMISSION_TOOLS.includes(block.name)) {
        pendingPermissionMap.set(block.id, {
          toolName: block.name.replace("proxy_", ""),
          targetSummary: extractTargetSummary(block.input, block.name),
          timestamp
        });
      }
    }
    if (block.type === "tool_result" && block.tool_use_id) {
      pendingPermissionMap.delete(block.tool_use_id);
      const agent = agentMap.get(block.tool_use_id);
      if (agent) {
        const blockContent = block.content;
        const isBackgroundLaunch = typeof blockContent === "string" ? blockContent.includes("Async agent launched") : Array.isArray(blockContent) && blockContent.some(
          (c) => c.type === "text" && c.text?.includes("Async agent launched")
        );
        if (isBackgroundLaunch) {
          if (backgroundAgentMap && blockContent) {
            const bgAgentId = extractBackgroundAgentId(blockContent);
            if (bgAgentId) {
              backgroundAgentMap.set(bgAgentId, block.tool_use_id);
            }
          }
        } else {
          agent.status = "completed";
          agent.endTime = timestamp;
        }
      }
      if (backgroundAgentMap && block.content) {
        const taskOutput = parseTaskOutputResult(block.content);
        if (taskOutput && taskOutput.status === "completed") {
          const toolUseId = backgroundAgentMap.get(taskOutput.taskId);
          if (toolUseId) {
            const bgAgent = agentMap.get(toolUseId);
            if (bgAgent && bgAgent.status === "running") {
              bgAgent.status = "completed";
              bgAgent.endTime = timestamp;
            }
          }
        }
      }
    }
  }
}

// src/hud/state.ts
var import_fs2 = require("fs");
var import_path2 = require("path");
var import_os = require("os");

// src/hud/types.ts
var DEFAULT_HUD_CONFIG = {
  preset: "focused",
  elements: {
    cwd: false,
    // Disabled by default for backward compatibility
    cwdFormat: "relative",
    omdLabel: true,
    rateLimits: true,
    // Show rate limits by default
    ralph: true,
    autopilot: true,
    team: true,
    prdStory: true,
    activeSkills: true,
    contextBar: true,
    agents: true,
    agentsFormat: "multiline",
    // Multi-line for rich agent visualization
    agentsMaxLines: 5,
    // Show up to 5 agent detail lines
    backgroundTasks: true,
    todos: true,
    lastSkill: true,
    permissionStatus: false,
    // Disabled: heuristic-based, causes false positives
    thinking: true,
    thinkingFormat: "text",
    // Text format for backward compatibility
    sessionHealth: true,
    useBars: false,
    // Disabled by default for backwards compatibility
    showCache: true,
    showCost: true,
    maxOutputLines: 4
  },
  thresholds: {
    contextWarning: 70,
    contextCompactSuggestion: 80,
    contextCritical: 85,
    ralphWarning: 7
  },
  staleTaskThresholdMinutes: 30
};

// src/hud/background-cleanup.ts
var STALE_TASK_THRESHOLD_MS = 30 * 60 * 1e3;
async function cleanupStaleBackgroundTasks(thresholdMs = STALE_TASK_THRESHOLD_MS) {
  const state = readHudState();
  if (!state || !state.backgroundTasks) {
    return 0;
  }
  const now = Date.now();
  const originalCount = state.backgroundTasks.length;
  state.backgroundTasks = state.backgroundTasks.filter((task) => {
    const taskAge = now - new Date(task.startedAt).getTime();
    return task.status === "completed" || taskAge < thresholdMs;
  });
  if (state.backgroundTasks.length > 20) {
    state.backgroundTasks = state.backgroundTasks.slice(-20);
  }
  const removedCount = originalCount - state.backgroundTasks.length;
  if (removedCount > 0) {
    writeHudState(state);
  }
  return removedCount;
}
async function detectOrphanedTasks() {
  const state = readHudState();
  if (!state || !state.backgroundTasks) {
    return [];
  }
  const orphaned = [];
  for (const task of state.backgroundTasks) {
    if (task.status === "running") {
      const taskAge = Date.now() - new Date(task.startedAt).getTime();
      const TWO_HOURS_MS = 2 * 60 * 60 * 1e3;
      if (taskAge > TWO_HOURS_MS) {
        orphaned.push(task);
      }
    }
  }
  return orphaned;
}
async function markOrphanedTasksAsStale() {
  const state = readHudState();
  if (!state || !state.backgroundTasks) {
    return 0;
  }
  const orphaned = await detectOrphanedTasks();
  let marked = 0;
  for (const orphanedTask of orphaned) {
    const task = state.backgroundTasks.find((t) => t.id === orphanedTask.id);
    if (task && task.status === "running") {
      task.status = "completed";
      marked++;
    }
  }
  if (marked > 0) {
    writeHudState(state);
  }
  return marked;
}

// src/hud/state.ts
function getLocalStateFilePath(directory) {
  const baseDir = directory || process.cwd();
  const omdStateDir = (0, import_path2.join)(baseDir, ".omd", "state");
  return (0, import_path2.join)(omdStateDir, "hud-state.json");
}
function getConfigFilePath() {
  return (0, import_path2.join)((0, import_os.homedir)(), ".factory", ".omd", "hud-config.json");
}
function ensureStateDir(directory) {
  const baseDir = directory || process.cwd();
  const omdStateDir = (0, import_path2.join)(baseDir, ".omd", "state");
  if (!(0, import_fs2.existsSync)(omdStateDir)) {
    (0, import_fs2.mkdirSync)(omdStateDir, { recursive: true });
  }
}
function readHudState(directory) {
  const localStateFile = getLocalStateFilePath(directory);
  if ((0, import_fs2.existsSync)(localStateFile)) {
    try {
      const content = (0, import_fs2.readFileSync)(localStateFile, "utf-8");
      return JSON.parse(content);
    } catch {
    }
  }
  const baseDir = directory || process.cwd();
  const legacyStateFile = (0, import_path2.join)(baseDir, ".omd", "hud-state.json");
  if ((0, import_fs2.existsSync)(legacyStateFile)) {
    try {
      const content = (0, import_fs2.readFileSync)(legacyStateFile, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}
function writeHudState(state, directory) {
  try {
    ensureStateDir(directory);
    const localStateFile = getLocalStateFilePath(directory);
    (0, import_fs2.writeFileSync)(localStateFile, JSON.stringify(state, null, 2));
    return true;
  } catch {
    return false;
  }
}
function getRunningTasks(state) {
  if (!state) return [];
  return state.backgroundTasks.filter((task) => task.status === "running");
}
function readHudConfig() {
  const configFile = getConfigFilePath();
  if (!(0, import_fs2.existsSync)(configFile)) {
    return DEFAULT_HUD_CONFIG;
  }
  try {
    const content = (0, import_fs2.readFileSync)(configFile, "utf-8");
    const config = JSON.parse(content);
    return {
      preset: config.preset ?? DEFAULT_HUD_CONFIG.preset,
      elements: {
        ...DEFAULT_HUD_CONFIG.elements,
        ...config.elements
      },
      thresholds: {
        ...DEFAULT_HUD_CONFIG.thresholds,
        ...config.thresholds
      },
      staleTaskThresholdMinutes: config.staleTaskThresholdMinutes ?? DEFAULT_HUD_CONFIG.staleTaskThresholdMinutes
    };
  } catch {
    return DEFAULT_HUD_CONFIG;
  }
}
async function initializeHUDState() {
  const removedStale = await cleanupStaleBackgroundTasks();
  const markedOrphaned = await markOrphanedTasksAsStale();
  if (removedStale > 0 || markedOrphaned > 0) {
    console.error(`HUD cleanup: removed ${removedStale} stale tasks, marked ${markedOrphaned} orphaned tasks`);
  }
}

// src/hud/omd-state.ts
var import_fs3 = require("fs");
var import_path3 = require("path");
var MAX_STATE_AGE_MS = 2 * 60 * 60 * 1e3;
function isStateFileStale(filePath) {
  try {
    const stat = (0, import_fs3.statSync)(filePath);
    const age = Date.now() - stat.mtimeMs;
    return age > MAX_STATE_AGE_MS;
  } catch {
    return true;
  }
}
function resolveStatePath(directory, filename) {
  const newPath = (0, import_path3.join)(directory, ".omd", "state", filename);
  const legacyPath = (0, import_path3.join)(directory, ".omd", filename);
  if ((0, import_fs3.existsSync)(newPath)) return newPath;
  if ((0, import_fs3.existsSync)(legacyPath)) return legacyPath;
  return null;
}
function readRalphStateForHud(directory) {
  const stateFile = resolveStatePath(directory, "ralph-state.json");
  if (!stateFile) {
    return null;
  }
  if (isStateFileStale(stateFile)) {
    return null;
  }
  try {
    const content = (0, import_fs3.readFileSync)(stateFile, "utf-8");
    const state = JSON.parse(content);
    if (!state.active) {
      return null;
    }
    return {
      active: state.active,
      iteration: state.iteration,
      maxIterations: state.max_iterations,
      prdMode: state.prd_mode,
      currentStoryId: state.current_story_id
    };
  } catch {
    return null;
  }
}
function readUltraworkStateForHud(directory) {
  const localFile = resolveStatePath(directory, "ultrawork-state.json");
  if (!localFile || isStateFileStale(localFile)) {
    return null;
  }
  try {
    const content = (0, import_fs3.readFileSync)(localFile, "utf-8");
    const state = JSON.parse(content);
    if (!state.active) {
      return null;
    }
    return {
      active: state.active,
      reinforcementCount: state.reinforcement_count
    };
  } catch {
    return null;
  }
}
function readPrdStateForHud(directory) {
  let prdPath = (0, import_path3.join)(directory, "prd.json");
  if (!(0, import_fs3.existsSync)(prdPath)) {
    prdPath = (0, import_path3.join)(directory, ".omd", "prd.json");
    if (!(0, import_fs3.existsSync)(prdPath)) {
      return null;
    }
  }
  try {
    const content = (0, import_fs3.readFileSync)(prdPath, "utf-8");
    const prd = JSON.parse(content);
    if (!prd.userStories || !Array.isArray(prd.userStories)) {
      return null;
    }
    const stories = prd.userStories;
    const completed = stories.filter((s) => s.passes).length;
    const total = stories.length;
    const incomplete = stories.filter((s) => !s.passes).sort((a, b) => a.priority - b.priority);
    return {
      currentStoryId: incomplete[0]?.id || null,
      completed,
      total
    };
  } catch {
    return null;
  }
}
function readAutopilotStateForHud(directory) {
  const stateFile = resolveStatePath(directory, "autopilot-state.json");
  if (!stateFile) {
    return null;
  }
  if (isStateFileStale(stateFile)) {
    return null;
  }
  try {
    const content = (0, import_fs3.readFileSync)(stateFile, "utf-8");
    const state = JSON.parse(content);
    if (!state.active) {
      return null;
    }
    return {
      active: state.active,
      phase: state.phase,
      iteration: state.iteration,
      maxIterations: state.max_iterations,
      tasksCompleted: state.execution?.tasks_completed,
      tasksTotal: state.execution?.tasks_total,
      filesCreated: state.execution?.files_created?.length
    };
  } catch {
    return null;
  }
}
function readTeamStateForHud(directory) {
  try {
    const teamDir = (0, import_path3.join)(directory, ".omd", "state", "team");
    if (!(0, import_fs3.existsSync)(teamDir)) {
      return null;
    }
    let files;
    try {
      files = (0, import_fs3.readdirSync)(teamDir);
    } catch {
      return null;
    }
    const teamFiles = files.filter((f) => f.endsWith(".json"));
    for (const file of teamFiles) {
      const filePath = (0, import_path3.join)(teamDir, file);
      try {
        const stat = (0, import_fs3.statSync)(filePath);
        if (!stat.isFile()) continue;
      } catch {
        continue;
      }
      if (isStateFileStale(filePath)) continue;
      try {
        const content = (0, import_fs3.readFileSync)(filePath, "utf-8");
        const team = JSON.parse(content);
        if (team.status !== "active") continue;
        const teamName = file.slice(0, -5);
        const orcPath = (0, import_path3.join)(teamDir, teamName, "orchestrator.json");
        let phase = "coordinate";
        if ((0, import_fs3.existsSync)(orcPath)) {
          try {
            const orcContent = (0, import_fs3.readFileSync)(orcPath, "utf-8");
            const orc = JSON.parse(orcContent);
            phase = orc.phase;
          } catch {
          }
        }
        const members = team.members || [];
        const running = members.filter((m) => m.status === "running" || m.status === "idle").length;
        const completed = members.filter((m) => m.status === "completed").length;
        const failed = members.filter((m) => m.status === "failed").length;
        return {
          active: true,
          teamName,
          phase,
          totalMembers: members.length,
          running,
          completed,
          failed
        };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

// src/hud/usage-api.ts
var import_fs4 = require("fs");
var import_os2 = require("os");
var import_path4 = require("path");
var import_child_process = require("child_process");
var import_https = __toESM(require("https"), 1);
var CACHE_TTL_SUCCESS_MS = 30 * 1e3;
var CACHE_TTL_FAILURE_MS = 15 * 1e3;
var API_TIMEOUT_MS = 1e4;
var TOKEN_REFRESH_URL_HOSTNAME = "platform.claude.com";
var TOKEN_REFRESH_URL_PATH = "/v1/oauth/token";
var DEFAULT_OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";
function getCachePath() {
  return (0, import_path4.join)((0, import_os2.homedir)(), ".factory/plugins/oh-my-droid/.usage-cache.json");
}
function readCache() {
  try {
    const cachePath = getCachePath();
    if (!(0, import_fs4.existsSync)(cachePath)) return null;
    const content = (0, import_fs4.readFileSync)(cachePath, "utf-8");
    const cache = JSON.parse(content);
    if (cache.data) {
      if (cache.data.fiveHourResetsAt) {
        cache.data.fiveHourResetsAt = new Date(cache.data.fiveHourResetsAt);
      }
      if (cache.data.weeklyResetsAt) {
        cache.data.weeklyResetsAt = new Date(cache.data.weeklyResetsAt);
      }
    }
    return cache;
  } catch {
    return null;
  }
}
function writeCache(data, error = false) {
  try {
    const cachePath = getCachePath();
    const cacheDir = (0, import_path4.dirname)(cachePath);
    if (!(0, import_fs4.existsSync)(cacheDir)) {
      (0, import_fs4.mkdirSync)(cacheDir, { recursive: true });
    }
    const cache = {
      timestamp: Date.now(),
      data,
      error
    };
    (0, import_fs4.writeFileSync)(cachePath, JSON.stringify(cache, null, 2));
  } catch {
  }
}
function isCacheValid(cache) {
  const ttl = cache.error ? CACHE_TTL_FAILURE_MS : CACHE_TTL_SUCCESS_MS;
  return Date.now() - cache.timestamp < ttl;
}
function readKeychainCredentials() {
  if (process.platform !== "darwin") return null;
  try {
    const result = (0, import_child_process.execSync)(
      '/usr/bin/security find-generic-password -s "Factory Droid-credentials" -w 2>/dev/null',
      { encoding: "utf-8", timeout: 2e3 }
    ).trim();
    if (!result) return null;
    const parsed = JSON.parse(result);
    const creds = parsed.claudeAiOauth || parsed;
    if (creds.accessToken) {
      return {
        accessToken: creds.accessToken,
        expiresAt: creds.expiresAt,
        refreshToken: creds.refreshToken,
        source: "keychain"
      };
    }
  } catch {
  }
  return null;
}
function readFileCredentials() {
  try {
    const credPath = (0, import_path4.join)((0, import_os2.homedir)(), ".factory/.credentials.json");
    if (!(0, import_fs4.existsSync)(credPath)) return null;
    const content = (0, import_fs4.readFileSync)(credPath, "utf-8");
    const parsed = JSON.parse(content);
    const creds = parsed.claudeAiOauth || parsed;
    if (creds.accessToken) {
      return {
        accessToken: creds.accessToken,
        expiresAt: creds.expiresAt,
        refreshToken: creds.refreshToken,
        source: "file"
      };
    }
  } catch {
  }
  return null;
}
function getCredentials() {
  const keychainCreds = readKeychainCredentials();
  if (keychainCreds) return keychainCreds;
  return readFileCredentials();
}
function validateCredentials(creds) {
  if (!creds.accessToken) return false;
  if (creds.expiresAt != null) {
    const now = Date.now();
    if (creds.expiresAt <= now) return false;
  }
  return true;
}
function refreshAccessToken(refreshToken) {
  return new Promise((resolve) => {
    const clientId = process.env.CLAUDE_CODE_OAUTH_CLIENT_ID || DEFAULT_OAUTH_CLIENT_ID;
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId
    }).toString();
    const req = import_https.default.request(
      {
        hostname: TOKEN_REFRESH_URL_HOSTNAME,
        path: TOKEN_REFRESH_URL_PATH,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body)
        },
        timeout: API_TIMEOUT_MS
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              if (parsed.access_token) {
                resolve({
                  accessToken: parsed.access_token,
                  refreshToken: parsed.refresh_token || refreshToken,
                  expiresAt: parsed.expires_in ? Date.now() + parsed.expires_in * 1e3 : parsed.expires_at
                });
                return;
              }
            } catch {
            }
          }
          if (process.env.OMC_DEBUG) {
            console.error(`[usage-api] Token refresh failed: HTTP ${res.statusCode}`);
          }
          resolve(null);
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end(body);
  });
}
function fetchUsageFromApi(accessToken) {
  return new Promise((resolve) => {
    const req = import_https.default.request(
      {
        hostname: "api.anthropic.com",
        path: "/api/oauth/usage",
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "anthropic-beta": "oauth-2025-04-20",
          "Content-Type": "application/json"
        },
        timeout: API_TIMEOUT_MS
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}
function writeBackCredentials(creds) {
  try {
    const credPath = (0, import_path4.join)((0, import_os2.homedir)(), ".factory/.credentials.json");
    if (!(0, import_fs4.existsSync)(credPath)) return;
    const content = (0, import_fs4.readFileSync)(credPath, "utf-8");
    const parsed = JSON.parse(content);
    if (parsed.claudeAiOauth) {
      parsed.claudeAiOauth.accessToken = creds.accessToken;
      if (creds.expiresAt != null) {
        parsed.claudeAiOauth.expiresAt = creds.expiresAt;
      }
      if (creds.refreshToken) {
        parsed.claudeAiOauth.refreshToken = creds.refreshToken;
      }
    } else {
      parsed.accessToken = creds.accessToken;
      if (creds.expiresAt != null) {
        parsed.expiresAt = creds.expiresAt;
      }
      if (creds.refreshToken) {
        parsed.refreshToken = creds.refreshToken;
      }
    }
    const tmpPath = `${credPath}.tmp.${process.pid}`;
    try {
      (0, import_fs4.writeFileSync)(tmpPath, JSON.stringify(parsed, null, 2), { mode: 384 });
      (0, import_fs4.renameSync)(tmpPath, credPath);
    } catch (writeErr) {
      try {
        if ((0, import_fs4.existsSync)(tmpPath)) {
          (0, import_fs4.unlinkSync)(tmpPath);
        }
      } catch {
      }
      throw writeErr;
    }
  } catch {
    if (process.env.OMC_DEBUG) {
      console.error("[usage-api] Failed to write back refreshed credentials");
    }
  }
}
function parseUsageResponse(response) {
  const fiveHour = response.five_hour?.utilization;
  const sevenDay = response.seven_day?.utilization;
  if (fiveHour == null && sevenDay == null) return null;
  const clamp = (v) => {
    if (v == null || !isFinite(v)) return 0;
    return Math.max(0, Math.min(100, v));
  };
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };
  const sonnetSevenDay = response.seven_day_sonnet?.utilization;
  const sonnetResetsAt = response.seven_day_sonnet?.resets_at;
  const result = {
    fiveHourPercent: clamp(fiveHour),
    weeklyPercent: clamp(sevenDay),
    fiveHourResetsAt: parseDate(response.five_hour?.resets_at),
    weeklyResetsAt: parseDate(response.seven_day?.resets_at)
  };
  if (sonnetSevenDay != null) {
    result.sonnetWeeklyPercent = clamp(sonnetSevenDay);
    result.sonnetWeeklyResetsAt = parseDate(sonnetResetsAt);
  }
  return result;
}
async function getUsage() {
  const cache = readCache();
  if (cache && isCacheValid(cache)) {
    return cache.data;
  }
  let creds = getCredentials();
  if (!creds) {
    writeCache(null, true);
    return null;
  }
  if (!validateCredentials(creds)) {
    if (creds.refreshToken) {
      const refreshed = await refreshAccessToken(creds.refreshToken);
      if (refreshed) {
        creds = { ...creds, ...refreshed };
        writeBackCredentials(creds);
      } else {
        writeCache(null, true);
        return null;
      }
    } else {
      writeCache(null, true);
      return null;
    }
  }
  const response = await fetchUsageFromApi(creds.accessToken);
  if (!response) {
    writeCache(null, true);
    return null;
  }
  const usage = parseUsageResponse(response);
  writeCache(usage, !usage);
  return usage;
}

// src/hud/colors.ts
var RESET = "\x1B[0m";
var DIM = "\x1B[2m";
var BOLD = "\x1B[1m";
var RED = "\x1B[31m";
var GREEN = "\x1B[32m";
var YELLOW = "\x1B[33m";
var MAGENTA = "\x1B[35m";
var CYAN = "\x1B[36m";
function cyan(text) {
  return `${CYAN}${text}${RESET}`;
}
function dim(text) {
  return `${DIM}${text}${RESET}`;
}
function bold(text) {
  return `${BOLD}${text}${RESET}`;
}
function getModelTierColor(model) {
  if (!model) return CYAN;
  const tier = model.toLowerCase();
  if (tier.includes("opus")) return MAGENTA;
  if (tier.includes("sonnet")) return YELLOW;
  if (tier.includes("haiku")) return GREEN;
  return CYAN;
}
function getDurationColor(durationMs) {
  const minutes = durationMs / 6e4;
  if (minutes >= 5) return RED;
  if (minutes >= 2) return YELLOW;
  return GREEN;
}

// src/hud/elements/ralph.ts
var RED2 = "\x1B[31m";
var YELLOW2 = "\x1B[33m";
var GREEN2 = "\x1B[32m";
function renderRalph(state, thresholds) {
  if (!state?.active) {
    return null;
  }
  const { iteration, maxIterations } = state;
  const warningThreshold = thresholds.ralphWarning;
  const criticalThreshold = Math.floor(maxIterations * 0.9);
  let color;
  if (iteration >= criticalThreshold) {
    color = RED2;
  } else if (iteration >= warningThreshold) {
    color = YELLOW2;
  } else {
    color = GREEN2;
  }
  return `ralph:${color}${iteration}/${maxIterations}${RESET}`;
}

// src/hud/elements/agents.ts
var CYAN2 = "\x1B[36m";
var AGENT_TYPE_CODES = {
  // Architect variants - 'A' for Architect
  architect: "A",
  // opus
  "architect-medium": "a",
  // sonnet
  "architect-low": "a",
  // haiku
  // Researcher variants - 'R' for Researcher
  researcher: "r",
  // sonnet
  "researcher-low": "r",
  // haiku
  // Explore variants - 'E' for Explore
  explore: "e",
  // haiku
  "explore-medium": "e",
  // sonnet
  // Designer variants - 'D' for Designer
  designer: "d",
  // sonnet
  "designer-low": "d",
  // haiku
  "designer-high": "D",
  // opus
  // Writer - 'W' for Writer
  writer: "w",
  // haiku
  // Vision - 'V' for Vision
  vision: "v",
  // sonnet
  // Critic - 'C' for Critic
  critic: "C",
  // opus
  // Analyst - 'T' for meTis (A taken by Architect)
  analyst: "T",
  // opus
  // Executor variants - 'X' for eXecutor
  executor: "x",
  // sonnet
  "executor-low": "x",
  // haiku
  "executor-high": "X",
  // opus
  // Planner - 'P' for Planner
  planner: "P",
  // opus
  // QA-Tester variants - 'Q' for QA
  "qa-tester": "q",
  // sonnet
  "qa-tester-high": "Q"
  // opus
};
function getAgentCode(agentType, model) {
  const parts = agentType.split(":");
  const shortName = parts[parts.length - 1] || agentType;
  let code = AGENT_TYPE_CODES[shortName];
  if (!code) {
    code = shortName.charAt(0).toUpperCase();
  }
  if (model) {
    const tier = model.toLowerCase();
    if (tier.includes("opus")) {
      code = code.toUpperCase();
    } else {
      code = code.toLowerCase();
    }
  }
  return code;
}
function formatDuration(durationMs) {
  const seconds = Math.floor(durationMs / 1e3);
  const minutes = Math.floor(seconds / 60);
  if (seconds < 10) {
    return "";
  } else if (seconds < 60) {
    return `(${seconds}s)`;
  } else if (minutes < 10) {
    return `(${minutes}m)`;
  } else {
    return "!";
  }
}
function renderAgents(agents) {
  const running = agents.filter((a) => a.status === "running").length;
  if (running === 0) {
    return null;
  }
  return `agents:${CYAN2}${running}${RESET}`;
}
function sortByFreshest(agents) {
  return [...agents].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}
function renderAgentsCoded(agents) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return null;
  }
  const codes = running.map((a) => {
    const code = getAgentCode(a.type, a.model);
    const color = getModelTierColor(a.model);
    return `${color}${code}${RESET}`;
  });
  return `agents:${codes.join("")}`;
}
function renderAgentsCodedWithDuration(agents) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return null;
  }
  const now = Date.now();
  const codes = running.map((a) => {
    const code = getAgentCode(a.type, a.model);
    const durationMs = now - a.startTime.getTime();
    const duration = formatDuration(durationMs);
    const modelColor = getModelTierColor(a.model);
    if (duration === "!") {
      const durationColor = getDurationColor(durationMs);
      return `${modelColor}${code}${durationColor}!${RESET}`;
    } else if (duration) {
      return `${modelColor}${code}${dim(duration)}${RESET}`;
    } else {
      return `${modelColor}${code}${RESET}`;
    }
  });
  return `agents:${codes.join("")}`;
}
function renderAgentsDetailed(agents) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return null;
  }
  const now = Date.now();
  const names = running.map((a) => {
    const parts = a.type.split(":");
    let name = parts[parts.length - 1] || a.type;
    if (name === "executor") name = "exec";
    if (name === "executor-low") name = "exec-l";
    if (name === "executor-high") name = "exec-h";
    if (name === "designer") name = "design";
    if (name === "designer-low") name = "design-l";
    if (name === "designer-high") name = "design-h";
    if (name === "qa-tester") name = "qa";
    if (name === "qa-tester-high") name = "qa-h";
    if (name === "architect-medium") name = "arch-m";
    if (name === "architect-low") name = "arch-l";
    if (name === "researcher-low") name = "research-l";
    const durationMs = now - a.startTime.getTime();
    const duration = formatDuration(durationMs);
    return duration ? `${name}${duration}` : name;
  });
  return `agents:[${CYAN2}${names.join(",")}${RESET}]`;
}
function truncateDescription(desc, maxLen = 20) {
  if (!desc) return "...";
  if (desc.length <= maxLen) return desc;
  return desc.slice(0, maxLen - 3) + "...";
}
function getShortAgentName(agentType) {
  const parts = agentType.split(":");
  let name = parts[parts.length - 1] || agentType;
  const abbrevs = {
    // Executor variants -> 'exec'
    "executor": "exec",
    "executor-low": "exec",
    "executor-high": "exec",
    // Designer variants -> 'design'
    "designer": "design",
    "designer-low": "design",
    "designer-high": "design",
    // Keep actual names for clarity
    "writer": "writer",
    "vision": "vision",
    // Collapse tier variants to base name
    "architect-low": "arch",
    "architect-medium": "arch",
    "explore-medium": "explore",
    "researcher-low": "research",
    // QA variants
    "qa-tester": "qa",
    "qa-tester-high": "qa"
  };
  return abbrevs[name] || name;
}
function renderAgentsWithDescriptions(agents) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return null;
  }
  const now = Date.now();
  const entries = running.map((a) => {
    const code = getAgentCode(a.type, a.model);
    const color = getModelTierColor(a.model);
    const desc = truncateDescription(a.description, 25);
    const durationMs = now - a.startTime.getTime();
    const duration = formatDuration(durationMs);
    let entry = `${color}${code}${RESET}:${dim(desc)}`;
    if (duration && duration !== "!") {
      entry += dim(duration);
    } else if (duration === "!") {
      const durationColor = getDurationColor(durationMs);
      entry += `${durationColor}!${RESET}`;
    }
    return entry;
  });
  return entries.join(dim(" | "));
}
function renderAgentsDescOnly(agents) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return null;
  }
  const now = Date.now();
  const descriptions = running.map((a) => {
    const color = getModelTierColor(a.model);
    const shortName = getShortAgentName(a.type);
    const desc = a.description ? truncateDescription(a.description, 20) : shortName;
    const durationMs = now - a.startTime.getTime();
    const duration = formatDuration(durationMs);
    if (duration === "!") {
      const durationColor = getDurationColor(durationMs);
      return `${color}${desc}${durationColor}!${RESET}`;
    } else if (duration) {
      return `${color}${desc}${dim(duration)}${RESET}`;
    }
    return `${color}${desc}${RESET}`;
  });
  return `[${descriptions.join(dim(", "))}]`;
}
function formatDurationPadded(durationMs) {
  const seconds = Math.floor(durationMs / 1e3);
  const minutes = Math.floor(seconds / 60);
  if (seconds < 10) {
    return "    ";
  } else if (seconds < 60) {
    return `${seconds}s`.padStart(4);
  } else if (minutes < 10) {
    return `${minutes}m`.padStart(4);
  } else {
    return `${minutes}m`.padStart(4);
  }
}
function renderAgentsMultiLine(agents, maxLines = 5) {
  const running = sortByFreshest(agents.filter((a) => a.status === "running"));
  if (running.length === 0) {
    return { headerPart: null, detailLines: [] };
  }
  const headerPart = `agents:${CYAN2}${running.length}${RESET}`;
  const now = Date.now();
  const detailLines = [];
  const displayCount = Math.min(running.length, maxLines);
  running.slice(0, maxLines).forEach((a, index) => {
    const isLast = index === displayCount - 1 && running.length <= maxLines;
    const prefix = isLast ? "\u2514\u2500" : "\u251C\u2500";
    const code = getAgentCode(a.type, a.model);
    const color = getModelTierColor(a.model);
    const shortName = getShortAgentName(a.type).padEnd(12);
    const durationMs = now - a.startTime.getTime();
    const duration = formatDurationPadded(durationMs);
    const durationColor = getDurationColor(durationMs);
    const desc = a.description || "...";
    const truncatedDesc = desc.length > 45 ? desc.slice(0, 42) + "..." : desc;
    detailLines.push(
      `${dim(prefix)} ${color}${code}${RESET} ${dim(shortName)}${durationColor}${duration}${RESET}  ${truncatedDesc}`
    );
  });
  if (running.length > maxLines) {
    const remaining = running.length - maxLines;
    detailLines.push(`${dim(`\u2514\u2500 +${remaining} more agents...`)}`);
  }
  return { headerPart, detailLines };
}
function renderAgentsByFormat(agents, format) {
  switch (format) {
    case "count":
      return renderAgents(agents);
    case "codes":
      return renderAgentsCoded(agents);
    case "codes-duration":
      return renderAgentsCodedWithDuration(agents);
    case "detailed":
      return renderAgentsDetailed(agents);
    case "descriptions":
      return renderAgentsWithDescriptions(agents);
    case "tasks":
      return renderAgentsDescOnly(agents);
    case "multiline":
      return renderAgentsMultiLine(agents).headerPart;
    default:
      return renderAgentsCoded(agents);
  }
}

// src/hud/elements/todos.ts
var GREEN3 = "\x1B[32m";
var YELLOW3 = "\x1B[33m";
var CYAN3 = "\x1B[36m";
var DIM2 = "\x1B[2m";
function renderTodosWithCurrent(todos) {
  if (todos.length === 0) {
    return null;
  }
  const completed = todos.filter((t) => t.status === "completed").length;
  const total = todos.length;
  const inProgress = todos.find((t) => t.status === "in_progress");
  const percent = completed / total * 100;
  let color;
  if (percent >= 80) {
    color = GREEN3;
  } else if (percent >= 50) {
    color = YELLOW3;
  } else {
    color = CYAN3;
  }
  let result = `todos:${color}${completed}/${total}${RESET}`;
  if (inProgress) {
    const activeText = inProgress.activeForm || inProgress.content;
    const truncated = activeText.length > 30 ? activeText.slice(0, 27) + "..." : activeText;
    result += ` ${DIM2}(working: ${truncated})${RESET}`;
  }
  return result;
}

// src/hud/elements/skills.ts
var MAGENTA2 = "\x1B[35m";
var BRIGHT_MAGENTA = "\x1B[95m";
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "..." : str;
}
function isActiveMode(skillName, ultrawork, ralph) {
  if (skillName === "ultrawork" && ultrawork?.active) return true;
  if (skillName === "ralph" && ralph?.active) return true;
  if (skillName === "ultrawork+ralph" && ultrawork?.active && ralph?.active) return true;
  return false;
}
function renderSkills(ultrawork, ralph, lastSkill) {
  const parts = [];
  if (ralph?.active && ultrawork?.active) {
    parts.push(`${BRIGHT_MAGENTA}ultrawork+ralph${RESET}`);
  } else if (ultrawork?.active) {
    parts.push(`${MAGENTA2}ultrawork${RESET}`);
  } else if (ralph?.active) {
    parts.push(`${MAGENTA2}ralph${RESET}`);
  }
  if (lastSkill && !isActiveMode(lastSkill.name, ultrawork, ralph)) {
    const argsDisplay = lastSkill.args ? `(${truncate(lastSkill.args, 15)})` : "";
    parts.push(cyan(`skill:${lastSkill.name}${argsDisplay}`));
  }
  return parts.length > 0 ? parts.join(" ") : null;
}
function renderLastSkill(lastSkill) {
  if (!lastSkill) return null;
  const argsDisplay = lastSkill.args ? `(${truncate(lastSkill.args, 15)})` : "";
  return cyan(`skill:${lastSkill.name}${argsDisplay}`);
}

// src/hud/elements/context.ts
var GREEN4 = "\x1B[32m";
var YELLOW4 = "\x1B[33m";
var RED3 = "\x1B[31m";
var DIM3 = "\x1B[2m";
function renderContext(percent, thresholds) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  let color;
  let suffix = "";
  if (safePercent >= thresholds.contextCritical) {
    color = RED3;
    suffix = " CRITICAL";
  } else if (safePercent >= thresholds.contextCompactSuggestion) {
    color = YELLOW4;
    suffix = " COMPRESS?";
  } else if (safePercent >= thresholds.contextWarning) {
    color = YELLOW4;
  } else {
    color = GREEN4;
  }
  return `ctx:${color}${safePercent}%${suffix}${RESET}`;
}
function renderContextWithBar(percent, thresholds, barWidth = 10) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));
  const filled = Math.round(safePercent / 100 * barWidth);
  const empty = barWidth - filled;
  let color;
  if (safePercent >= thresholds.contextCritical) {
    color = RED3;
  } else if (safePercent >= thresholds.contextWarning) {
    color = YELLOW4;
  } else {
    color = GREEN4;
  }
  const bar = `${color}${"\u2588".repeat(filled)}${DIM3}${"\u2591".repeat(empty)}${RESET}`;
  return `ctx:[${bar}]${color}${safePercent}%${RESET}`;
}

// src/hud/elements/background.ts
var CYAN4 = "\x1B[36m";
var GREEN5 = "\x1B[32m";
var YELLOW5 = "\x1B[33m";
var MAX_CONCURRENT = 5;
function renderBackground(tasks) {
  const running = tasks.filter((t) => t.status === "running").length;
  if (running === 0) {
    return null;
  }
  let color;
  if (running >= MAX_CONCURRENT) {
    color = YELLOW5;
  } else if (running >= MAX_CONCURRENT - 1) {
    color = CYAN4;
  } else {
    color = GREEN5;
  }
  return `bg:${color}${running}/${MAX_CONCURRENT}${RESET}`;
}

// src/hud/elements/prd.ts
var CYAN5 = "\x1B[36m";
var GREEN6 = "\x1B[32m";
function renderPrd(state) {
  if (!state) {
    return null;
  }
  const { currentStoryId, completed, total } = state;
  if (completed === total) {
    return `${GREEN6}PRD:done${RESET}`;
  }
  if (currentStoryId) {
    return `${CYAN5}${currentStoryId}${RESET}`;
  }
  return null;
}

// src/hud/elements/limits.ts
var GREEN7 = "\x1B[32m";
var YELLOW6 = "\x1B[33m";
var RED4 = "\x1B[31m";
var DIM4 = "\x1B[2m";
var WARNING_THRESHOLD = 70;
var CRITICAL_THRESHOLD = 90;
function getColor(percent) {
  if (percent >= CRITICAL_THRESHOLD) {
    return RED4;
  } else if (percent >= WARNING_THRESHOLD) {
    return YELLOW6;
  }
  return GREEN7;
}
function formatResetTime(date) {
  if (!date) return null;
  const now = Date.now();
  const resetMs = date.getTime();
  const diffMs = resetMs - now;
  if (diffMs <= 0) return null;
  const diffMinutes = Math.floor(diffMs / 6e4);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) {
    const remainingHours = diffHours % 24;
    return `${diffDays}d${remainingHours}h`;
  }
  const remainingMinutes = diffMinutes % 60;
  return `${diffHours}h${remainingMinutes}m`;
}
function renderRateLimits(limits) {
  if (!limits) return null;
  const fiveHour = Math.min(100, Math.max(0, Math.round(limits.fiveHourPercent)));
  const weekly = Math.min(100, Math.max(0, Math.round(limits.weeklyPercent)));
  const fiveHourColor = getColor(fiveHour);
  const weeklyColor = getColor(weekly);
  const fiveHourReset = formatResetTime(limits.fiveHourResetsAt);
  const weeklyReset = formatResetTime(limits.weeklyResetsAt);
  const fiveHourPart = fiveHourReset ? `5h:${fiveHourColor}${fiveHour}%${RESET}${DIM4}(${fiveHourReset})${RESET}` : `5h:${fiveHourColor}${fiveHour}%${RESET}`;
  const weeklyPart = weeklyReset ? `${DIM4}wk:${RESET}${weeklyColor}${weekly}%${RESET}${DIM4}(${weeklyReset})${RESET}` : `${DIM4}wk:${RESET}${weeklyColor}${weekly}%${RESET}`;
  return `${fiveHourPart} ${weeklyPart}`;
}
function renderRateLimitsWithBar(limits, barWidth = 8) {
  if (!limits) return null;
  const fiveHour = Math.min(100, Math.max(0, Math.round(limits.fiveHourPercent)));
  const weekly = Math.min(100, Math.max(0, Math.round(limits.weeklyPercent)));
  const fiveHourColor = getColor(fiveHour);
  const weeklyColor = getColor(weekly);
  const fiveHourFilled = Math.round(fiveHour / 100 * barWidth);
  const fiveHourEmpty = barWidth - fiveHourFilled;
  const fiveHourBar = `${fiveHourColor}${"\u2588".repeat(fiveHourFilled)}${DIM4}${"\u2591".repeat(fiveHourEmpty)}${RESET}`;
  const weeklyFilled = Math.round(weekly / 100 * barWidth);
  const weeklyEmpty = barWidth - weeklyFilled;
  const weeklyBar = `${weeklyColor}${"\u2588".repeat(weeklyFilled)}${DIM4}${"\u2591".repeat(weeklyEmpty)}${RESET}`;
  const fiveHourReset = formatResetTime(limits.fiveHourResetsAt);
  const weeklyReset = formatResetTime(limits.weeklyResetsAt);
  const fiveHourPart = fiveHourReset ? `5h:[${fiveHourBar}]${fiveHourColor}${fiveHour}%${RESET}${DIM4}(${fiveHourReset})${RESET}` : `5h:[${fiveHourBar}]${fiveHourColor}${fiveHour}%${RESET}`;
  const weeklyPart = weeklyReset ? `${DIM4}wk:${RESET}[${weeklyBar}]${weeklyColor}${weekly}%${RESET}${DIM4}(${weeklyReset})${RESET}` : `${DIM4}wk:${RESET}[${weeklyBar}]${weeklyColor}${weekly}%${RESET}`;
  return `${fiveHourPart} ${weeklyPart}`;
}

// src/hud/elements/permission.ts
var YELLOW7 = "\x1B[33m";
var DIM5 = "\x1B[2m";
function renderPermission(pending) {
  if (!pending) return null;
  return `${YELLOW7}APPROVE?${RESET} ${DIM5}${pending.toolName.toLowerCase()}${RESET}:${pending.targetSummary}`;
}

// src/hud/elements/thinking.ts
var CYAN6 = "\x1B[36m";
function renderThinking(state, format = "text") {
  if (!state?.active) return null;
  switch (format) {
    case "bubble":
      return "\u{1F4AD}";
    case "brain":
      return "\u{1F9E0}";
    case "face":
      return "\u{1F914}";
    case "text":
      return `${CYAN6}thinking${RESET}`;
    default:
      return "\u{1F4AD}";
  }
}

// src/hud/elements/session.ts
var GREEN8 = "\x1B[32m";
var YELLOW8 = "\x1B[33m";
var RED5 = "\x1B[31m";
function renderSession(session) {
  if (!session) return null;
  const color = session.health === "critical" ? RED5 : session.health === "warning" ? YELLOW8 : GREEN8;
  return `session:${color}${session.durationMinutes}m${RESET}`;
}

// src/hud/elements/autopilot.ts
var CYAN7 = "\x1B[36m";
var GREEN9 = "\x1B[32m";
var YELLOW9 = "\x1B[33m";
var RED6 = "\x1B[31m";
var MAGENTA3 = "\x1B[35m";
var PHASE_NAMES = {
  expansion: "Expand",
  planning: "Plan",
  execution: "Build",
  qa: "QA",
  validation: "Verify",
  complete: "Done",
  failed: "Failed"
};
var PHASE_INDEX = {
  expansion: 1,
  planning: 2,
  execution: 3,
  qa: 4,
  validation: 5,
  complete: 5,
  failed: 0
};
function renderAutopilot(state, _thresholds) {
  if (!state?.active) {
    return null;
  }
  const { phase, iteration, maxIterations, tasksCompleted, tasksTotal, filesCreated } = state;
  const phaseNum = PHASE_INDEX[phase] || 0;
  const phaseName = PHASE_NAMES[phase] || phase;
  let phaseColor;
  switch (phase) {
    case "complete":
      phaseColor = GREEN9;
      break;
    case "failed":
      phaseColor = RED6;
      break;
    case "validation":
      phaseColor = MAGENTA3;
      break;
    case "qa":
      phaseColor = YELLOW9;
      break;
    default:
      phaseColor = CYAN7;
  }
  let output = `${CYAN7}[AUTOPILOT]${RESET} Phase ${phaseColor}${phaseNum}/5${RESET}: ${phaseName}`;
  if (iteration > 1) {
    output += ` (iter ${iteration}/${maxIterations})`;
  }
  if (phase === "execution" && tasksTotal && tasksTotal > 0) {
    const taskColor = tasksCompleted === tasksTotal ? GREEN9 : YELLOW9;
    output += ` | Tasks: ${taskColor}${tasksCompleted || 0}/${tasksTotal}${RESET}`;
  }
  if (filesCreated && filesCreated > 0) {
    output += ` | ${filesCreated} files`;
  }
  return output;
}

// src/hud/elements/team.ts
var CYAN8 = "\x1B[36m";
var GREEN10 = "\x1B[32m";
var YELLOW10 = "\x1B[33m";
var RED7 = "\x1B[31m";
var PHASE_NAMES2 = {
  init: "Init",
  delegate: "Assign",
  coordinate: "Work",
  collect: "Collect",
  finalize: "Done"
};
function renderTeam(state) {
  if (!state?.active) {
    return null;
  }
  const { teamName, phase, totalMembers, running, completed, failed } = state;
  const phaseName = PHASE_NAMES2[phase] || phase;
  let statusColor;
  if (failed > 0) {
    statusColor = RED7;
  } else if (completed === totalMembers) {
    statusColor = GREEN10;
  } else if (running > 0) {
    statusColor = CYAN8;
  } else {
    statusColor = YELLOW10;
  }
  const progress = `${statusColor}${completed}/${totalMembers}${RESET}`;
  let output = `${CYAN8}[TEAM:${teamName}]${RESET} ${progress} done`;
  if (failed > 0) {
    output += ` ${RED7}${failed} failed${RESET}`;
  }
  output += ` | ${phaseName}`;
  return output;
}

// src/hud/elements/cwd.ts
var import_node_os = require("node:os");
var import_node_path = require("node:path");
function renderCwd(cwd, format = "relative") {
  if (!cwd) return null;
  let displayPath;
  switch (format) {
    case "relative": {
      const home = (0, import_node_os.homedir)();
      displayPath = cwd.startsWith(home) ? "~" + cwd.slice(home.length) : cwd;
      break;
    }
    case "absolute":
      displayPath = cwd;
      break;
    case "folder":
      displayPath = (0, import_node_path.basename)(cwd);
      break;
    default:
      displayPath = cwd;
  }
  return `${dim(displayPath)}`;
}

// src/hud/analytics-display.ts
async function getAnalyticsDisplay() {
  try {
    const { getTokenTracker: getTokenTracker2 } = await Promise.resolve().then(() => (init_token_tracker(), token_tracker_exports));
    const { calculateCost: calculateCost2, formatCost: formatCost2, getCostColor: getCostColor2 } = await Promise.resolve().then(() => (init_cost_estimator(), cost_estimator_exports));
    const tracker = getTokenTracker2();
    const stats = tracker.getSessionStats();
    let totalCost = 0;
    for (const [model, usages] of Object.entries(stats.byModel)) {
      for (const usage of usages) {
        const cost = calculateCost2({
          modelName: model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheCreationTokens: usage.cacheCreationTokens,
          cacheReadTokens: usage.cacheReadTokens
        });
        totalCost += cost.totalCost;
      }
    }
    const topAgents = await tracker.getTopAgents(3);
    const topAgentsStr = topAgents.length > 0 ? topAgents.map((a) => `${a.agent}:${formatCost2(a.cost)}`).join(" ") : "none";
    const totalCacheRead = stats.totalCacheRead;
    const totalInput = stats.totalInputTokens;
    const cacheHitRate = totalInput > 0 ? totalCacheRead / totalInput * 100 : 0;
    const cacheEfficiency = `${cacheHitRate.toFixed(1)}%`;
    const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;
    const sessionTokens = formatTokenCount(totalTokens);
    const sessionCost = formatCost2(totalCost);
    const costColor = getCostColor2(totalCost);
    return {
      sessionCost,
      sessionTokens,
      topAgents: topAgentsStr,
      cacheEfficiency,
      costColor
    };
  } catch (error) {
    return {
      sessionCost: "$0.00",
      sessionTokens: "0",
      topAgents: "none",
      cacheEfficiency: "0%",
      costColor: "green"
    };
  }
}
function formatTokenCount(tokens) {
  if (tokens < 1e3) return `${tokens}`;
  if (tokens < 1e6) return `${(tokens / 1e3).toFixed(1)}k`;
  return `${(tokens / 1e6).toFixed(2)}M`;
}
function getCostColorIndicator(color) {
  switch (color) {
    case "green":
      return "\u{1F7E2}";
    case "yellow":
      return "\u{1F7E1}";
    case "red":
      return "\u{1F534}";
  }
}
function getHealthIndicator(health) {
  switch (health) {
    case "healthy":
      return "\u{1F7E2}";
    case "warning":
      return "\u{1F7E1}";
    case "critical":
      return "\u{1F534}";
  }
}
function renderAnalyticsLineWithConfig(analytics, showCost, showCache) {
  const parts = [];
  if (showCost) {
    const costIndicator = getCostColorIndicator(analytics.costColor);
    parts.push(`${costIndicator} Cost: ${analytics.sessionCost}`);
  }
  if (showCache) {
    parts.push(`Cache: ${analytics.cacheEfficiency}`);
  }
  parts.push(`Top: ${analytics.topAgents}`);
  return parts.join(" | ");
}
async function getSessionInfo() {
  try {
    const { getSessionManager: getSessionManager2 } = await Promise.resolve().then(() => (init_session_manager(), session_manager_exports));
    const manager = getSessionManager2();
    const session = await manager.getCurrentSession();
    if (!session) {
      return "No active session";
    }
    const duration = Date.now() - new Date(session.startTime).getTime();
    const durationMinutes = Math.floor(duration / 6e4);
    const tags = session.tags.join(",");
    return `Session: ${session.id.slice(-8)} | ${durationMinutes}m | Tags: ${tags}`;
  } catch (error) {
    return "Session info unavailable";
  }
}
function getSessionHealthAnalyticsData(sessionHealth) {
  const costIndicator = getHealthIndicator(sessionHealth.health);
  const costPrefix = sessionHealth.isEstimated ? "~" : "";
  const cost = `${costPrefix}$${(sessionHealth.sessionCost ?? 0).toFixed(4)}`;
  const tokens = formatTokenCount(sessionHealth.totalTokens ?? 0);
  const cache = `${(sessionHealth.cacheHitRate ?? 0).toFixed(1)}%`;
  const costHour = sessionHealth.costPerHour ? `$${sessionHealth.costPerHour.toFixed(2)}/h` : "";
  return { costIndicator, cost, tokens, cache, costHour };
}
function renderBudgetWarning(sessionHealth) {
  const cost = sessionHealth.sessionCost ?? 0;
  if (cost > 5) {
    return `\u26A0\uFE0F  BUDGET ALERT: Session cost ${cost.toFixed(2)} exceeds $5.00`;
  } else if (cost > 2) {
    return `\u26A1 Budget notice: Session cost ${cost.toFixed(2)} approaching limit`;
  }
  return "";
}
function renderCacheEfficiency(sessionHealth) {
  const rate = sessionHealth.cacheHitRate ?? 0;
  const barLength = 20;
  const filled = Math.round(rate / 100 * barLength);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(barLength - filled);
  return `Cache: ${bar} ${rate.toFixed(1)}%`;
}

// src/hud/render.ts
function limitOutputLines(lines, maxLines) {
  const limit = Math.max(1, maxLines ?? DEFAULT_HUD_CONFIG.elements.maxOutputLines);
  if (lines.length <= limit) {
    return lines;
  }
  const truncatedCount = lines.length - limit + 1;
  return [...lines.slice(0, limit - 1), `... (+${truncatedCount} lines)`];
}
function renderSessionHealthAnalyticsWithConfig(sessionHealth, enabledElements) {
  const data = getSessionHealthAnalyticsData(sessionHealth);
  const parts = [];
  if (enabledElements.showCost) {
    parts.push(data.costIndicator, data.cost);
  }
  parts.push(data.tokens);
  if (enabledElements.showCache) {
    parts.push(`Cache: ${data.cache}`);
  }
  if (enabledElements.showCost && data.costHour) {
    parts.push(data.costHour);
  }
  return parts.join(" | ");
}
async function render(context, config) {
  const elements = [];
  const detailLines = [];
  const { elements: enabledElements } = config;
  if (config.preset === "analytics") {
    const analytics = await getAnalyticsDisplay();
    const sessionInfo = await getSessionInfo();
    const lines = [sessionInfo, renderAnalyticsLineWithConfig(analytics, enabledElements.showCost, enabledElements.showCache)];
    if (context.sessionHealth) {
      const healthAnalytics = renderSessionHealthAnalyticsWithConfig(context.sessionHealth, enabledElements);
      if (healthAnalytics) lines.push(healthAnalytics);
      if (enabledElements.showCache) {
        const cacheEfficiency = renderCacheEfficiency(context.sessionHealth);
        if (cacheEfficiency) lines.push(cacheEfficiency);
      }
      if (enabledElements.showCost) {
        const budgetWarning = renderBudgetWarning(context.sessionHealth);
        if (budgetWarning) lines.push(budgetWarning);
      }
    }
    if (context.activeAgents.length > 0) {
      const agents = renderAgentsByFormat(context.activeAgents, enabledElements.agentsFormat || "codes");
      if (agents) lines.push(agents);
    }
    if (enabledElements.todos) {
      const todos = renderTodosWithCurrent(context.todos);
      if (todos) lines.push(todos);
    }
    return limitOutputLines(lines, config.elements.maxOutputLines).join("\n");
  }
  if (enabledElements.cwd) {
    const cwdElement = renderCwd(context.cwd, enabledElements.cwdFormat || "relative");
    if (cwdElement) elements.push(cwdElement);
  }
  if (enabledElements.omdLabel) {
    elements.push(bold("[OMD]"));
  }
  if (enabledElements.rateLimits && context.rateLimits) {
    const limits = enabledElements.useBars ? renderRateLimitsWithBar(context.rateLimits) : renderRateLimits(context.rateLimits);
    if (limits) elements.push(limits);
  }
  if (enabledElements.permissionStatus && context.pendingPermission) {
    const permission = renderPermission(context.pendingPermission);
    if (permission) elements.push(permission);
  }
  if (enabledElements.thinking && context.thinkingState) {
    const thinking = renderThinking(context.thinkingState, enabledElements.thinkingFormat || "text");
    if (thinking) elements.push(thinking);
  }
  if (enabledElements.sessionHealth && context.sessionHealth) {
    const session = renderSession(context.sessionHealth);
    if (session) elements.push(session);
    const analytics = renderSessionHealthAnalyticsWithConfig(context.sessionHealth, enabledElements);
    if (analytics) elements.push(analytics);
    if (enabledElements.showCost) {
      const warning = renderBudgetWarning(context.sessionHealth);
      if (warning) detailLines.push(warning);
    }
  }
  if (enabledElements.ralph && context.ralph) {
    const ralph = renderRalph(context.ralph, config.thresholds);
    if (ralph) elements.push(ralph);
  }
  if (enabledElements.autopilot && context.autopilot) {
    const autopilot = renderAutopilot(context.autopilot, config.thresholds);
    if (autopilot) elements.push(autopilot);
  }
  if (enabledElements.team && context.team) {
    const team = renderTeam(context.team);
    if (team) elements.push(team);
  }
  if (enabledElements.prdStory && context.prd) {
    const prd = renderPrd(context.prd);
    if (prd) elements.push(prd);
  }
  if (enabledElements.activeSkills) {
    const skills = renderSkills(
      context.ultrawork,
      context.ralph,
      enabledElements.lastSkill ?? true ? context.lastSkill : null
    );
    if (skills) elements.push(skills);
  }
  if ((enabledElements.lastSkill ?? true) && !enabledElements.activeSkills) {
    const lastSkillElement = renderLastSkill(context.lastSkill);
    if (lastSkillElement) elements.push(lastSkillElement);
  }
  if (enabledElements.contextBar) {
    const ctx = enabledElements.useBars ? renderContextWithBar(context.contextPercent, config.thresholds) : renderContext(context.contextPercent, config.thresholds);
    if (ctx) elements.push(ctx);
  }
  if (enabledElements.agents) {
    const format = enabledElements.agentsFormat || "codes";
    if (format === "multiline") {
      const maxLines = enabledElements.agentsMaxLines || 5;
      const result = renderAgentsMultiLine(context.activeAgents, maxLines);
      if (result.headerPart) elements.push(result.headerPart);
      detailLines.push(...result.detailLines);
    } else {
      const agents = renderAgentsByFormat(context.activeAgents, format);
      if (agents) elements.push(agents);
    }
  }
  if (enabledElements.backgroundTasks) {
    const bg = renderBackground(context.backgroundTasks);
    if (bg) elements.push(bg);
  }
  const headerLine = elements.join(dim(" | "));
  if (enabledElements.todos) {
    const todos = renderTodosWithCurrent(context.todos);
    if (todos) detailLines.push(todos);
  }
  if (config.preset === "full" || config.preset === "dense") {
    try {
      const analytics = await getAnalyticsDisplay();
      detailLines.push(renderAnalyticsLineWithConfig(analytics, enabledElements.showCost, enabledElements.showCache));
      if (enabledElements.showCache && context.sessionHealth?.cacheHitRate !== void 0) {
        const cacheEfficiency = renderCacheEfficiency(context.sessionHealth);
        if (cacheEfficiency) detailLines.push(cacheEfficiency);
      }
    } catch {
    }
  }
  return limitOutputLines([headerLine, ...detailLines], config.elements.maxOutputLines).join("\n");
}

// src/analytics/token-extractor.ts
init_output_estimator();
function extractTokens(stdin, previousSnapshot2, modelName, agentName) {
  const currentUsage = stdin.context_window?.current_usage;
  if (!currentUsage) {
    return createEmptyExtraction(modelName, agentName);
  }
  const inputDelta = previousSnapshot2 ? currentUsage.input_tokens - previousSnapshot2.inputTokens : currentUsage.input_tokens;
  const cacheDelta = previousSnapshot2 ? currentUsage.cache_creation_input_tokens - previousSnapshot2.cacheCreationTokens : currentUsage.cache_creation_input_tokens;
  const cacheReadDelta = previousSnapshot2 ? currentUsage.cache_read_input_tokens - previousSnapshot2.cacheReadTokens : currentUsage.cache_read_input_tokens;
  const outputTokens = estimateOutputTokens(inputDelta, modelName);
  return {
    inputTokens: Math.max(0, inputDelta),
    outputTokens,
    cacheCreationTokens: Math.max(0, cacheDelta),
    cacheReadTokens: Math.max(0, cacheReadDelta),
    modelName,
    agentName,
    isEstimated: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createSnapshot(stdin) {
  const usage = stdin.context_window?.current_usage;
  return {
    inputTokens: usage?.input_tokens ?? 0,
    cacheCreationTokens: usage?.cache_creation_input_tokens ?? 0,
    cacheReadTokens: usage?.cache_read_input_tokens ?? 0,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createEmptyExtraction(modelName, agentName) {
  return {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
    modelName,
    agentName,
    isEstimated: true,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/hud/index.ts
init_output_estimator();
init_token_tracker();
var previousSnapshot = null;
async function recordTokenUsage(stdin, transcriptData) {
  try {
    if (process.env.OMC_DEBUG) {
      console.error("[TokenRecording] stdin.context_window:", JSON.stringify(stdin.context_window));
    }
    const modelName = getModelName(stdin);
    const runningAgents = transcriptData.agents?.filter((a) => a.status === "running") ?? [];
    const agentName = runningAgents.length > 0 ? runningAgents[0].name : void 0;
    if (process.env.OMC_DEBUG) {
      console.error("[TokenRecording] agentName determined:", agentName);
    }
    const extracted = extractTokens(stdin, previousSnapshot, modelName, agentName);
    if (process.env.OMC_DEBUG) {
      console.error("[TokenRecording] extracted tokens:", {
        inputTokens: extracted.inputTokens,
        outputTokens: extracted.outputTokens,
        cacheCreationTokens: extracted.cacheCreationTokens,
        cacheReadTokens: extracted.cacheReadTokens,
        agentName: extracted.agentName,
        modelName: extracted.modelName
      });
    }
    if (extracted.inputTokens > 0 || extracted.cacheCreationTokens > 0) {
      if (process.env.OMC_DEBUG) {
        console.error("[TokenRecording] Recording condition PASSED - recording usage");
      }
      const sessionId = extractSessionId(stdin.transcript_path);
      const tracker = getTokenTracker(sessionId);
      await tracker.recordTokenUsage({
        agentName: extracted.agentName,
        modelName: extracted.modelName,
        inputTokens: extracted.inputTokens,
        outputTokens: extracted.outputTokens,
        cacheCreationTokens: extracted.cacheCreationTokens,
        cacheReadTokens: extracted.cacheReadTokens
      });
      if (process.env.OMC_DEBUG) {
        console.error("[TokenRecording] Successfully recorded usage for agent:", extracted.agentName);
      }
    } else {
      if (process.env.OMC_DEBUG) {
        console.error("[TokenRecording] Recording condition FAILED - no token delta detected");
      }
    }
    previousSnapshot = createSnapshot(stdin);
  } catch (error) {
    if (process.env.OMC_DEBUG) {
      console.error("[Analytics] Token recording failed:", error);
    }
  }
}
async function calculateSessionHealth(sessionStart, contextPercent, stdin) {
  const durationMs = sessionStart ? Date.now() - sessionStart.getTime() : 0;
  const durationMinutes = Math.floor(durationMs / 6e4);
  let health = "healthy";
  if (durationMinutes > 120 || contextPercent > 85) {
    health = "critical";
  } else if (durationMinutes > 60 || contextPercent > 70) {
    health = "warning";
  }
  const usage = stdin.context_window?.current_usage;
  const inputTokens = usage?.input_tokens ?? 0;
  const cacheCreationTokens = usage?.cache_creation_input_tokens ?? 0;
  const cacheReadTokens = usage?.cache_read_input_tokens ?? 0;
  if (process.env.OMC_DEBUG) {
    console.error("[HUD DEBUG] current_usage:", JSON.stringify(usage));
    console.error("[HUD DEBUG] tokens:", { inputTokens, cacheCreationTokens, cacheReadTokens });
  }
  const totalTokens = inputTokens + cacheCreationTokens + cacheReadTokens;
  const totalInputForCache = inputTokens + cacheCreationTokens;
  const cacheHitRate = totalInputForCache > 0 ? cacheReadTokens / (totalInputForCache + cacheReadTokens) * 100 : 0;
  let sessionCost = 0;
  let costPerHour = 0;
  const isEstimated = true;
  try {
    const { calculateCost: calculateCost2 } = await Promise.resolve().then(() => (init_cost_estimator(), cost_estimator_exports));
    const { estimateOutputTokens: estimateOutputTokens2 } = await Promise.resolve().then(() => (init_output_estimator(), output_estimator_exports));
    const modelName = stdin.model?.id ?? stdin.model?.display_name ?? "claude-sonnet-4.5";
    const estimatedOutput = estimateOutputTokens2(inputTokens, modelName);
    const costResult = calculateCost2({
      modelName,
      inputTokens,
      outputTokens: estimatedOutput,
      cacheCreationTokens,
      cacheReadTokens
    });
    sessionCost = costResult.totalCost;
    const hours = durationMs / (1e3 * 60 * 60);
    costPerHour = hours > 0 ? sessionCost / hours : 0;
    if (sessionCost > 5) {
      health = "critical";
    } else if (sessionCost > 2 && health !== "critical") {
      health = "warning";
    }
  } catch (error) {
    if (process.env.OMC_DEBUG) {
      console.error("[HUD] Cost calculation failed:", error);
    }
  }
  let topAgents = [];
  try {
    const sessionId = extractSessionId(stdin.transcript_path);
    if (sessionId) {
      const tracker = getTokenTracker(sessionId);
      const agents = await tracker.getTopAgents(3);
      topAgents = agents.map((a) => ({ agent: a.agent, cost: a.cost }));
    }
  } catch (error) {
    if (process.env.OMC_DEBUG) {
      console.error("[HUD] Top agents fetch failed:", error);
    }
  }
  return {
    durationMinutes,
    messageCount: 0,
    health,
    sessionCost,
    totalTokens,
    cacheHitRate,
    topAgents,
    costPerHour,
    isEstimated
  };
}
async function main() {
  try {
    await initializeHUDState();
    const stdin = await readStdin();
    if (!stdin) {
      console.log("[OMD] run /omd-setup to install properly");
      return;
    }
    const cwd = stdin.cwd || process.cwd();
    const config = readHudConfig();
    const transcriptData = await parseTranscript(stdin.transcript_path, {
      staleTaskThresholdMinutes: config.staleTaskThresholdMinutes
    });
    await recordTokenUsage(stdin, transcriptData);
    const ralph = readRalphStateForHud(cwd);
    const ultrawork = readUltraworkStateForHud(cwd);
    const prd = readPrdStateForHud(cwd);
    const autopilot = readAutopilotStateForHud(cwd);
    const team = readTeamStateForHud(cwd);
    const hudState = readHudState(cwd);
    const backgroundTasks = hudState?.backgroundTasks || [];
    const rateLimits = config.elements.rateLimits !== false ? await getUsage() : null;
    const context = {
      contextPercent: getContextPercent(stdin),
      modelName: getModelName(stdin),
      ralph,
      ultrawork,
      prd,
      autopilot,
      team,
      activeAgents: transcriptData.agents.filter((a) => a.status === "running"),
      todos: transcriptData.todos,
      backgroundTasks: getRunningTasks(hudState),
      cwd,
      lastSkill: transcriptData.lastActivatedSkill || null,
      rateLimits,
      pendingPermission: transcriptData.pendingPermission || null,
      thinkingState: transcriptData.thinkingState || null,
      sessionHealth: await calculateSessionHealth(
        transcriptData.sessionStart,
        getContextPercent(stdin),
        stdin
      )
    };
    if (process.env.OMC_DEBUG) {
      console.error("[HUD DEBUG] stdin.context_window:", JSON.stringify(stdin.context_window));
      console.error("[HUD DEBUG] sessionHealth:", JSON.stringify(context.sessionHealth));
    }
    const output = await render(context, config);
    const formattedOutput = output.replace(/ /g, "\xA0");
    console.log(formattedOutput);
  } catch (error) {
    console.log("[OMD] run /omd-setup to install properly");
  }
}
main();
