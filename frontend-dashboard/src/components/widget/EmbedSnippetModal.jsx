import React, { useState } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Terminal
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { generateEmbedSnippet } from '../../api/widgetApi';

export function EmbedSnippetModal({ isOpen, onClose }) {
  const { activeWorkspace } = useWorkspace();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const snippet = generateEmbedSnippet(
    activeWorkspace?.widget_key || 'wk_live_sample_key',
    window.location.origin
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-surface-900 border border-slate-800 rounded-2xl glass-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Deploy Chat Widget</h3>
              <p className="text-xs text-slate-400">Single script embed for any website or web application.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Snippet Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-brand-400" />
                <span>HTML Embed Snippet</span>
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-surface-950 border border-slate-800 text-indigo-300 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
              {snippet}
            </pre>
          </div>

          {/* Quick Installation Steps */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              3-Step Installation Guide
            </h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-950/50 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-brand-500/30">
                  1
                </span>
                <p>
                  <strong className="text-slate-200">Copy the snippet:</strong> Click the copy button above to grab your personalized embed tag.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-950/50 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-brand-500/30">
                  2
                </span>
                <p>
                  <strong className="text-slate-200">Paste into HTML:</strong> Insert the tag immediately before the closing <code className="text-indigo-300 font-mono">&lt;/body&gt;</code> tag on your website or dashboard template.
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-950/50 border border-slate-800/80">
                <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold text-[10px] shrink-0 border border-brand-500/30">
                  3
                </span>
                <p>
                  <strong className="text-slate-200">Authorize your domain:</strong> Make sure your website hostname is whitelisted in <strong className="text-slate-200">Workspace Overview &gt; Allowed Domains</strong> to secure your widget key.
                </p>
              </div>
            </div>
          </div>

          {/* Shadow DOM Isolation Notice */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-brand-500/30 text-[11px] text-slate-300 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              The widget automatically mounts inside an isolated Shadow DOM container. It will never break or inherit styles from your site's CSS frameworks.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-surface-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmbedSnippetModal;
