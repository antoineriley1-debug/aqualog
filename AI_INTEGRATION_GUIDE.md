# AI Orchestration Layer - Integration Guide

Complete guide to integrating the AI orchestration system into EXECOS Pro.

## 📋 Checklist

### Phase 1: Setup & Configuration ✅

- [x] Create provider implementations (OpenClaw, Claude, Gemini, Ollama)
- [x] Build AI Orchestrator with fallback logic
- [x] Create database schema with Supabase
- [x] Implement encryption for API keys
- [x] Create all API routes

### Phase 2: Database & Integration ⚠️ **NEXT**

- [ ] Run database schema SQL in Supabase
- [ ] Update package.json with Gemini dependency (optional)
- [ ] Configure environment variables in `.env.local`
- [ ] Test all API routes

### Phase 3: UI & Components 🔄

- [ ] Add AIIndicator to main header layout
- [ ] Integrate `/app/settings/ai` page into settings navigation
- [ ] Test settings page UI
- [ ] Add usage stats widget to dashboard

### Phase 4: Testing & Monitoring 📊

- [ ] Run integration tests
- [ ] Load test with concurrent requests
- [ ] Monitor costs and set budgets
- [ ] Handle error scenarios

---

## 🚀 Quick Start (30 minutes)

### 1. Database Setup (5 min)

In Supabase SQL editor, run:

```sql
-- Copy entire database-schema.sql content here
-- From: lib/ai/database-schema.sql
```

### 2. Environment Setup (5 min)

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your API keys:
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIzaSy...
OLLAMA_URL=http://localhost:11434
AI_ENCRYPTION_KEY=your-random-hex-string
```

Generate encryption key:
```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
```

### 3. Install Dependencies (5 min)

```bash
# Gemini support (optional, but recommended)
npm install @google/generative-ai

# Claude is already in package.json
# Ollama needs no dependencies
```

### 4. Update Header (5 min)

Add AIIndicator to your main layout:

```javascript
// app/layout.js or components/Header.js
import AIIndicator from '@/components/AIIndicator';

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4">
      {/* ... existing header content ... */}
      <AIIndicator /> {/* Add this */}
    </header>
  );
}
```

### 5. Test Routes (5 min)

```bash
# Test summarize endpoint
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -d '{"email": "Your email text here"}'

# Test models endpoint
curl http://localhost:3000/api/ai/models

# Test usage endpoint
curl http://localhost:3000/api/ai/usage
```

---

## 📁 File Structure

```
aqualog/
├── lib/ai/
│   ├── providers.js              # AI provider implementations
│   ├── orchestrator.js           # Main orchestrator class
│   ├── orchestrator.test.js      # Tests
│   ├── database.js               # Supabase queries
│   ├── database-schema.sql       # Database schema
│   ├── encryption.js             # API key encryption
│   └── README.md                 # API documentation
│
├── app/api/ai/
│   ├── summarize/route.js        # Email summarization
│   ├── investigate/route.js      # Deep analysis
│   ├── analyze-contract/route.js # Contract analysis
│   ├── search/route.js           # AI search
│   ├── generate-report/route.js  # Report generation
│   ├── models/route.js           # List available models
│   ├── test-model/route.js       # Test specific model
│   ├── config/route.js           # Get/set user config
│   ├── api-keys/route.js         # Manage API keys
│   └── usage/route.js            # Usage statistics
│
├── app/settings/ai/
│   └── page.js                   # Settings UI
│
├── components/
│   └── AIIndicator.js            # Header indicator component
│
└── .env.example                  # Environment template
```

---

## 🔌 API Endpoints Reference

All routes require authentication. Base URL: `/api/ai`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/summarize` | Email/text summarization |
| POST | `/investigate` | Deep email analysis |
| POST | `/analyze-contract` | Contract legal analysis |
| POST | `/search` | AI-powered search |
| POST | `/generate-report` | Report generation |
| GET | `/models` | List available models |
| POST | `/test-model` | Test specific model |
| GET | `/config` | Get user configuration |
| POST | `/config` | Update configuration |
| GET | `/api-keys` | List API keys (masked) |
| POST | `/api-keys` | Set API key |
| DELETE | `/api-keys` | Remove API key |
| GET | `/usage` | Usage statistics |

