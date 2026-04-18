'use client';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

const HOSPITALS = [
  { name: 'Montgomery', issue: 'Low pH steam issue, absent amine residuals' },
  { name: 'Union Memorial', issue: 'Iron contamination in chilled loop' },
  { name: 'Harbor', issue: 'Standard operation' },
  { name: 'Southern Maryland', issue: 'Boiler shutdown blocked, blower failure' },
  { name: 'Washington Hospital Center', issue: 'High cycles optimization needed' },
];

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function AdvisorPage() {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(HOSPITALS[0].name);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (!u) window.location.href = '/login';
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setError('');
    const userMsg = { role: 'user', content: q };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');
    setLoading(true);

    try {
      // Build history from previous messages (exclude the current question)
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospital, question: q, history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      // Stream the response
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        const currentContent = assistantContent;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: currentContent };
          return updated;
        });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      // Remove the empty assistant message if streaming failed before any content
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant' && !prev[prev.length - 1].content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  if (!user) return null;

  const selectedHospital = HOSPITALS.find((h) => h.name === hospital);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col max-h-screen md:max-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                🧪 Chemistry Advisor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                AI-powered water chemistry guidance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={hospital}
                onChange={(e) => { setHospital(e.target.value); clearChat(); }}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {HOSPITALS.map((h) => (
                  <option key={h.name} value={h.name}>{h.name}</option>
                ))}
              </select>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
                  title="Clear conversation"
                >
                  🗑️ Clear
                </button>
              )}
            </div>
          </div>
          {selectedHospital && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block">
              ⚠️ Known issue: {selectedHospital.issue} · Vendor: Nalco
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-5xl mb-4">🧪</div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Water Chemistry Advisor
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Ask questions about boiler water chemistry, chilled water loops, steam systems,
                cooling towers, or any water treatment topic for <strong>{hospital}</strong>.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {[
                  'What should my boiler water pH be?',
                  'How do I address iron in the chilled loop?',
                  'When should I blow down the cooling tower?',
                  'What are normal conductivity ranges?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => { setQuestion(suggestion); inputRef.current?.focus(); }}
                    className="text-left text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#0072CE] text-white rounded-br-md'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">🧪 Advisor</div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">🧪 Advisor</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span className="animate-pulse">Thinking</span>
                  <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-4 sm:px-6 pb-1">
          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-center">
            AI-powered advisory — always verify with your water treatment vendor before making changes
          </p>
        </div>

        {/* Input Area */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
          {error && (
            <div className="mb-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask about water chemistry at ${hospital}...`}
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
              disabled={loading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="bg-[#0072CE] hover:bg-[#005fa3] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <>
                  <span className="hidden sm:inline">Send</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
