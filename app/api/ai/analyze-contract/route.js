/**
 * POST /api/ai/analyze-contract
 * Contract analysis using orchestrated AI providers
 * © 2026 Antoine Riley
 */

import { getOrchestrator } from '@/lib/ai/orchestrator';
import { getUserFromRequest } from '@/lib/auth';
import { logUsage, getAIConfig } from '@/lib/ai/database';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contract } = await request.json();
    if (!contract) {
      return Response.json({ error: 'Contract content required' }, { status: 400 });
    }

    // Get user's AI configuration
    const config = await getAIConfig(user.id);
    const orchestrator = getOrchestrator({
      primaryModel: config?.primary_model || 'claude',
      autoFallback: config?.auto_fallback !== false,
      fallbackOrder: config?.fallback_order || ['claude', 'gemini', 'ollama'],
      claude: { temperature: config?.temperature || 0.7, maxTokens: config?.max_tokens || 4000 },
    });

    const startTime = Date.now();
    const result = await orchestrator.analyzeContract(contract);
    const duration = Date.now() - startTime;

    // Log usage
    if (result.model) {
      await logUsage(
        user.id,
        result.model,
        'analyze_contract',
        result.tokens,
        result.cost,
        duration,
        result.error ? 'failed' : 'success',
        result.error
      );
    }

    if (result.error) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({
      analysis: result.result,
      model: result.model,
      tokens: result.tokens,
      cost: result.cost,
      duration,
    });
  } catch (error) {
    console.error('Analyze contract API error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