---

## 🎯 Integration Examples

### Example 1: Summarize Email

```javascript
// In your email component
async function summarizeEmail(emailContent) {
  const res = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailContent })
  });
  
  const { summary, model, cost } = await res.json();
  console.log(`Summary (via ${model}): ${summary}`);
  console.log(`Cost: $${cost.toFixed(4)}`);
}
```

### Example 2: Analyze Document with UI

```javascript
// In a React component
'use client';
import { useState } from 'react';

export default function DocumentAnalyzer() {
  const [doc, setDoc] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        body: JSON.stringify({ text: doc })
      });
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <textarea 
        value={doc} 
        onChange={e => setDoc(e.target.value)}
        placeholder="Paste document here..."
      />
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {result && (
        <div>
          <h3>Analysis (via {result.model})</h3>
          <p>{result.analysis}</p>
          <small>Cost: ${result.cost.toFixed(4)}</small>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Backend Usage

```javascript
// In an API route or server action
import { getOrchestrator } from '@/lib/ai/orchestrator';
import { getAIConfig, logUsage } from '@/lib/ai/database';

export async function POST(request) {
  const { text } = await request.json();
  const userId = getUserId(request);

  // Load user's config
  const config = await getAIConfig(userId);
  
  // Create orchestrator
  const orchestrator = new AIOrchestrator({
    primaryModel: config?.primary_model || 'claude',
    autoFallback: config?.auto_fallback,
  });

  // Execute task with fallback
  const result = await orchestrator.summarize(text);

  // Log usage
  await logUsage(
    userId,
    result.model,
    'summarize',
    result.tokens,
    result.cost,
    result.duration
  );

  return Response.json({
    summary: result.result,
    model: result.model,
    cost: result.cost
  });
}
```

---

## 🔐 Security Best Practices

### 1. API Key Storage
- ✅ Encrypted in database
- ✅ Never exposed in logs
- ✅ Masked in UI display
- ✅ Row-level security in Supabase

### 2. Rate Limiting
- Implement per-user rate limits
- Monitor 429 (rate limit) errors
- Use queue for high-volume requests

### 3. Cost Control
- Set monthly budgets
- Alert at 80% threshold
- Monitor by model and task
- Switch to cheaper model if needed

### 4. Access Control
- All routes require authentication
- Users can only access their own data
- Audit log all AI API calls

---

## 💰 Cost Optimization

### Tier 1: Highest Quality (Most Expensive)
- **Claude 3 Opus**: $0.015/$0.075 per 1K tokens
- Use for: Complex analysis, contracts
- Recommendation: Limit to critical tasks

### Tier 2: Balanced (Recommended)
- **Claude 3.5 Sonnet**: $0.003/$0.015 per 1K tokens ⭐ DEFAULT
- Use for: General tasks, emails, summaries
- Recommendation: Primary model

### Tier 3: Cheaper
- **Claude 3 Haiku**: $0.0008/$0.0024 per 1K tokens
- Use for: Simple tasks, classification
- Recommendation: Secondary/fallback

### Tier 4: Free (Offline)
- **Ollama (local)**: $0.00
- Use for: Testing, development, internal
- Recommendation: Fallback option

**Strategy**: Use Claude Sonnet as primary, fallback to Haiku for cheaper processing.

---

## 📊 Monitoring & Debugging

### View Usage Stats

```javascript
const stats = await getCurrentMonthUsage(userId);
console.log('API calls:', stats.total.calls);
console.log('Total tokens:', stats.total.tokens);
console.log('Total cost:', stats.total.cost);
console.log('By model:', stats.byModel);
console.log('By task:', stats.byTask);
```

### Check Budget Status

```javascript
const budget = await checkBudgetStatus(userId);
console.log('Budget:', budget.budget);
console.log('Spent:', budget.spent);
console.log('Remaining:', budget.remaining);
console.log('Over budget:', budget.overBudget);
```

### Test Models

```bash
curl -X POST http://localhost:3000/api/ai/test-model \
  -H "Content-Type: application/json" \
  -d '{"model": "claude"}'
