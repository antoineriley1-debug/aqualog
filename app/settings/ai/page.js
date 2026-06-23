'use client';

/**
 * AI Settings Page (/app/settings/ai)
 * Configure AI models, manage API keys, view usage stats
 * © 2026 Antoine Riley
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw.split('=')[1]));
  } catch {
    return null;
  }
}

const MODEL_COLORS = {
  openclaw: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', dot: 'bg-purple-500' },
  claude: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', dot: 'bg-green-500' },
  gemini: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' },
  ollama: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', dot: 'bg-gray-500' },
};

export default function AISettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [models, setModels] = useState([]);
  const [primaryModel, setPrimaryModel] = useState('claude');
  const [autoFallback, setAutoFallback] = useState(true);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [usage, setUsage] = useState(null);
  const [testing, setTesting] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, modelsRes, usageRes] = await Promise.all([
        fetch('/api/ai/config'),
        fetch('/api/ai/models'),
        fetch('/api/ai/usage'),
      ]);

      const configData = await configRes.json();
      const modelsData = await modelsRes.json();
      const usageData = await usageRes.json();

      setConfig(configData);
      setModels(modelsData.models || []);
      setPrimaryModel(configData.primaryModel);
      setAutoFallback(configData.autoFallback);
      setTemperature(configData.temperature);
      setMaxTokens(configData.maxTokens);
      setUsage(usageData.thisMonth);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryModel,
          autoFallback,
          temperature,
          maxTokens,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const testModel = async (modelName) => {
    try {
      setTesting(modelName);
      const res = await fetch('/api/ai/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelName }),
      });

      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [modelName]: data }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [modelName]: { success: false, error: error.message },
      }));
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 p-8">
          <div className="text-center text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
            <p className="text-gray-600 mt-2">Configure AI models, manage API keys, and track usage</p>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Primary Model Selection */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Primary AI Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => (
                <label
                  key={model.name}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    primaryModel === model.name
                      ? `${MODEL_COLORS[model.name].bg} ${MODEL_COLORS[model.name].border} border-solid`
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name="primaryModel"
                      value={model.name}
                      checked={primaryModel === model.name}
                      onChange={(e) => setPrimaryModel(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            model.available ? MODEL_COLORS[model.name].dot : 'bg-gray-300'
                          }`}
                        />
                        <strong className={`${MODEL_COLORS[model.name].text}`}>{model.label}</strong>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                      {!model.available && <p className="text-sm text-red-600 mt-1">⚠️ {model.error}</p>}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Auto-Fallback & Temperature */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Advanced Settings</h2>

            <div className="space-y-6">
              {/* Auto-Fallback Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoFallback}
                    onChange={(e) => setAutoFallback(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-3 text-gray-700">
                    Enable auto-fallback to backup models
                  </span>
                </label>
                <p className="text-sm text-gray-500 mt-2 ml-7">
                  If primary model fails, automatically try: Claude → Gemini → Ollama
                </p>
              </div>

              {/* Temperature Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {temperature.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min="256"
                  max="8000"
                  step="256"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Maximum length of AI responses
                </p>
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={saving}
              className="mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Test Models */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Models</h2>
            <p className="text-sm text-gray-600 mb-4">Click to verify each model is working</p>
            <div className="space-y-2">
              {models.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <strong className={MODEL_COLORS[model.name].text}>{model.label}</strong>
                    {testResults[model.name] && (
                      <p className={`text-sm mt-1 ${
                        testResults[model.name].success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {testResults[model.name].success
                          ? '✓ ' + testResults[model.name].message
                          : '✗ ' + testResults[model.name].error}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => testModel(model.name)}
                    disabled={testing === model.name || !model.available}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition"
                  >
                    {testing === model.name ? 'Testing...' : 'Test'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          {usage && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">This Month's Usage</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{usage.calls}</div>
                  <div className="text-sm text-gray-600">API Calls</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{(usage.cost || 0).toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Cost ($)</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">{(usage.tokens || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Tokens</div>
                </div>
              </div>

              {Object.keys(usage.byModel || {}).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">By Model</h3>
                  <div className="space-y-2">
                    {Object.entries(usage.byModel).map(([model, stats]) => (
                      <div key={model} className="flex justify-between p-2 bg-gray-50 rounded">
                        <span className={`font-medium ${MODEL_COLORS[model]?.text || 'text-gray-700'}`}>
                          {MODEL_COLORS[model]?.label || model}
                        </span>
                        <span className="text-sm text-gray-600">
                          {stats.calls} calls • {stats.tokens.toLocaleString()} tokens • ${(stats.cost || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
