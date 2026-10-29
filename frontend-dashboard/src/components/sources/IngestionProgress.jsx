import React from 'react';
import {
  Loader2,
  CheckCircle2,
  Sparkles,
  Database,
  FileText,
  Compass,
  X
} from 'lucide-react';

export function IngestionProgress({ progress, onDismiss }) {
  if (!progress) return null;

  const {
    job_id,
    status = 'crawling',
    pages_crawled = 0,
    total_chunks = 0,
    current_url = 'Discovering documentation tree...',
    target_pages = 50
  } = progress;

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';
  const percent = Math.min(100, Math.round((pages_crawled / (target_pages || 50)) * 100));

  const stages = [
    { label: 'Crawl', done: pages_crawled > 0 },
    { label: 'Extract & Clean', done: pages_crawled > 2 },
    { label: 'Chunk & Embed', done: total_chunks > 0 },
    { label: 'Qdrant Indexed', done: isCompleted }
  ];

  return (
    <div className={`p-6 rounded-2xl glass-card border transition-all duration-300 relative overflow-hidden ${
      isCompleted
        ? 'border-emerald-500/40 bg-emerald-950/20'
        : isFailed
        ? 'border-rose-500/40 bg-rose-950/20'
        : 'border-brand-500/40 bg-surface-900 shadow-glow-brand'
    }`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{isCompleted ? 'Ingestion Pipeline Complete' : 'AI Ingestion Pipeline Active'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {job_id || 'active_job'}
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              {isCompleted
                ? 'All pages crawled, vectorized with FastEmbed, and payload-indexed into Qdrant.'
                : 'Scraping dynamic pages, cleaning Markdown boilerplate, and generating 384-d vectors.'}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-300">Overall Progress</span>
          <span className={isCompleted ? 'text-emerald-400' : 'text-brand-400'}>{percent}%</span>
        </div>
        <div className="h-2 w-full bg-surface-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted
                ? 'bg-emerald-400 shadow-glow-emerald'
                : 'bg-gradient-to-r from-brand-600 to-indigo-400 shadow-glow-brand'
            }`}
            style={{ width: `${isCompleted ? 100 : percent}%` }}
          />
        </div>
      </div>

      {/* Pipeline Stages Stepper */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {stages.map((stage, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-xl text-center border text-[11px] font-medium transition-colors ${
              stage.done
                ? 'bg-brand-600/15 border-brand-500/40 text-brand-300'
                : 'bg-surface-950/40 border-slate-800 text-slate-400'
            }`}
          >
            <span>{stage.label}</span>
          </div>
        ))}
      </div>

      {/* Active URL & Metrics Footer */}
      <div className="p-3 rounded-xl bg-surface-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-hidden text-slate-400">
          <Compass className="w-3.5 h-3.5 text-brand-400 shrink-0 animate-pulse" />
          <span className="truncate font-mono text-[11px] text-slate-300">
            {current_url}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-slate-300 font-medium text-[11px]">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>{pages_crawled} pages</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span>{total_chunks} vectors</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default IngestionProgress;
