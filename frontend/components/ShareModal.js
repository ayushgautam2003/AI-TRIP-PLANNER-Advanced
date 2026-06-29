'use client';
import { useState } from 'react';
import { Share2, Copy, Check, X, Link, LinkIcon } from 'lucide-react';
import api from '@/lib/api';

export default function ShareModal({ tripId, initialToken, initialEnabled }) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(initialToken || null);
  const [enabled, setEnabled] = useState(initialEnabled || false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const shareUrl = token
    ? `${window?.location?.origin}/shared/${token}`
    : null;

  async function enable() {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/trips/${tripId}/share`);
      setToken(data.shareToken);
      setEnabled(true);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function disable() {
    setLoading(true);
    try {
      await api.delete(`/api/trips/${tripId}/share`);
      setEnabled(false);
    } catch { /* silent */ } finally { setLoading(false); }
  }

  function copy() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-white/45 hover:text-violet-400 text-xs font-semibold bg-[#334155] hover:bg-violet-500/10 border border-white/8 hover:border-violet-500/30 px-3 py-1.5 rounded-full transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">

            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-bold text-white">Share Trip</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-400">
                Anyone with the link can view your trip in read-only mode. They don't need an account.
              </p>

              {/* Toggle */}
              <div className="flex items-center justify-between bg-[#334155] rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-white">Public link</p>
                  <p className="text-xs text-slate-500 mt-0.5">{enabled ? 'Anyone with the link can view' : 'Link sharing is off'}</p>
                </div>
                <button
                  onClick={enabled ? disable : enable}
                  disabled={loading}
                  className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-violet-600' : 'bg-[#475569]'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Share URL */}
              {enabled && shareUrl && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#0f172a] border border-white/8 rounded-xl px-3 py-2.5 text-xs text-slate-400 truncate font-mono">
                      {shareUrl}
                    </div>
                    <button
                      onClick={copy}
                      className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                      }`}
                    >
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Disable the toggle above to revoke access.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
