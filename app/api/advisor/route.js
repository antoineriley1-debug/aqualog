/**
 * FacilityH2O — Chemistry Advisor API
 * AI-powered water chemistry advisory using Anthropic Claude
 * Enhanced with real data trend analysis
 * © 2026 Antoine Riley / FacilityH2O. All rights reserved.
 */

import { getUserFromRequest } from '@/lib/auth';
import { getAllEntries } from '@/lib/store';
import { CHEMISTRY_RANGES } from '@/lib/chemistryRanges';
import { HOSPITALS } from '@/lib/hospitals';
import Anthropic from '@anthropic-ai/sdk';

// Map hospital ids to known issues
const HOSPITAL_ISSUES = {
  whc: 'High cycles optimization needed',
  mont: 'Low pH steam issue, absent amine residuals',
  union: 'Iron contamination in chilled loop',
  harbor: 'Standard operation',
  somd: 'Boiler shutdown blocked, blower failure',
  geo: 'Steam trap maintenance, condensate return quality',
  frank: 'Cooling tower biological control, legionella prevention',
  gs: 'Aging boiler system, scale buildup concerns',
  stm: 'Chilled water loop corrosion, low inhibitor levels',
  nrh: 'Compact system, limited redundancy',
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

/**
 * Build a data summary for the system prompt from recent entries.
 */
function buildDataSummary(hospitalId) {
  try {
    const allEntries = getAllEntries();
    const hospitalEntries = allEntries
      .filter((e) => e.hospitalId === hospitalId)
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 30);

    if (hospitalEntries.length === 0) {
      return '\nNo recent chemistry data available for this facility. Provide general guidance based on industry standards.';
    }

    const boilerEntries = hospitalEntries.filter((e) => e.system === 'boiler');
    const chilledEntries = hospitalEntries.filter((e) => e.system === 'chilled');

    let summary = `\n\nRecent Data for this facility (last ${hospitalEntries.length} entries):`;

    // Boiler summary
    if (boilerEntries.length > 0) {
      summary += `\n\n--- Boiler Water (${boilerEntries.length} entries) ---`;
      const boilerParams = ['ph', 'phosphate', 'sulfite', 'conductivity', 'alkalinity', 'hardness', 'tds', 'amine'];
      for (const param of boilerParams) {
        const values = boilerEntries
          .map((e) => parseFloat(e.values?.[param]))
          .filter((v) => !isNaN(v));
        if (values.length > 0) {
          const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
          const latest = values[0];
          const range = CHEMISTRY_RANGES.boiler[param];
          const rangeStr = range
            ? range.targetZero
              ? `target: 0 ${range.unit}`
              : `range: ${range.min}-${range.max} ${range.unit}`
            : '';
          const inRange = range
            ? range.targetZero
              ? latest === 0
              : latest >= range.min && latest <= range.max
            : true;
          summary += `\n  ${range?.label || param}: avg=${avg}, latest=${latest} (${rangeStr})${!inRange ? ' ⚠️ OUT OF RANGE' : ''}`;
        }
      }

      // Trend for boiler pH (last 7)
      const boilerPhValues = boilerEntries
        .slice(0, 7)
        .map((e) => parseFloat(e.values?.ph))
        .filter((v) => !isNaN(v));
      if (boilerPhValues.length >= 3) {
        const trend = getTrend(boilerPhValues);
        summary += `\n  pH trend (last ${boilerPhValues.length} entries): ${trend}`;
      }
    } else {
      summary += '\n\n--- No boiler entries found ---';
    }

    // Chilled summary
    if (chilledEntries.length > 0) {
      summary += `\n\n--- Chilled Water (${chilledEntries.length} entries) ---`;
      const chilledParams = ['ph', 'conductivity', 'inhibitor', 'hardness', 'iron', 'tds', 'molybdate', 'bacteria'];
      for (const param of chilledParams) {
        const values = chilledEntries
          .map((e) => parseFloat(e.values?.[param]))
          .filter((v) => !isNaN(v));
        if (values.length > 0) {
          const avg = (values.reduce((s, v) => s + v, 0) / values.length).toFixed(1);
          const latest = values[0];
          const range = CHEMISTRY_RANGES.chilled[param];
          const rangeStr = range
            ? range.targetZero
              ? `target: 0 ${range.unit}`
              : `range: ${range.min}-${range.max} ${range.unit}`
            : '';
          const inRange = range
            ? range.targetZero
              ? latest === 0
              : latest >= range.min && latest <= range.max
            : true;
          summary += `\n  ${range?.label || param}: avg=${avg}, latest=${latest} (${rangeStr})${!inRange ? ' ⚠️ OUT OF RANGE' : ''}`;
        }
      }

      // Trend for chilled pH (last 7)
      const chilledPhValues = chilledEntries
        .slice(0, 7)
        .map((e) => parseFloat(e.values?.ph))
        .filter((v) => !isNaN(v));
      if (chilledPhValues.length >= 3) {
        const trend = getTrend(chilledPhValues);
        summary += `\n  pH trend (last ${chilledPhValues.length} entries): ${trend}`;
      }
    } else {
      summary += '\n\n--- No chilled water entries found ---';
    }

    // Current OOR parameters
    const latestBoiler = boilerEntries[0];
    const latestChilled = chilledEntries[0];
    const oorParams = [];

    if (latestBoiler?.values) {
      for (const [param, range] of Object.entries(CHEMISTRY_RANGES.boiler)) {
        const val = parseFloat(latestBoiler.values[param]);
        if (isNaN(val)) continue;
        const oor = range.targetZero ? val !== 0 : (val < range.min || val > range.max);
        if (oor) oorParams.push(`Boiler ${range.label}: ${val} ${range.unit} (${range.targetZero ? 'target: 0' : `range: ${range.min}-${range.max}`})`);
      }
    }
    if (latestChilled?.values) {
      for (const [param, range] of Object.entries(CHEMISTRY_RANGES.chilled)) {
        const val = parseFloat(latestChilled.values[param]);
        if (isNaN(val)) continue;
        const oor = range.targetZero ? val !== 0 : (val < range.min || val > range.max);
        if (oor) oorParams.push(`Chilled ${range.label}: ${val} ${range.unit} (${range.targetZero ? 'target: 0' : `range: ${range.min}-${range.max}`})`);
      }
    }

    summary += `\n\nCurrent out-of-range parameters: ${oorParams.length > 0 ? oorParams.join('; ') : 'None — all latest readings within acceptable ranges'}`;

    // Chemistry ranges reference
    summary += '\n\nChemistry Ranges Reference:';
    summary += '\n  Boiler: pH 8.5-10.5, Phosphate 20-60 ppm, Sulfite 20-80 ppm, Hardness target 0, Conductivity 0-3500 µS/cm, Alkalinity 100-700 ppm';
    summary += '\n  Chilled: pH 7.5-9.5, Conductivity 0-2000 µS/cm, Inhibitor 50-300 ppm, Iron 0-2 ppm, Molybdate 5-30 ppm';

    return summary;
  } catch (err) {
    console.error('Error building data summary:', err);
    return '\nUnable to load recent data. Provide general guidance based on industry standards.';
  }
}

