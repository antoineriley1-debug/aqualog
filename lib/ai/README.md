# AI Orchestration Layer - EXECOS Pro

Complete AI model integration with automatic fallback and cost tracking.

## Overview

The AI orchestration layer provides seamless integration with multiple AI providers:

- **OpenClaw Agent** (Purple) - Local AI agent, zero cost, offline-capable
- **Claude** (Green) - Anthropic's Claude, most capable, $0.003/$0.015 per 1K tokens
- **Gemini** (Blue) - Google's Gemini, enterprise-grade, varies by model
- **Ollama** (Gray) - Local LLM, offline, customizable models

## Architecture

```
User Request
    ↓
/api/ai/* (API Route)
    ↓
AIOrchestrator (Orchestrator class)
    ↓
Provider Selection (Primary or Fallback)
    ↓
AI Provider (OpenClaw/Claude/Gemini/Ollama)
    ↓
Usage Logging & Cost Calculation
    ↓
Response to User
```

## Setup

### 1. Environment Variables

```bash
# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# Gemini (Google)
GOOGLE_API_KEY=AIzaSy...

# Ollama (Local)
OLLAMA_URL=http://localhost:11434

# OpenClaw (Local)
OPENCLAW_API_URL=http://localhost:3000

# Supabase (for tracking)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 2. Database Schema

Run the SQL in `database-schema.sql` on your Supabase instance:

```bash
# Copy database-schema.sql content to Supabase SQL editor and run
```

This creates:
- `ai_model_configs` - User configuration (primary model, temperature, etc.)
- `ai_api_keys` - Encrypted API key storage
- `ai_usage_logs` - Usage tracking for billing
- `ai_model_settings` - Per-model user settings
- `ai_monthly_budgets` - Monthly spending limits

### 3. Install Optional Dependencies

```bash
# For Gemini support
npm install @google/generative-ai

# Already installed: @anthropic-ai/sdk
```

## API Routes

All routes require authentication via `getUserFromRequest()`.

### POST /api/ai/summarize
Summarize email or text content.

```javascript
const res = await fetch('/api/ai/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'Email content here...' })
});

const data = await res.json();
// { summary: "...", model: "claude", tokens: { input: 100, output: 50 }, cost: 0.0015, duration: 1234 }
```

### POST /api/ai/investigate
Deep analysis of email with optional context.

```javascript
const res = await fetch('/api/ai/investigate', {
  method: 'POST',
  body: JSON.stringify({ 
    email: 'Email content...',
    context: 'Optional context about sender or situation'
  })
});
```

### POST /api/ai/analyze-contract
Analyze contracts for terms, risks, obligations.

```javascript
const res = await fetch('/api/ai/analyze-contract', {
  method: 'POST',
  body: JSON.stringify({ contract: 'Contract text...' })
});
```

### POST /api/ai/search
AI-powered search with context.

```javascript
const res = await fetch('/api/ai/search', {
  method: 'POST',
  body: JSON.stringify({ 
    query: 'What are the Q3 financial results?',
    context: 'Optional knowledge base or document context'
  })
});
```

### POST /api/ai/generate-report
Generate professional reports from data.

```javascript
const res = await fetch('/api/ai/generate-report', {
  method: 'POST',
  body: JSON.stringify({ 
    data: { section1: 'data...', section2: 'data...' }
  })
});
```

### GET /api/ai/models
List available models and their status.

```javascript
const res = await fetch('/api/ai/models');
const { models, currentPrimary, autoFallback, fallbackOrder } = await res.json();
// models: Array of { name, label, available, description, variants }
```

### POST /api/ai/test-model
Test if a specific model is working.

```javascript
const res = await fetch('/api/ai/test-model', {
  method: 'POST',
  body: JSON.stringify({ model: 'claude' })
});
// { success: true, message: "Claude API connection successful" }
```

### GET/POST /api/ai/config
Get or update user's AI configuration.

```javascript
// Get current config
const res = await fetch('/api/ai/config');
const config = await res.json();
// { primaryModel: "claude", autoFallback: true, fallbackOrder: [...], temperature: 0.7, maxTokens: 2000 }

// Update config
const res = await fetch('/api/ai/config', {
  method: 'POST',
  body: JSON.stringify({
    primaryModel: 'claude',
    autoFallback: true,
    temperature: 0.8,
    maxTokens: 3000
  })
});
```

### GET /api/ai/usage
Get current month's usage statistics.

```javascript
const res = await fetch('/api/ai/usage');
const { thisMonth, budget } = await res.json();
// thisMonth: { calls, tokens, cost, byModel: {...}, byTask: {...} }
// budget: { spent, remaining, budget, overBudget, nearThreshold }
```

## Usage Example

### Basic Usage

```javascript
import { getOrchestrator } from '@/lib/ai/orchestrator';
import { getAIConfig } from '@/lib/ai/database';

// In an API route:
const config = await getAIConfig(userId);
const orchestrator = new AIOrchestrator({
  primaryModel: config.primary_model || 'claude',
  autoFallback: config.auto_fallback,
  fallbackOrder: config.fallback_order,
  claude: { temperature: config.temperature, maxTokens: config.max_tokens }
});