```

### Debug Fallback

Set in browser console:
```javascript
localStorage.setItem('debug', 'ai:*');
// Reload page to see detailed logs
```

---

## 🚨 Troubleshooting

### "API key not configured"
```bash
# Check .env.local
cat .env.local | grep ANTHROPIC_API_KEY

# Generate new key at: https://console.anthropic.com/
```

### "Ollama connection failed"
```bash
# Start Ollama server
ollama serve

# Check it's running
curl http://localhost:11434/api/tags
```

### "Gemini not working"
```bash
# Install SDK
npm install @google/generative-ai

# Get API key from https://aistudio.google.com/
```

### "Database schema error"
```bash
# Verify database setup
SELECT * FROM information_schema.tables 
WHERE table_name = 'ai_model_configs';

# Re-run schema from database-schema.sql
```

### "High costs"
1. Go to `/settings/ai`
2. Check "By Model" and "By Task" breakdown
3. Switch to cheaper model (Haiku)
4. Set monthly budget with alerts
5. Review logs: `SELECT * FROM ai_usage_logs WHERE user_id = 'xxx' ORDER BY timestamp DESC LIMIT 100;`

---

## 🔄 Update & Maintenance

### Add New AI Provider

1. Create provider class in `lib/ai/providers.js`:
```javascript
export class NewProvider extends AIProvider {
  async summarize(email) { /* ... */ }
  // ... implement all methods
}
```

2. Add initialization in `AIOrchestrator`:
```javascript
try {
  this.providers.newprovider = new NewProvider(config.newprovider);
} catch (e) {
  console.debug('NewProvider not available:', e.message);
}
```

3. Add to `fallbackOrder` in defaults

### Monitor Costs

```sql
-- Monthly cost breakdown
SELECT 
  DATE_TRUNC('month', timestamp) as month,
  model,
  COUNT(*) as calls,
  SUM(tokens_in + tokens_out) as total_tokens,
  SUM(cost) as total_cost
FROM ai_usage_logs
GROUP BY month, model
ORDER BY month DESC, total_cost DESC;

-- Most expensive tasks
SELECT 
  task_type,
  COUNT(*) as calls,
  SUM(cost) as total_cost,
  AVG(cost) as avg_cost
FROM ai_usage_logs
GROUP BY task_type
ORDER BY total_cost DESC;
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Database schema created in Supabase
- [ ] API keys encrypted and stored
- [ ] Rate limiting implemented
- [ ] Error handling tested
- [ ] Budget alerts configured
- [ ] Usage monitoring working
- [ ] AIIndicator component added to header
- [ ] Settings page accessible
- [ ] All tests passing
- [ ] Load tested (concurrent requests)
- [ ] Cost monitoring dashboard working

---

## 📞 Support

For issues or questions:

1. Check `lib/ai/README.md` for API details
2. Review error logs in database: `ai_usage_logs`
3. Test individual components in `/settings/ai`
4. Check browser console for client-side errors
5. Verify environment variables with `.env.example`

---

## 🎓 Next Steps

1. **Today**: Set up database, configure environment, test routes
2. **Tomorrow**: Add to UI, test end-to-end flows
3. **This Week**: Monitor costs, optimize prompts, handle errors
4. **Next Week**: Add custom prompts, implement streaming, scale

---

**Built with ❤️ for EXECOS Pro**
© 2026 Antoine Riley
