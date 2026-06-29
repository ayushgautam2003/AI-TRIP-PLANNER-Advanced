'use client';
import { useState } from 'react';
import { MessageSquare, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '@/lib/api';

export default function ActivityComments({ tripId, dayIndex, activityIndex, comments = [], onUpdate }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const actComments = comments.filter(
    c => c.dayIndex === dayIndex && c.activityIndex === activityIndex
  );

  async function submit() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.post(`/api/trips/${tripId}/comments`, {
        dayIndex, activityIndex, text: text.trim(),
      });
      onUpdate(data.comments);
      setText('');
    } catch { /* silent */ } finally { setSaving(false); }
  }

  async function deleteComment(commentId) {
    try {
      const { data } = await api.delete(`/api/trips/${tripId}/comments/${commentId}`);
      onUpdate(data.comments);
    } catch { /* silent */ }
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        {actComments.length > 0 ? `${actComments.length} comment${actComments.length > 1 ? 's' : ''}` : 'Add note'}
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 bg-[#0f172a] rounded-xl p-3 space-y-2">
          {actComments.map(c => (
            <div key={c._id} className="flex items-start gap-2 group">
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-violet-400">
                  {c.userName?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/50">{c.userName}</p>
                <p className="text-xs text-white/70 leading-relaxed">{c.text}</p>
              </div>
              <button
                onClick={() => deleteComment(c._id)}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0 mt-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          <div className="flex gap-2 pt-1">
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Add a note…"
              className="flex-1 bg-[#1e293b] border border-white/8 focus:border-violet-500/40 focus:outline-none rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-600 transition-colors"
            />
            <button
              onClick={submit}
              disabled={!text.trim() || saving}
              className="p-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg transition-colors shrink-0"
            >
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