// Execute with automatic fallback
const result = await orchestrator.summarize(emailContent);
console.log(`Used model: ${result.model}`);
console.log(`Cost: $${result.cost.toFixed(4)}`);
console.log(`Tokens: ${result.tokens.input} input, ${result.tokens.output} output`);
```

### Accessing from Components

```javascript
'use client';

import { useEffect, useState } from 'react';

export default function Component() {
  const [result, setResult] = useState(null);

  const handleAnalyze = async (email) => {
    const res = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      {result && (
        <div>
          <p>{result.summary}</p>
          <p>Used: {result.model} • Cost: ${result.cost.toFixed(4)}</p>
        </div>
      )}
    </div>
  );
}
```

## Cost Tracking

### Model Pricing

| Model | Input | Output |
|-------|-------|--------|
| Claude 3.5 Sonnet | $0.003/1K | $0.015/1K |
| Claude 3 Opus | $0.015/1K | $0.075/1K |
| Claude 3 Haiku | $0.0008/1K | $0.0024/1K |
| Gemini 2.0 Pro | ~$0.0005/1K | ~$0.0015/1K |
| Ollama | Free (local) | Free (local) |

### Tracking Usage

Every API call is logged to `ai_usage_logs`:

```javascript
await logUsage(
  userId,        // User ID
  'claude',      // Model used
  'summarize',   // Task type
  { input: 100, output: 50 },  // Tokens
  0.0015,        // Cost in dollars
  1234,          // Duration in milliseconds
  'success',     // Status
  null           // Error message (if failed)
);
```

### Budget Management

Set monthly budgets and alerts:

```javascript
import { setMonthlyBudget, checkBudgetStatus } from '@/lib/ai/database';

// Set budget
await setMonthlyBudget(userId, new Date(), 50.00, 40.00); // $50 budget, $40 alert

// Check status
const status = await checkBudgetStatus(userId);
// { budget, spent, remaining, alertThreshold, overBudget, nearThreshold }
```

## Fallback Logic

When auto-fallback is enabled and the primary model fails:

```
1. Try Primary Model (user-selected)
   └─ On failure (timeout, rate limit, error):
   
2. Try Fallback 1: Claude
   └─ On failure:
   
3. Try Fallback 2: Gemini
   └─ On failure:
   
4. Try Fallback 3: Ollama (local)
   └─ On failure:
   
5. Return error with all failures logged
```

All failures are logged for debugging and cost tracking.

## Settings Page

Users access AI settings at `/app/settings/ai`:

- **Model Selection**: Choose primary AI model
- **Advanced Settings**:
  - Auto-fallback toggle
  - Temperature slider (0.0 = focused, 1.0 = creative)
  - Max tokens slider (256-8000)
- **Model Testing**: Verify each model is working
- **Usage Statistics**: View this month's usage by model and task
- **Budget Tracking**: Monitor spending against budget

## Header Indicator

The `AIIndicator` component shows current model in header:

```javascript
import AIIndicator from '@/components/AIIndicator';

export default function Header() {
  return (
    <header>
      <AIIndicator /> {/* Shows model dot + label, links to settings */}
    </header>
  );
}
```

## Error Handling

All providers implement proper error handling:

```javascript
// Automatic retries with exponential backoff
const result = await orchestrator.summarize(content);

if (result.error) {
  console.error('All models failed:', result.error);
  console.log('Failed attempts:', result.errors);
  // errors: [{ model: 'claude', error: 'message' }, ...]
}
```

## Security

- **API Keys**: Encrypted in Supabase with RLS policies
- **User Isolation**: Row-level security ensures users only see their own data
- **Rate Limiting**: Built-in provider-level rate limit handling (429 errors)
- **Authentication**: All routes require valid user session

## Performance Tips

1. **Batch Requests**: Combine multiple queries into single API calls
2. **Cache Results**: Cache frequently used AI outputs
3. **Use Ollama**: For internal/development work (zero cost)
4. **Monitor Costs**: Set monthly budgets and alerts
5. **Optimize Tokens**: Use lower max_tokens for faster, cheaper responses

## Troubleshooting

### "API key not configured"
Ensure environment variables are set in `.env.local`:
```bash
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy...
```

### "Ollama connection failed"
Check Ollama is running:
```bash
ollama serve  # Start Ollama server
# Default: http://localhost:11434
```

### High costs
- Check `/api/ai/usage` for cost breakdown
- Set monthly budget with `setMonthlyBudget()`
- Switch primary model to cheaper option (Haiku < Sonnet < Opus)

### Model not responding
- Click "Test" in Settings → AI
- Check API keys and rate limits
- Verify database schema is created
- Check browser console for errors

## Future Enhancements

- [ ] Streaming responses for long outputs
- [ ] Custom prompts per task type
- [ ] Model comparison UI (side-by-side results)
- [ ] Webhook notifications for budget alerts
- [ ] Usage analytics dashboard
- [ ] Fine-tuning for custom models
- [ ] Multi-language support
- [ ] Prompt templating system
