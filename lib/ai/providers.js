/**
 * AI Provider Implementations
 * Base interface and concrete implementations for OpenClaw, Claude, Gemini, Ollama
 * © 2026 Antoine Riley
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Base AIProvider interface
 * All providers implement these methods
 */
export class AIProvider {
  constructor(name, type, config = {}) {
    this.name = name;
    this.type = type;
    this.config = config;
  }

  async summarize(email) {
    throw new Error('Not implemented');
  }

  async investigate(email, context = '') {
    throw new Error('Not implemented');
  }

  async analyzeContract(contract) {
    throw new Error('Not implemented');
  }

  async analyzeDocument(text) {
    throw new Error('Not implemented');
  }

  async generateReport(data) {
    throw new Error('Not implemented');
  }

  async search(query, context = '') {
    throw new Error('Not implemented');
  }

  async test() {
    throw new Error('Not implemented');
  }
}

/**
 * OpenClaw Provider
 * Calls the local OpenClaw agent API
 */
export class OpenClawProvider extends AIProvider {
  constructor(config = {}) {
    super('OpenClaw Agent', 'openclaw', config);
    this.apiUrl = config.apiUrl || process.env.OPENCLAW_API_URL || 'http://localhost:3000';
    this.timeout = config.timeout || 30000;
  }

