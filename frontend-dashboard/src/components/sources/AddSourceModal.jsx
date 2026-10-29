import React, { useState } from 'react';
import {
  X,
  Globe,
  Sliders,
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Hash
} from 'lucide-react';
import { validateSourceUrl } from '../../api/sourcesApi';

export function AddSourceModal({ isOpen, onClose, onSubmit }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('website');
  const [maxPages, setMaxPages] = useState(50);
  const [maxDepth, setMaxDepth] = useState(3);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const check = validateSourceUrl(url);
    if (!check.valid) {
      setError(check.error);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        url: check.url,
        name: name.trim() || undefined,
        type,
        max_pages: maxPages,
        max_depth: maxDepth
      });
      // Reset form
      setUrl('');
      setName('');
      setMaxPages(50);
      setMaxDepth(3);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create knowledge source');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-surface-900 border border-slate-800 rounded-2xl glass-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add Knowledge Source</h3>
              <p className="text-xs text-slate-400">Crawl and vectorize documentation or website pages.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Root Website URL <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal lowercase">https://docs.example.com</span>
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.acmecorp.com"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          {/* Optional Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Source Name <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme API Docs"
              className="w-full glass-input px-3.5 py-2.5 rounded-xl text-xs"
            />
          </div>

          {/* Crawl Sliders */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5 p-3 rounded-xl bg-surface-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-brand-400" />
                  <span>Max Pages</span>
                </label>
                <span className="text-xs font-bold text-brand-400">{maxPages}</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={maxPages}
                onChange={(e) => setMaxPages(parseInt(e.target.value, 10))}
                className="w-full accent-brand-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Up to 200 pages</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-surface-950/60 border border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Crawl Depth</span>
                </label>
                <span className="text-xs font-bold text-indigo-400">{maxDepth} levels</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">Link depth limit</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Job...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Ingestion Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSourceModal;
