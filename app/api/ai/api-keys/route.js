/**
 * GET/POST /api/ai/api-keys
 * Manage API keys for AI providers
 * © 2026 Antoine Riley
 */

import { getUserFromRequest } from '@/lib/auth';
import { getAPIKey, setAPIKey } from '@/lib/ai/database';
import { encrypt, decrypt, maskKey, validateKeyFormat } from '@/lib/ai/encryption';

/**
 * GET - List stored API keys (masked)
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = ['anthropic', 'google', 'openai'];
    const keys = {};

    for (const provider of providers) {
      const encrypted = await getAPIKey(user.id, provider);
      if (encrypted) {
        try {
          const decrypted = decrypt(encrypted);
          keys[provider] = { masked: maskKey(decrypted), configured: true };
        } catch (e) {
          keys[provider] = { masked: '••••••••', configured: true, error: 'Decryption failed' };
        }
      } else {
        keys[provider] = { configured: false };
      }
    }

    return Response.json({ keys });
  } catch (error) {
    console.error('Get API keys error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Update API key for a provider
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, key } = await request.json();

    if (!provider || !key) {
      return Response.json(
        { error: 'Provider and key required' },
        { status: 400 }
      );
    }

    // Validate key format
    if (!validateKeyFormat(key, provider)) {
      return Response.json(
        { error: `Invalid key format for provider ${provider}` },
        { status: 400 }
      );
    }

    // Encrypt and store
    const encrypted = encrypt(key);
    await setAPIKey(user.id, provider, encrypted);

    return Response.json({
      success: true,
      provider,
      masked: maskKey(key),
    });
  } catch (error) {
    console.error('Set API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Remove API key for a provider
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider } = await request.json();
    if (!provider) {
      return Response.json({ error: 'Provider required' }, { status: 400 });
    }

    // Delete by storing null/empty (or implement actual delete in database)
    await setAPIKey(user.id, provider, null);

    return Response.json({
      success: true,
      provider,
      message: `API key for ${provider} removed`,
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
