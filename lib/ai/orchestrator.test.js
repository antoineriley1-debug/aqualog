/**
 * AI Orchestrator Integration Tests
 * © 2026 Antoine Riley
 */

import { AIOrchestrator } from './orchestrator';
import { OpenClawProvider, ClaudeProvider, GeminiProvider, OllamaProvider } from './providers';

describe('AIOrchestrator', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new AIOrchestrator({
      primaryModel: 'claude',
      autoFallback: true,
      fallbackOrder: ['claude', 'gemini', 'ollama'],
    });
  });

  describe('Provider Initialization', () => {
    test('should initialize all available providers', () => {
      expect(orchestrator.providers).toBeDefined();
    });

    test('should set primary model correctly', () => {
      expect(orchestrator.primaryModel).toBe('claude');
    });

    test('should handle missing provider gracefully', () => {
      const orch = new AIOrchestrator({
        primaryModel: 'invalid-model',
      });
      expect(orch.primaryModel).toBe('invalid-model');
    });
  });

  describe('Fallback Chain', () => {
    test('should build correct fallback chain', () => {
      const chain = orchestrator.getFallbackChain();
      expect(chain[0]).toBe('claude'); // Primary first
      expect(chain).toContain('claude');
      expect(chain).toContain('gemini');
      expect(chain).toContain('ollama');
    });

    test('should prioritize available providers', () => {
      const orchestrator2 = new AIOrchestrator({
        primaryModel: 'claude',
        fallbackOrder: ['gemini', 'ollama'],
      });
      const chain = orchestrator2.getFallbackChain();
      // Only includes available providers
      expect(chain.length).toBeGreaterThan(0);
    });

    test('should respect custom fallback order', () => {
      const orchestrator2 = new AIOrchestrator({
        primaryModel: 'claude',
        fallbackOrder: ['ollama', 'gemini'],
      });
      const chain = orchestrator2.getFallbackChain();
      expect(chain[0]).toBe('claude'); // Primary always first
    });
  });

  describe('Configuration', () => {
    test('should get current configuration', () => {
      const config = orchestrator.getConfig();
      expect(config.primaryModel).toBe('claude');
      expect(config.autoFallback).toBe(true);
      expect(config.currentModel).toBeDefined();
    });

    test('should set primary model', () => {
      if (orchestrator.providers.gemini) {
        orchestrator.setPrimaryModel('gemini');
        expect(orchestrator.primaryModel).toBe('gemini');
      }
    });

    test('should throw on invalid model', () => {
      expect(() => orchestrator.setPrimaryModel('invalid')).toThrow();
    });

    test('should toggle auto-fallback', () => {
      orchestrator.setAutoFallback(false);
      expect(orchestrator.autoFallback).toBe(false);
      orchestrator.setAutoFallback(true);
      expect(orchestrator.autoFallback).toBe(true);
    });

    test('should set fallback order', () => {
      orchestrator.setFallbackOrder(['gemini', 'ollama', 'claude']);
      expect(orchestrator.fallbackOrder).toEqual(['gemini', 'ollama', 'claude']);
    });
  });

  describe('Usage Tracking', () => {
    test('should initialize usage stats', () => {
      const stats = orchestrator.getUsageStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    test('should track usage per model', () => {
      const mockResult = {
        text: 'test',
        tokens: { input: 10, output: 20 },
        cost: 0.01,
      };
      
      orchestrator._trackUsage('claude', 'summarize', mockResult, 100);
      
      const stats = orchestrator.getUsageStats('claude');
      expect(stats.calls).toBe(1);
      expect(stats.totalTokens).toBe(30);
      expect(stats.totalCost).toBe(0.01);
    });

    test('should track usage by task type', () => {
      const mockResult = {
        text: 'test',
        tokens: { input: 10, output: 20 },
        cost: 0.01,
      };
      
      orchestrator._trackUsage('claude', 'summarize', mockResult, 100);
      
      const stats = orchestrator.getUsageStats('claude');
      expect(stats.tasks.summarize).toBeDefined();
      expect(stats.tasks.summarize.calls).toBe(1);
    });

    test('should calculate total cost', () => {
      orchestrator._trackUsage('claude', 'summarize', {
        tokens: { input: 100, output: 50 },
        cost: 0.01,
      });
      
      orchestrator._trackUsage('gemini', 'search', {
        tokens: { input: 50, output: 100 },
        cost: 0.005,
      });
      
      const total = orchestrator.getTotalCost();
      expect(total).toBeCloseTo(0.015, 5);
    });
  });

  describe('Task Methods', () => {
    test('should expose summarize task', () => {
      expect(typeof orchestrator.summarize).toBe('function');
    });

    test('should expose investigate task', () => {
      expect(typeof orchestrator.investigate).toBe('function');
    });

    test('should expose analyzeContract task', () => {
      expect(typeof orchestrator.analyzeContract).toBe('function');
    });

    test('should expose analyzeDocument task', () => {
      expect(typeof orchestrator.analyzeDocument).toBe('function');
    });

    test('should expose generateReport task', () => {
      expect(typeof orchestrator.generateReport).toBe('function');
    });

    test('should expose search task', () => {
      expect(typeof orchestrator.search).toBe('function');
    });
  });

  describe('Provider Tests', () => {
    test('OpenClawProvider should be constructable', () => {
      expect(() => new OpenClawProvider()).not.toThrow();
    });

    test('ClaudeProvider should require API key', () => {
      // Save and delete key
      const saved = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      expect(() => new ClaudeProvider()).toThrow();
      
      // Restore
      if (saved) process.env.ANTHROPIC_API_KEY = saved;
    });

    test('GeminiProvider should handle missing API key', () => {
      const saved = process.env.GOOGLE_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      
      expect(() => new GeminiProvider()).toThrow();
      
      if (saved) process.env.GOOGLE_API_KEY = saved;
    });

    test('OllamaProvider should be constructable', () => {
      expect(() => new OllamaProvider()).not.toThrow();
    });
  });

  describe('Singleton Pattern', () => {
    test('should create singleton instance', () => {
      const { getOrchestrator, resetOrchestrator } = require('./orchestrator');
      
      resetOrchestrator();
      
      const orch1 = getOrchestrator({ primaryModel: 'claude' });
      const orch2 = getOrchestrator({ primaryModel: 'gemini' });
      
      expect(orch1).toBe(orch2); // Same instance
      expect(orch1.primaryModel).toBe('claude'); // First config wins
    });
  });
});

describe('Provider Base Class', () => {
  test('should not instantiate abstract base', () => {
    const { AIProvider } = require('./providers');
    const provider = new AIProvider('Test', 'test');
    expect(() => provider.summarize('test')).toThrow();
  });
});
