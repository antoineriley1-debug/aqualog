/**
 * AI Model Indicator Component
 * Displays current AI model in header with fallback status
 * © 2026 Antoine Riley
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const MODEL_CONFIG = {
  openclaw: { color: 'bg-purple-500', label: 'OpenClaw', icon: '↯' },
  claude: { color: 'bg-green-500', label: 'Claude', icon: '✦' },
  gemini: { color: 'bg-blue-500', label: 'Gemini', icon: '★' },
  ollama: { color: 'bg-gray-500', label: 'Ollama', icon: '⚙' },
};

export default function AIIndicator() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    loadConfig();
    const interval = setInterval(loadConfig, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load AI config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !config) {
    return null;
  }

  const primaryModel = config.primaryModel || 'claude';
  const modelInfo = MODEL_CONFIG[primaryModel];

  return (
    <div className="relative">
      <Link href="/settings/ai">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={`w-2 h-2 rounded-full ${modelInfo?.color}`} />
          <span className="text-sm font-medium text-gray-700">
            {modelInfo?.icon} {modelInfo?.label}
          </span>
        </div>
      </Link>

      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 bg-gray-900 text-white text-xs rounded shadow-lg p-2 w-48 z-50">
          <div className="font-semibold mb-1">Current AI Model</div>
          <div className="text-gray-300 text-xs mb-2">
            Primary: <strong>{modelInfo?.label}</strong>
          </div>
          {config.autoFallback && (
            <div className="text-gray-300 text-xs">
              Fallback chain: Claude → Gemini → Ollama
            </div>
          )}
          <div className="text-gray-400 text-xs mt-2 pt-2 border-t border-gray-700">
            Click to change settings
          </div>
        </div>
      )}
    </div>
  );
}