  async _call(endpoint, method, body) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenClaw API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`OpenClaw connection failed: ${error.message}`);
    }
  }

  async summarize(email) {
    const result = await this._call('/api/ai/summarize', 'POST', { email });
    return result.summary || '';
  }

  async investigate(email, context = '') {
    const result = await this._call('/api/ai/investigate', 'POST', { email, context });
    return result;
  }

  async analyzeContract(contract) {
    const result = await this._call('/api/ai/analyze-contract', 'POST', { contract });
    return result;
  }

  async analyzeDocument(text) {
    const result = await this._call('/api/ai/analyze-document', 'POST', { text });
    return result.analysis || '';
  }

  async generateReport(data) {
    const result = await this._call('/api/ai/generate-report', 'POST', { data });
    return result;
  }

  async search(query, context = '') {
    const result = await this._call('/api/ai/search', 'POST', { query, context });
    return result;
  }

  async test() {
    try {
      await this._call('/api/ai/test', 'POST', { test: true });
      return { success: true, message: 'OpenClaw connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Claude (Anthropic) Provider
 * Uses @anthropic-ai/sdk with model selection support
 * Pricing: Sonnet $0.003/$0.015 per 1K tokens, Opus $0.015/$0.075, Haiku $0.00080/$0.0024
 */
export class ClaudeProvider extends AIProvider {
  constructor(config = {}) {
    super('Claude (Anthropic)', 'claude', config);
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
    this.model = config.model || 'claude-sonnet-4-6';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 2000;

    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    this.client = new Anthropic({ apiKey: this.apiKey });
  }

  async _call(systemPrompt, userMessage) {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
      
      return {
        text,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
        cost: this._calculateCost(response.usage.input_tokens, response.usage.output_tokens),
      };
    } catch (error) {
      if (error.status === 429) {
        throw new Error('Claude API rate limited');
      }
      throw error;
    }
  }

  _calculateCost(inputTokens, outputTokens) {
    const rates = {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-opus-20250219': { input: 0.015, output: 0.075 },
      'claude-3-haiku-20250307': { input: 0.00080, output: 0.0024 },
    };
    const rate = rates[this.model] || rates['claude-3-5-sonnet-20241022'];
    return (inputTokens * rate.input + outputTokens * rate.output) / 1000;
  }

  async summarize(email) {
    const result = await this._call(
      'You are an expert email analyst. Summarize the email concisely in 2-3 sentences.',
      email
    );
    return result;
  }

  async investigate(email, context = '') {
    const result = await this._call(
      `You are a thorough investigator. Analyze this email and provide detailed insights.${context ? ' Context: ' + context : ''}`,
      email
    );
    return result;
  }

  async analyzeContract(contract) {
    const result = await this._call(
      'You are a legal expert. Analyze this contract and identify key terms, risks, and obligations.',
      contract
    );
    return result;
  }

  async analyzeDocument(text) {
    const result = await this._call(
      'You are a document analyst. Analyze this text and extract key information.',
      text
    );
    return result;
  }

  async generateReport(data) {
    const result = await this._call(
      'You are a report writer. Generate a professional report from the provided data.',
      JSON.stringify(data, null, 2)
    );
    return result;
  }

  async search(query, context = '') {
    const result = await this._call(
      `You are a search expert. Answer this query using provided context.${context ? ' Context: ' + context : ''}`,
      query
    );
    return result;
  }

  async test() {
    try {
      await this._call('Test prompt', 'Say "Claude is working" in one sentence.');
      return { success: true, message: 'Claude API connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Gemini (Google) Provider
 * Uses @google/generative-ai SDK
 * Pricing varies by model
 */
export class GeminiProvider extends AIProvider {
  constructor(config = {}) {
    super('Gemini (Google)', 'gemini', config);
    this.apiKey = config.apiKey || process.env.GOOGLE_API_KEY;
    this.model = config.model || 'gemini-2.0-pro';
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens || 2000;

    if (!this.apiKey) {
      throw new Error('GOOGLE_API_KEY not configured');
    }

    // Lazy load Google API to avoid import errors if not installed
    this.clientPromise = this._initClient();
  }

  async _initClient() {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      return new GoogleGenerativeAI(this.apiKey);
    } catch (error) {
      throw new Error('Google Generative AI SDK not installed. Install with: npm install @google/generative-ai');
    }
  }

  async _call(systemPrompt, userMessage) {
    try {
      const client = await this.clientPromise;
      const model = client.getGenerativeModel({ model: this.model });
      
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userMessage}` }] }],
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
        },
      });

      const text = response.response.text();
      
      return {
        text,
        tokens: {
          input: response.usageMetadata?.promptTokenCount || 0,
          output: response.usageMetadata?.candidatesTokenCount || 0,
        },
        cost: this._calculateCost(response.usageMetadata?.promptTokenCount || 0, response.usageMetadata?.candidatesTokenCount || 0),
      };
    } catch (error) {
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        throw new Error('Gemini API rate limited');
      }
      throw error;
    }
  }

  _calculateCost(inputTokens, outputTokens) {
    // Gemini pricing varies; using approximate rates
    return (inputTokens * 0.0005 + outputTokens * 0.0015) / 1000;
  }

  async summarize(email) {
    const result = await this._call(
      'You are an expert email analyst. Summarize the email concisely in 2-3 sentences.',
      email
    );
    return result;
  }

  async investigate(email, context = '') {
    const result = await this._call(
      `You are a thorough investigator. Analyze this email and provide detailed insights.${context ? ' Context: ' + context : ''}`,
      email
    );
    return result;
  }

  async analyzeContract(contract) {
    const result = await this._call(
      'You are a legal expert. Analyze this contract and identify key terms, risks, and obligations.',
      contract
    );
    return result;
  }

  async analyzeDocument(text) {
    const result = await this._call(
      'You are a document analyst. Analyze this text and extract key information.',
      text
    );
    return result;
  }

  async generateReport(data) {
    const result = await this._call(
      'You are a report writer. Generate a professional report from the provided data.',
      JSON.stringify(data, null, 2)
    );
    return result;
  }

  async search(query, context = '') {
    const result = await this._call(
      `You are a search expert. Answer this query using provided context.${context ? ' Context: ' + context : ''}`,
      query
    );
    return result;
  }

  async test() {
    try {
      await this._call('Test prompt', 'Say "Gemini is working" in one sentence.');
      return { success: true, message: 'Gemini API connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

/**
 * Ollama (Local LLM) Provider
 * Connects to local Ollama server for offline capability
 * No API key needed, but requires local server running
 */
export class OllamaProvider extends AIProvider {
  constructor(config = {}) {
    super('Ollama (Local)', 'ollama', config);
    this.apiUrl = config.apiUrl || process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = config.model || 'llama2';
    this.temperature = config.temperature ?? 0.7;
    this.timeout = config.timeout || 120000; // Ollama can be slower
  }

  async _call(prompt) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.apiUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          temperature: this.temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        text: data.response || '',
        tokens: {
          input: data.prompt_eval_count || 0,
          output: data.eval_count || 0,
        },
        cost: 0, // Local, no cost
      };
    } catch (error) {
      throw new Error(`Ollama connection failed: ${error.message}`);
    }
  }

  async summarize(email) {
    const result = await this._call(
      `Summarize this email in 2-3 sentences:\n\n${email}`
    );
    return result;
  }

  async investigate(email, context = '') {
    const result = await this._call(
      `Analyze this email and provide detailed insights:\n\n${email}${context ? '\n\nContext: ' + context : ''}`
    );
    return result;
  }

  async analyzeContract(contract) {
    const result = await this._call(
      `Analyze this contract and identify key terms, risks, and obligations:\n\n${contract}`
    );
    return result;
  }

  async analyzeDocument(text) {
    const result = await this._call(
      `Analyze this text and extract key information:\n\n${text}`
    );
    return result;
  }

  async generateReport(data) {
    const result = await this._call(
      `Generate a professional report from this data:\n\n${JSON.stringify(data, null, 2)}`
    );
    return result;
  }

  async search(query, context = '') {
    const result = await this._call(
      `Answer this query:${context ? ' Using context: ' + context : ''}\n\n${query}`
    );
    return result;
  }

  async test() {
    try {
      await this._call('Say "Ollama is working" in one sentence.');
      return { success: true, message: 'Ollama connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.apiUrl}/api/tags`);
      if (!response.ok) throw new Error('Failed to list models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error.message}`);
    }
  }
}
