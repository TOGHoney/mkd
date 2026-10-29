import React from 'react';
import {
  X,
  MessageSquare,
  Clock,
  Globe,
  ExternalLink,
  Shield,
  Zap,
  CheckCircle2,
  User,
  Bot
} from 'lucide-react';
import { getLatencyBadge } from '../../api/widgetApi';

export function ConversationDetailModal({ conversation, onClose }) {
  if (!conversation) return null;

  const {
    session_id,
    user_ip = '127.0.0.1',
    origin = 'https://acmecorp.com',
    messages = [],
    latency_ms = 350,
    createdAt
  } = conversation;

  const latency = getLatencyBadge(latency_ms);

  // Mask IP for privacy (T-05-07)
  const anonymizedIp = user_ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.***.***');

  // Extract all citations from assistant messages
  const allCitations = messages.reduce((acc, m) => {
    if (m.citations && Array.isArray(m.citations)) {
      m.citations.forEach(c => {
        if (!acc.includes(c)) acc.push(c);
      });
    }
    return acc;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-900 border border-slate-800 rounded-2xl glass-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Conversation Session</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  {session_id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {new Date(createdAt).toLocaleString()} • Origin: <span className="text-slate-300 font-mono">{origin}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Telemetry Bar */}
        <div className="px-6 py-3 bg-surface-950/70 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Response Latency:</span>
            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold ${latency.class}`}>
              {latency.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Visitor IP:</span>
            <span className="font-mono text-[11px] text-slate-300">{anonymizedIp}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Grounded Citations:</span>
            <span className="text-emerald-400 font-bold">{allCitations.length} verified</span>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-surface-950/30">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-2 shadow-sm ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-sm'
                      : 'bg-surface-850 border border-slate-800 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Message Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-1">
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Verified Sources Referenced:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((cite, cIdx) => (
                          <a
                            key={cIdx}
                            href={cite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-950/80 border border-slate-700 hover:border-brand-500 text-[10px] font-mono text-brand-300 transition-colors"
                          >
                            <span className="truncate max-w-[200px]">{cite}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-surface-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-surface-950/60 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConversationDetailModal;
