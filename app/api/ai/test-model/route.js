/**
 * POST /api/ai/test-model
 * Test if a specific AI model is working
 * © 2026 Antoine Riley
 */

import { getUserFromRequest } from '@/lib/auth';
import { OpenClawProvider, ClaudeProvider, GeminiProvider, OllamaProvider } from '@/lib/ai/providers';

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model } = await request.json();
    if (!model) {
      return Response.json({ error: 'Model name required' }, { status: 400 });
    }

    let provider;
    switch (model) {
      case 'openclaw':
        provider = new OpenClawProvider();
        break;
      case 'claude':
        provider = new ClaudeProvider();
        break;
      case 'gemini':
        provider = new GeminiProvider();
        break;
      case 'ollama':
        provider = new OllamaProvider();
        break;
      default:
        return Response.json({ error: 'Unknown model' }, { status: 400 });
    }

    const result = await provider.test();
    return Response.json(result);
  } catch (error) {
    console.error('Test model API error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
