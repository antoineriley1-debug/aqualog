/**
 * FacilityH2O — Chemistry Advisor API
 * AI-powered water chemistry advisory using Anthropic Claude
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { getUserFromRequest } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const HOSPITALS = {
  'Montgomery': 'Low pH steam issue, absent amine residuals',
  'Union Memorial': 'Iron contamination in chilled loop',
  'Harbor': 'Standard operation',
  'Southern Maryland': 'Boiler shutdown blocked, blower failure',
  'Washington Hospital Center': 'High cycles optimization needed',
};

// Simple in-memory rate limiter: userId -> { count, resetTime }
const rateLimits = new Map();
const MAX_REQUESTS_PER_HOUR = 20;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimits.get(userId);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(userId, { count: 1, resetTime: now + 3600000 });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request) {
  try {
    // Auth check
    const user = await getUserFromRequest(request);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      return Response.json(
        { error: 'Rate limit exceeded. Maximum 20 requests per hour. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { hospital, question, history } = body;

    if (!hospital || !question) {
      return Response.json({ error: 'Hospital and question are required.' }, { status: 400 });
    }

    const knownIssue = HOSPITALS[hospital];
    if (!knownIssue) {
      return Response.json({ error: 'Invalid hospital selected.' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json({ error: 'AI service not configured. Contact your administrator.' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a water chemistry expert advisor for MedStar Health hospitals. You provide clear, actionable advice specific to hospital water treatment systems including boiler water, chilled water, steam systems, and cooling towers.

Hospital: ${hospital}
Known issue: ${knownIssue}
Water treatment vendor: Nalco

Guidelines:
- Give specific, actionable advice for this hospital's systems
- Reference industry standards (ASME, ASHRAE) when relevant
- If the question involves safety-critical decisions, always recommend consulting the Nalco rep
- Be concise but thorough
- Use plain language that facility operators can understand`;

    // Build messages from history
    const messages = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        });
      }
    }
    messages.push({ role: 'user', content: question });

    // Stream the response
    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    // Create a ReadableStream to pipe chunks back
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.text) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(encoder.encode('\n\n[Error: Stream interrupted. Please try again.]'));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    console.error('Advisor API error:', err);
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
