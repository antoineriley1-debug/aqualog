/**
 * GET/POST /api/ai/config
 * Get and update user's AI configuration
 * © 2026 Antoine Riley
 */

import { getUserFromRequest } from '@/lib/auth';
import { getAIConfig, setAIConfig } from '@/lib/ai/database';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getAIConfig(user.id);
    return Response.json({
      primaryModel: config?.primary_model || 'claude',
      autoFallback: config?.auto_fallback !== false,
      fallbackOrder: config?.fallback_order || ['claude', 'gemini', 'ollama'],
      temperature: config?.temperature || 0.7,
      maxTokens: config?.max_tokens || 2000,
    });
  } catch (error) {
    console.error('Get config API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { primaryModel, autoFallback, fallbackOrder, temperature, maxTokens } = await request.json();

    const config = await setAIConfig(user.id, {
      primaryModel: primaryModel || 'claude',
      autoFallback: autoFallback !== false,
      fallbackOrder: fallbackOrder || ['claude', 'gemini', 'ollama'],
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
    });

    return Response.json({
      success: true,
      config: {
        primaryModel: config.primary_model,
        autoFallback: config.auto_fallback,
        fallbackOrder: config.fallback_order,
        temperature: config.temperature,
        maxTokens: config.max_tokens,
      },
    });
  } catch (error) {
    console.error('Update config API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
