'use client';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';

const HOSPITALS = [
  { id: 'whc', name: 'Washington Hospital Center', issue: 'High cycles optimization needed' },
  { id: 'mont', name: 'Montgomery', issue: 'Low pH steam issue, absent amine residuals' },
  { id: 'union', name: 'Union Memorial', issue: 'Iron contamination in chilled loop' },
  { id: 'harbor', name: 'Harbor', issue: 'Standard operation' },
  { id: 'somd', name: 'Southern Maryland', issue: 'Boiler shutdown blocked, blower failure' },
  { id: 'geo', name: 'Georgetown University Hospital', issue: 'Steam trap maintenance, condensate return quality' },
  { id: 'frank', name: 'Franklin Square Medical Center', issue: 'Cooling tower biological control, legionella prevention' },
  { id: 'gs', name: 'Good Samaritan Hospital', issue: 'Aging boiler system, scale buildup concerns' },
  { id: 'stm', name: "St. Mary's Hospital", issue: 'Chilled water loop corrosion, low inhibitor levels' },
  { id: 'nrh', name: 'National Rehabilitation Hospital (NRH)', issue: 'Compact system, limited redundancy' },
];

function getUser() {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie.split(';').find((c) => c.trim().startsWith('FacilityH2O_user='));
  if (!raw) return null;
  try { return JSON.parse(decodeURIComponent(raw.split('=')[1])); } catch { return null; }
}

export default function AdvisorPage() {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(HOSPITALS[0].id);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [council, setCouncil] = useState(true);
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
        body: JSON.stringify({ hospitalId: hospital, question: q, history, council }),
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
        const MARK = '[COUNCIL_REVIEW]';
        const parts = assistantContent.split(MARK);
        const visible = parts[0];
        const critique = parts.length > 1 ? parts[1].trim() : '';
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: visible.trimEnd(), critique: critique || undefined };
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

  const selectedHospital = HOSPITALS.find((h) => h.id === hospital);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 flex flex-col max-h-screen md:max-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                 Chemistry Advisor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                AI-powered water chemistry guidance
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer select-none whitespace-nowrap" title="Every answer is drafted, anonymously peer-reviewed by a second AI pass, then synthesized">
                <input type="checkbox" checked={council} onChange={(e) => setCouncil(e.target.checked)} className="accent-[#0072CE]" />
                ️ Council
              </label>
              <select
                value={hospital}
                onChange={(e) => { setHospital(e.target.value); clearChat(); }}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {HOSPITALS.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-sm text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
                  title="Clear conversation"
                >
                  ️ Clear
                </button>
              )}
            </div>
          </div>
          {selectedHospital && (
            <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block">
              !️ Known issue: {selectedHospital.issue} · Vendor: Nalco
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="text-5xl mb-4"></div>
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Water Chemistry Advisor
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Ask questions about boiler water chemistry, chilled water loops, steam systems,
                cooling towers, or any water treatment topic for <strong>{selectedHospital?.name || hospital}</strong>.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {[
                  'What are the current trends for this facility?',
                  'Are any parameters trending out of range?',
                  'Analyze recent boiler water readings',
                  'What corrective actions should we take based on current data?',
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
                  <div className="flex items-center gap-2 text-xs font-semibold mb-1">
                    <span className="text-blue-600 dark:text-blue-400"> Advisor</span>
                    {msg.critique && (
                      <span className="text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 rounded-full px-2 py-0.5">️ Council-reviewed</span>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.critique && (
                  <details className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <summary className="cursor-pointer font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">View anonymous peer review</summary>
                    <div className="whitespace-pre-wrap mt-1.5 border-l-2 border-emerald-300 dark:border-emerald-700 pl-2">{msg.critique}</div>
                  </details>
                )}
              </div>
            </div>
          ))}

          {loading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1"> Advisor</div>
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
            AI-powered advisory — always verify with your water treatment vendor before making changes · Council mode: drafted, anonymously peer-reviewed, then synthesized
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
              placeholder={`Ask about water chemistry at ${selectedHospital?.name || hospital}...`}
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
