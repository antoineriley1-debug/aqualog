/**
 * AI Orchestrator
 * Manages multiple AI providers with automatic fallback logic
 * © 2026 Antoine Riley
 */

import { OpenClawProvider, ClaudeProvider, GeminiProvider, OllamaProvider } from './providers.js';

/**
 * AIOrchestrator - Main coordinator for AI operations
 * Handles provider selection, fallback logic, usage tracking
 */
export class AIOrchestrator {
  constructor(config = {}) {
    this.config = config;
    this.primaryModel = config.primaryModel || 'claude';
    this.autoFallback = config.autoFallback !== false;
    this.fallbackOrder = config.fallbackOrder || ['claude', 'gemini', 'ollama'];
    this.providers = {};
    this.currentModel = this.primaryModel;
    this.lastUsedModel = null;
    this.usageStats = {};

    // Initialize providers
    this._initProviders(config);
  }

  _initProviders(config) {
    const providerConfigs = {
      openclaw: { ...config.openclaw },
      claude: { ...config.claude },
      gemini: { ...config.gemini },
      ollama: { ...config.ollama },
    };

    try {
      this.providers.openclaw = new OpenClawProvider(providerConfigs.openclaw);
    } catch (e) {
      console.debug('OpenClaw provider not available:', e.message);
    }

    try {
      this.providers.claude = new ClaudeProvider(providerConfigs.claude);
    } catch (e) {
      console.debug('Claude provider not available:', e.message);
    }

    try {
      this.providers.gemini = new GeminiProvider(providerConfigs.gemini);
    } catch (e) {
      console.debug('Gemini provider not available:', e.message);
    }

    try {
      this.providers.ollama = new OllamaProvider(providerConfigs.ollama);
    } catch (e) {
      console.debug('Ollama provider not available:', e.message);
    }
  }

  /**
   * Get the current primary provider
   */
  getPrimaryProvider() {
    return this.providers[this.primaryModel];
  }

  /**
   * Build fallback chain based on configuration
   */
  getFallbackChain() {
    const chain = [this.primaryModel];
    const excludedPrimary = this.fallbackOrder.filter((m) => m !== this.primaryModel);
    return chain.concat(excludedPrimary).filter((m) => this.providers[m]);
  }

  /**
   * Execute task with automatic fallback
   * @param {string} taskName - Name of the task (summarize, investigate, etc.)
   * @param {array} args - Arguments to pass to the provider method
   * @returns {object} { result, model, tokens, cost, errors }
   */
  async executeWithFallback(taskName, ...args) {
    if (!this.autoFallback) {
      return this._executeSingleProvider(this.primaryModel, taskName, args);
    }

    const chain = this.getFallbackChain();
    const errors = [];

    for (const modelName of chain) {
      try {
        return await this._executeSingleProvider(modelName, taskName, args);
      } catch (error) {
        errors.push({ model: modelName, error: error.message });
        console.warn(`Model ${modelName} failed for ${taskName}:`, error.message);
        // Continue to next fallback
      }
    }

    // All providers failed
    return {
      result: null,
      model: null,
      tokens: { input: 0, output: 0 },
      cost: 0,
      error: `All AI providers failed. Errors: ${errors.map((e) => `${e.model}: ${e.error}`).join('; ')}`,
      errors,
    };
  }

  async _executeSingleProvider(modelName, taskName, args) {
    const provider = this.providers[modelName];
    if (!provider) {
      throw new Error(`Provider ${modelName} not available`);
    }

    if (typeof provider[taskName] !== 'function') {
      throw new Error(`Provider ${modelName} does not support task ${taskName}`);
    }

    const startTime = Date.now();
    const result = await provider[taskName](...args);
    const duration = Date.now() - startTime;

    // Track usage
    this._trackUsage(modelName, taskName, result, duration);

    this.currentModel = modelName;
    this.lastUsedModel = modelName;

    return {
      result: result.text || result,
      model: modelName,
      tokens: result.tokens || { input: 0, output: 0 },
      cost: result.cost || 0,
      duration,
    };
  }

  _trackUsage(modelName, taskName, result, duration) {
    if (!this.usageStats[modelName]) {
      this.usageStats[modelName] = {
        calls: 0,
        totalTokens: 0,
        totalCost: 0,
        tasks: {},
      };
    }

    const stats = this.usageStats[modelName];
    stats.calls++;
    stats.totalTokens += (result.tokens?.input || 0) + (result.tokens?.output || 0);
    stats.totalCost += result.cost || 0;

    if (!stats.tasks[taskName]) {
      stats.tasks[taskName] = { calls: 0, tokens: 0, cost: 0 };
    }
    stats.tasks[taskName].calls++;
    stats.tasks[taskName].tokens += (result.tokens?.input || 0) + (result.tokens?.output || 0);
    stats.tasks[taskName].cost += result.cost || 0;
  }

  /**
   * Task methods - convenience wrappers
   */
  async summarize(email) {
    return this.executeWithFallback('summarize', email);
  }

  async investigate(email, context = '') {
    return this.executeWithFallback('investigate', email, context);
  }

  async analyzeContract(contract) {
    return this.executeWithFallback('analyzeContract', contract);
  }

  async analyzeDocument(text) {
    return this.executeWithFallback('analyzeDocument', text);
  }

  async generateReport(data) {
    return this.executeWithFallback('generateReport', data);
  }

  async search(query, context = '') {
    return this.executeWithFallback('search', query, context);
  }

  /**
   * Get usage statistics
   */
  getUsageStats(modelName = null) {
    if (modelName) {
      return this.usageStats[modelName] || null;
    }
    return this.usageStats;
  }

  /**
   * Get total cost across all models
   */
  getTotalCost() {
    return Object.values(this.usageStats).reduce((sum, stats) => sum + stats.totalCost, 0);
  }

  /**
   * Test all available providers
   */
  async testAllProviders() {
    const results = {};
    for (const [name, provider] of Object.entries(this.providers)) {
      try {
        results[name] = await provider.test();
      } catch (error) {
        results[name] = { success: false, error: error.message };
      }
    }
    return results;
  }

  /**
   * Set primary model
   */
  setPrimaryModel(modelName) {
    if (!this.providers[modelName]) {
      throw new Error(`Provider ${modelName} not available`);
    }
    this.primaryModel = modelName;
    this.currentModel = modelName;
  }

  /**
   * Set auto-fallback enabled/disabled
   */
  setAutoFallback(enabled) {
    this.autoFallback = enabled;
  }

  /**
   * Set fallback order
   */
  setFallbackOrder(order) {
    this.fallbackOrder = order;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      primaryModel: this.primaryModel,
      autoFallback: this.autoFallback,
      fallbackOrder: this.fallbackOrder,
      currentModel: this.currentModel,
      availableProviders: Object.keys(this.providers),
      usageStats: this.usageStats,
    };
  }
}

// Export singleton instance creator
let orchestratorInstance = null;

export function getOrchestrator(config = {}) {
  if (!orchestratorInstance) {
    orchestratorInstance = new AIOrchestrator(config);
  }
  return orchestratorInstance;
}

export function resetOrchestrator() {
  orchestratorInstance = null;
}
