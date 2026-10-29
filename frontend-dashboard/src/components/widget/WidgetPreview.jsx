import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  ExternalLink,
  Bot,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';

export function WidgetPreview({ settings }) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputVal, setInputVal] = useState('');

  const {
    bot_name = 'Acme Assistant',
    primary_color = '#6366f1',
    greeting_message = 'Hi there! Ask me anything about our product or docs.',
    placeholder_text = 'Type your question...',
    position = 'bottom-right',
    avatar_url = ''
  } = settings || {};

  const isLeft = position === 'bottom-left';

  return (
    <div className="relative w-full h-[640px] rounded-2xl overflow-hidden border border-slate-800 bg-surface-950 flex flex-col shadow-2xl select-none">
      {/* Browser Bar Frame */}
      <div className="h-9 bg-surface-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <div className="px-4 py-1 rounded-md bg-surface-950 border border-slate-800/80 text-[11px] font-mono text-slate-400 truncate max-w-xs">
          https://your-company.com
        </div>
        <div className="text-[10px] text-slate-400 font-medium">Live Canvas</div>
      </div>

      {/* Mock Host Website Content */}
      <div className="flex-1 p-8 overflow-hidden relative flex flex-col justify-between bg-gradient-to-b from-surface-900/30 to-surface-950">
        {/* Mock Header */}
        <div className="flex items-center justify-between border-b border-slate-800/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 font-bold text-xs">
              A
            </div>
            <span className="text-xs font-bold text-white tracking-tight">Acme Corporation</span>
          </div>
          <div className="flex gap-4 text-[11px] text-slate-400">
            <span>Features</span>
            <span>Documentation</span>
            <span>Pricing</span>
          </div>
        </div>

        {/* Mock Hero Body */}
        <div className="max-w-md my-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 text-[10px] font-semibold">
            <Sparkles className="w-3 h-3 text-brand-400" />
            <span>Interactive Widget Preview</span>
          </div>
          <h3 className="text-xl font-extrabold text-white tracking-tight leading-snug">
            Delivering Grounded AI Experiences on your website.
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Your website visitors can click the floating launcher below to ask support questions answered instantly from your indexed vector memories.
          </p>
        </div>

        {/* Mock Footer notes */}
        <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-4 border-t border-slate-800/40">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Shadow DOM Encapsulated — 0% CSS bleeding guaranteed</span>
        </div>

        {/* --- FLOATING CHAT WIDGET EMULATION --- */}
        <div
          className={`absolute bottom-6 flex flex-col items-${isLeft ? 'start' : 'end'} z-30 transition-all ${
            isLeft ? 'left-6' : 'right-6'
          }`}
        >
          {/* Chat Window Dialog */}
          {isOpen && (
            <div className="w-[330px] h-[460px] bg-surface-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Widget Header */}
              <div
                className="p-3.5 flex items-center justify-between text-white shrink-0 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${primary_color}, #1e1b4b)`
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {avatar_url ? (
                      <img src={avatar_url} alt={bot_name} className="w-full h-full object-cover" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold truncate max-w-[170px]">{bot_name}</h5>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online • Powered by AI</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message History Area */}
              <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs bg-surface-950/40">
                {/* Assistant Welcome Greeting */}
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: primary_color }}
                  >
                    AI
                  </div>
                  <div className="p-2.5 rounded-2xl rounded-tl-sm bg-surface-850 border border-slate-800 text-slate-200 text-[11px] leading-relaxed max-w-[85%] shadow-sm">
                    {greeting_message}
                  </div>
                </div>

                {/* Simulated User Question */}
                <div className="flex items-start justify-end gap-2">
                  <div
                    className="p-2.5 rounded-2xl rounded-tr-sm text-white text-[11px] leading-relaxed max-w-[85%] shadow-sm"
                    style={{ backgroundColor: primary_color }}
                  >
                    What features are included in your platform?
                  </div>
                </div>

                {/* Simulated Assistant Answer with Citations */}
                <div className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 text-[10px] font-bold"
                    style={{ backgroundColor: primary_color }}
                  >
                    AI
                  </div>
                  <div className="p-2.5 rounded-2xl rounded-tl-sm bg-surface-850 border border-slate-800 text-slate-200 text-[11px] leading-relaxed max-w-[85%] space-y-2 shadow-sm">
                    <p>
                      SuperMemory provides automated website crawling, private vector memory storage in Qdrant, and streaming RAG responses.
                    </p>
                    {/* Source Citations Pill Badges */}
                    <div className="pt-1.5 border-t border-slate-800 flex flex-wrap gap-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-950 border border-slate-700 text-[10px] text-brand-300 font-mono">
                        <span>docs › features</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Area */}
              <div className="p-2.5 border-t border-slate-800 bg-surface-900 shrink-0">
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-950 border border-slate-800 focus-within:border-brand-500">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder={placeholder_text}
                    className="flex-1 bg-transparent border-none text-[11px] text-slate-200 px-2 py-1 outline-none placeholder:text-slate-400"
                  />
                  <button
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-sm shrink-0 transition-transform active:scale-90"
                    style={{ backgroundColor: primary_color }}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Launcher FAB */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-13 h-13 p-3.5 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
            style={{
              backgroundColor: primary_color,
              boxShadow: `0 8px 30px -4px ${primary_color}80`
            }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WidgetPreview;
