'use client';
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const SUGGESTIONS = [
  'What should I pack for this trip?',
  'Is this budget realistic?',
  'What are the best local foods to try?',
  'Any safety tips I should know?',
  'What\'s the best time to visit each place?',
  'Can you suggest alternatives for Day 1?',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
        isUser ? 'bg-violet-600' : 'bg-[#334155]'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Bot className="w-3.5 h-3.5 text-violet-400" />}
      </div>
      <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : 'bg-[#334155] text-slate-200 rounded-tl-sm'
      }`}>
        {msg.content}
        {msg.streaming && <TypingDots />}
      </div>
    </div>
  );
}

export default function TripChat({ tripId, destination }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState([
    {
      role: 'assistant',
      content: `Hi! I'm your AI travel assistant for your ${destination} trip. Ask me anything — packing tips, budget advice, local food, safety, or alternatives for any day. 🌍`,
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || streaming) return;

    setInput('');
    const userMsg = { role: 'user', content: userText };
    const assistantMsg = { role: 'assistant', content: '', streaming: true };

    setHistory(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const token = localStorage.getItem('token');
    let accumulated = '';

    try {
      const response = await fetch(`${API_URL}/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userText,
          history: history.filter(m => !m.streaming).map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.delta) {
              accumulated += data.delta;
              setHistory(prev => {
                const next = [...prev];
                next[next.length - 1] = { role: 'assistant', content: accumulated, streaming: true };
                return next;
              });
            } else if (data.done || data.error) {
              setHistory(prev => {
                const next = [...prev];
                next[next.length - 1] = {
                  role: 'assistant',
                  content: data.error ? `Sorry, something went wrong. Please try again.` : accumulated,
                  streaming: false,
                };
                return next;
              });
            }
          } catch { /* skip bad lines */ }
        }
      }
    } catch {
      setHistory(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: 'Sorry, I couldn\'t connect. Please try again.', streaming: false };
        return next;
      });
    } finally {
      setStreaming(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-3 rounded-full shadow-lg shadow-violet-900/40 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          style={{ height: '520px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-[#0f172a]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Trip Assistant</p>
                <p className="text-xs text-slate-500 mt-0.5">{destination}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {history.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {/* Suggestion chips — only show after welcome message */}
            {history.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 px-3 py-1.5 rounded-full transition-all text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/8 bg-[#0f172a]">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                rows={1}
                placeholder="Ask anything about your trip…"
                disabled={streaming}
                className="flex-1 bg-[#1e293b] border border-white/10 focus:border-violet-500/40 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none transition-colors disabled:opacity-50"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="p-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all shrink-0"
              >
                {streaming
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  );
}