/**
 * Determine trend direction from an array of values (newest first).
 */
function getTrend(values) {
  if (values.length < 3) return 'insufficient data';
  // Reverse so oldest is first for trend calculation
  const ordered = [...values].reverse();
  const first = ordered.slice(0, Math.ceil(ordered.length / 2));
  const second = ordered.slice(Math.ceil(ordered.length / 2));
  const avgFirst = first.reduce((s, v) => s + v, 0) / first.length;
  const avgSecond = second.reduce((s, v) => s + v, 0) / second.length;
  const diff = avgSecond - avgFirst;
  const threshold = avgFirst * 0.03; // 3% change threshold
  if (Math.abs(diff) < threshold) return 'stable';
  return diff > 0 ? 'trending UP' : 'trending DOWN';
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
    const { hospitalId, question, history } = body;

    if (!hospitalId || !question) {
      return Response.json({ error: 'Hospital and question are required.' }, { status: 400 });
    }

    const knownIssue = HOSPITAL_ISSUES[hospitalId];
    if (knownIssue === undefined) {
      return Response.json({ error: 'Invalid hospital selected.' }, { status: 400 });
    }

    // Look up hospital name
    const hospitalInfo = HOSPITALS.find((h) => h.id === hospitalId);
    const hospitalName = hospitalInfo ? hospitalInfo.name : hospitalId;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json({ error: 'AI service not configured. Contact your administrator.' }, { status: 500 });
    }

    // Build data summary from real entries
    const dataSummary = buildDataSummary(hospitalId);

    const client = new Anthropic({ apiKey });

    const systemPrompt = `You are a water chemistry expert advisor for MedStar Health hospitals. You provide clear, actionable advice specific to hospital water treatment systems including boiler water, chilled water, steam systems, and cooling towers.

Hospital: ${hospitalName}
Known issue: ${knownIssue}
Water treatment vendor: Nalco
${dataSummary}

Guidelines:
- Give specific, actionable advice for this hospital's systems
- Reference the actual data provided above when answering questions about trends, readings, or current status
- If data shows out-of-range parameters, proactively mention them and suggest corrective actions
- Reference industry standards (ASME, ASHRAE) when relevant
- If the question involves safety-critical decisions, always recommend consulting the Nalco rep
- Be concise but thorough
- Use plain language that facility operators can understand
- When discussing trends, reference specific values from the data`;

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
