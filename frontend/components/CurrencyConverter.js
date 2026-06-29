'use client';
import { useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight, TrendingUp, RefreshCw } from 'lucide-react';

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', label: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', label: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'THB', label: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'IDR', label: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'KRW', label: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'HKD', label: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'MXN', label: 'Mexican Peso', symbol: '$', flag: '🇲🇽' },
  { code: 'BRL', label: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'TRY', label: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
];

// Guess destination currency from trip destination string
const DESTINATION_CURRENCY_MAP = {
  japan: 'JPY', tokyo: 'JPY', osaka: 'JPY', kyoto: 'JPY',
  india: 'INR', delhi: 'INR', mumbai: 'INR', bangalore: 'INR', goa: 'INR', jaipur: 'INR',
  uk: 'GBP', london: 'GBP', england: 'GBP', scotland: 'GBP',
  france: 'EUR', paris: 'EUR', germany: 'EUR', berlin: 'EUR', spain: 'EUR',
  barcelona: 'EUR', madrid: 'EUR', italy: 'EUR', rome: 'EUR', amsterdam: 'EUR',
  usa: 'USD', 'new york': 'USD', 'los angeles': 'USD', chicago: 'USD', miami: 'USD',
  australia: 'AUD', sydney: 'AUD', melbourne: 'AUD',
  canada: 'CAD', toronto: 'CAD', vancouver: 'CAD',
  singapore: 'SGD', dubai: 'AED', 'uae': 'AED',
  thailand: 'THB', bangkok: 'THB', phuket: 'THB',
  indonesia: 'IDR', bali: 'IDR', jakarta: 'IDR',
  malaysia: 'MYR', 'kuala lumpur': 'MYR',
  'south korea': 'KRW', seoul: 'KRW',
  'hong kong': 'HKD',
  china: 'CNY', beijing: 'CNY', shanghai: 'CNY',
  switzerland: 'CHF', zurich: 'CHF',
  mexico: 'MXN', 'mexico city': 'MXN',
  brazil: 'BRL', 'rio de janeiro': 'BRL', 'são paulo': 'BRL',
  turkey: 'TRY', istanbul: 'TRY',
  'south africa': 'ZAR', 'cape town': 'ZAR', johannesburg: 'ZAR',
};

function guessCurrency(destination) {
  if (!destination) return 'USD';
  const lower = destination.toLowerCase();
  for (const [key, code] of Object.entries(DESTINATION_CURRENCY_MAP)) {
    if (lower.includes(key)) return code;
  }
  return 'USD';
}

function formatAmount(amount, code) {
  const cur = CURRENCIES.find(c => c.code === code);
  if (!cur) return `${amount.toFixed(2)} ${code}`;
  if (amount >= 1000000) return `${cur.symbol}${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `${cur.symbol}${amount.toLocaleString('en', { maximumFractionDigits: 0 })}`;
  return `${cur.symbol}${amount.toFixed(2)}`;
}

export default function CurrencyConverter({ destination }) {
  const destCurrency = guessCurrency(destination);
  const [from, setFrom] = useState(destCurrency);
  const [to, setTo] = useState(destCurrency === 'INR' ? 'USD' : 'INR');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.frankfurter.app/latest?from=${from}`);
      const data = await res.json();
      setRates(data.rates);
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [from]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  const rate = rates?.[to];
  const converted = rate && amount ? (parseFloat(amount) || 0) * rate : null;

  const fromCur = CURRENCIES.find(c => c.code === from);
  const toCur = CURRENCIES.find(c => c.code === to);

  const popularPairs = CURRENCIES.filter(c => c.code !== from && ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AED', 'SGD'].includes(c.code)).slice(0, 6);

  return (
    <div className="bg-[#1e293b] border border-white/8 rounded-2xl overflow-hidden mb-7">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-white">Currency Converter</span>
          {destCurrency && (
            <span className="text-xs text-slate-500">· auto-detected: {destCurrency}</span>
          )}
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="text-white/30 hover:text-white/60 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5">

        {/* Converter */}
        <div className="flex items-center gap-3 mb-5">

          {/* From */}
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1.5 block">Amount</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="flex-1 min-w-0 bg-[#334155] border border-white/10 focus:border-violet-500/50 focus:outline-none rounded-xl px-3 py-2.5 text-sm text-white"
                placeholder="100"
              />
              <select
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="bg-[#334155] border border-white/10 focus:border-violet-500/50 focus:outline-none rounded-xl px-2 py-2.5 text-sm text-white shrink-0"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            className="mt-5 p-2 rounded-full bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 border border-violet-500/20 transition-all shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          {/* To */}
          <div className="flex-1">
            <label className="text-xs text-slate-500 mb-1.5 block">Converted to</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#0f172a] border border-white/6 rounded-xl px-3 py-2.5 text-sm font-bold text-violet-400 min-w-0 truncate">
                {loading ? '…' : converted !== null ? formatAmount(converted, to) : '—'}
              </div>
              <select
                value={to}
                onChange={e => setTo(e.target.value)}
                className="bg-[#334155] border border-white/10 focus:border-violet-500/50 focus:outline-none rounded-xl px-2 py-2.5 text-sm text-white shrink-0"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Rate display */}
        {rate && (
          <div className="bg-[#0f172a] rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              1 {fromCur?.flag} {from} = {rate.toFixed(4)} {toCur?.flag} {to}
            </span>
            {lastUpdated && (
              <span className="text-xs text-slate-600">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* Popular pairs grid */}
        <div>
          <p className="text-xs text-slate-500 mb-2.5">1 {from} in other currencies</p>
          <div className="grid grid-cols-3 gap-2">
            {popularPairs.map(cur => {
              const r = rates?.[cur.code];
              return (
                <button
                  key={cur.code}
                  onClick={() => setTo(cur.code)}
                  className={`flex items-center justify-between bg-[#334155] hover:bg-[#3d4f6b] border rounded-xl px-3 py-2.5 transition-all text-left ${
                    to === cur.code ? 'border-violet-500/40' : 'border-white/6'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-white">{cur.flag} {cur.code}</p>
                    <p className="text-xs text-slate-400">{cur.label.split(' ')[0]}</p>
                  </div>
                  <p className="text-xs font-semibold text-violet-400">
                    {r ? (r >= 100 ? r.toFixed(0) : r.toFixed(2)) : '—'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
