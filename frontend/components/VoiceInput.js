'use client';
import { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';

const INTEREST_KEYWORDS = {
  'Food & Cuisine':      ['food', 'cuisine', 'eat', 'restaurant', 'cooking', 'dining', 'culinary'],
  'Culture & History':   ['culture', 'history', 'historical', 'museum', 'heritage', 'ancient', 'temple', 'monument'],
  'Adventure & Sports':  ['adventure', 'sport', 'hiking', 'trekking', 'climbing', 'diving', 'rafting', 'extreme'],
  'Shopping':            ['shopping', 'shop', 'market', 'mall', 'boutique', 'souvenir'],
  'Nature & Outdoors':   ['nature', 'outdoor', 'park', 'wildlife', 'forest', 'beach', 'mountain', 'scenic'],
  'Nightlife':           ['nightlife', 'night', 'club', 'bar', 'party', 'cocktail'],
  'Art & Museums':       ['art', 'museum', 'gallery', 'exhibition', 'theatre', 'theater', 'opera'],
  'Wellness & Spa':      ['wellness', 'spa', 'yoga', 'meditation', 'relax', 'retreat'],
};

const BUDGET_KEYWORDS = {
  low:    ['budget', 'cheap', 'affordable', 'backpack', 'hostel', 'economical', 'low cost', 'inexpensive', 'frugal'],
  medium: ['moderate', 'mid range', 'mid-range', 'comfortable', 'standard', 'average', 'reasonable'],
  high:   ['luxury', 'luxurious', 'premium', 'high end', 'expensive', 'five star', '5 star', 'lavish', 'splurge'],
};

const TRAVELER_KEYWORDS = {
  solo:    ['solo', 'alone', 'myself', 'by myself', 'single', 'just me', 'on my own'],
  couple:  ['couple', 'partner', 'wife', 'husband', 'girlfriend', 'boyfriend', 'honeymoon', 'romantic', 'two of us'],
  family:  ['family', 'kids', 'children', 'parents', 'child'],
  friends: ['friends', 'group', 'gang', 'crew', 'squad', 'colleagues', 'mates'],
};

function parseTranscript(text) {
  const lower = text.toLowerCase();
  const result = {};

  // Extract days — "5 days", "for 7 days", "a week", "a month"
  const weekMatch = lower.match(/\b(a |one |two |three |1 |2 |3 )?week\b/);
  const monthMatch = lower.match(/\ba month\b/);
  const daysMatch = lower.match(/\b(\d+)\s*days?\b/);
  if (monthMatch) result.days = '30';
  else if (weekMatch) {
    const prefix = weekMatch[1]?.trim();
    const n = { a: 7, one: 7, two: 14, three: 21, '1': 7, '2': 14, '3': 21 };
    result.days = String(n[prefix] || 7);
  } else if (daysMatch) result.days = daysMatch[1];

  // Extract budget
  for (const [id, keywords] of Object.entries(BUDGET_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) { result.budgetType = id; break; }
  }

  // Extract travelers
  for (const [id, keywords] of Object.entries(TRAVELER_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) { result.travelersType = id; break; }
  }

  // Extract interests
  const interests = [];
  for (const [interest, keywords] of Object.entries(INTEREST_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) interests.push(interest);
  }
  if (interests.length) result.interests = interests;

  // Extract destination — look for "to X", "visit X", "in X", "going to X"
  const destPatterns = [
    /(?:going to|travel to|visit|trip to|fly to|vacation in|holiday in|go to)\s+([a-zA-Z\s,]+?)(?:\s+for|\s+on|\s+with|\s+as|$)/i,
    /(?:want to go|like to go|plan to go)\s+(?:to\s+)?([a-zA-Z\s,]+?)(?:\s+for|\s+on|\s+with|\s+as|$)/i,
    /^(?:plan|i want|book)\s+(?:a trip to|to)\s+([a-zA-Z\s,]+)/i,
  ];
  for (const pattern of destPatterns) {
    const m = text.match(pattern);
    if (m?.[1]?.trim().length > 1) {
      result.destinationLabel = m[1].trim().replace(/\s+/g, ' ');
      break;
    }
  }

  return result;
}

export default function VoiceInput({ onResult }) {
  const [state, setState] = useState('idle'); // idle | listening | processing | done | error | unsupported
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState(null);
  const recognitionRef = useRef(null);

  const start = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setState('unsupported'); return; }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setState('listening');

    recognition.onresult = (e) => {
      setState('processing');
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const result = parseTranscript(text);
      setParsed(result);
      setState('done');
      onResult?.(result, text);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'aborted') setState('error');
    };

    recognition.onend = () => {
      if (state === 'listening') setState('idle');
    };

    recognition.start();
  }, [onResult, state]);

  function stop() {
    recognitionRef.current?.stop();
    setState('idle');
  }

  function reset() {
    setTranscript('');
    setParsed(null);
    setState('idle');
  }

  const isListening = state === 'listening';

  return (
    <div className="mb-8">
      {/* Mic button */}
      <div className="flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={isListening ? stop : start}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border transition-all ${
            isListening
              ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
              : state === 'unsupported'
              ? 'bg-white/5 border-white/10 text-slate-500 cursor-not-allowed'
              : 'bg-violet-500/15 border-violet-500/30 text-violet-400 hover:bg-violet-500/25'
          }`}
          disabled={state === 'unsupported' || state === 'processing'}
        >
          {state === 'processing'
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : isListening
            ? <MicOff className="w-4 h-4" />
            : <Mic className="w-4 h-4" />}
          {state === 'processing' ? 'Processing…'
            : isListening ? 'Stop listening'
            : state === 'unsupported' ? 'Voice not supported'
            : 'Fill form with voice'}
        </button>
        {isListening && (
          <div className="flex gap-1 items-center">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce"
                style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Hint text */}
      {state === 'idle' && (
        <p className="text-xs text-slate-500">
          Try: <span className="text-slate-400 italic">"Plan a 5-day luxury trip to Tokyo with my partner, interested in food and culture"</span>
        </p>
      )}

      {isListening && (
        <p className="text-xs text-red-400 animate-pulse">Listening… speak your trip details</p>
      )}

      {/* Result card */}
      {state === 'done' && parsed && (
        <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-4 mt-3">
          <div className="flex items-start justify-between mb-2">
            <p className="text-xs text-violet-300 font-semibold">Detected from voice:</p>
            <button onClick={reset} className="text-white/30 hover:text-white/60 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-white/40 italic mb-3">"{transcript}"</p>
          <div className="flex flex-wrap gap-2">
            {parsed.destinationLabel && (
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full border border-violet-500/20">
                📍 {parsed.destinationLabel}
              </span>
            )}
            {parsed.days && (
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full border border-violet-500/20">
                📅 {parsed.days} days
              </span>
            )}
            {parsed.budgetType && (
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full border border-violet-500/20">
                💰 {parsed.budgetType}
              </span>
            )}
            {parsed.travelersType && (
              <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-1 rounded-full border border-violet-500/20">
                👥 {parsed.travelersType}
              </span>
            )}
            {parsed.interests?.map(i => (
              <span key={i} className="text-xs bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-full border border-sky-500/20">
                ✦ {i}
              </span>
            ))}
          </div>
          {Object.keys(parsed).length === 0 && (
            <p className="text-xs text-white/40">Couldn't detect trip details — try being more specific.</p>
          )}
        </div>
      )}

      {state === 'error' && (
        <p className="text-xs text-red-400 mt-2">Microphone access denied or no speech detected. <button onClick={reset} className="underline">Try again</button></p>
      )}
    </div>
  );
}
