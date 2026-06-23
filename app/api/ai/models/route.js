export const dynamic = 'force-dynamic';
/**
 * GET /api/ai/models
 * List available AI models and their status
 * Â© 2026 Antoine Riley
 */

import { getUserFromRequest } from '@/lib/auth';
import { getAIConfig } from '@/lib/ai/database';
import { OpenClawProvider, ClaudeProvider, GeminiProvider, OllamaProvider } from '@/lib/ai/providers';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getAIConfig(user.id);
    const models = [];

    // Check OpenClaw
    try {
      const oc = new OpenClawProvider();
      models.push({
        name: 'openclaw',
        label: 'OpenClaw Agent',
        available: true,
        description: 'Local AI agent',
      });
    } catch {
      models.push({
        name: 'openclaw',
        label: 'OpenClaw Agent',
        available: false,
        description: 'Local AI agent',
        error: 'Not configured',
      });
    }

    // Check Claude
    try {
      const claude = new ClaudeProvider();
      models.push({
        name: 'claude',
        label: 'Claude (Anthropic)',
        available: true,
        description: 'Claude 3.5 Sonnet',
        variants: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20250219', 'claude-3-haiku-20250307'],
      });
    } catch {
      models.push({
        name: 'claude',
        label: 'Claude (Anthropic)',
        available: false,
        description: 'Claude 3.5 Sonnet',
        error: 'API key not configured',
      });
    }

    // Check Gemini
    try {
      const gemini = new GeminiProvider();
      models.push({
        name: 'gemini',
        label: 'Gemini (Google)',
        available: true,
        description: 'Gemini 2.0 Pro',
        variants: ['gemini-2.0-pro', 'gemini-2.0-flash'],
      });
    } catch {
      models.push({
        name: 'gemini',
        label: 'Gemini (Google)',
        available: false,
        description: 'Gemini 2.0 Pro',
        error: 'API key not configured',
      });
    }

    // Check Ollama
    try {
      const ollama = new OllamaProvider();
      const ollamaModels = await ollama.listModels();
      models.push({
        name: 'ollama',
        label: 'Ollama (Local)',
        available: true,
        description: 'Local LLM',
        variants: ollamaModels.map((m) => m.name || m),
      });
    } catch {
      models.push({
        name: 'ollama',
        label: 'Ollama (Local)',
        available: false,
        description: 'Local LLM',
        error: 'Server not reachable',
      });
    }

    return Response.json({
      models,
      currentPrimary: config?.primary_model || 'claude',
      autoFallback: config?.auto_fallback !== false,
      fallbackOrder: config?.fallback_order || ['claude', 'gemini', 'ollama'],
    });
  } catch (error) {
    console.error('Models API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

