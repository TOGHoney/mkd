import React from 'react';
import {
  Globe,
  FileCode,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Database
} from 'lucide-react';

export function SourceCard({ source, onDelete }) {
  const isWebsite = source.type === 'website';

  const statusConfig = {
    idle: {
      label: 'Idle',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
      icon: Clock
    },
    queued: {
      label: 'Queued',
      badgeClass: 'bg-amber-950/40 text-amber-400 border-amber-500/30',
      icon: Clock
    },
    crawling: {
      label: 'Crawling & Vectorizing',
      badgeClass: 'bg-indigo-950/40 text-brand-400 border-brand-500/30',
      icon: Loader2,
      spin: true
    },
    completed: {
      label: 'Synced & Indexed',
      badgeClass: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30',
      icon: CheckCircle2
    },
    failed: {
      label: 'Crawl Failed',
      badgeClass: 'bg-rose-950/40 text-rose-400 border-rose-500/30',
      icon: AlertCircle
    }
  };

  const status = statusConfig[source.status] || statusConfig.idle;
  const StatusIcon = status.icon;

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600/20 to-indigo-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
            {isWebsite ? <Globe className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-white truncate max-w-[220px]" title={source.name}>
              {source.name}
            </h4>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-brand-400 flex items-center gap-1 transition-colors truncate max-w-[220px]"
              title={source.url}
            >
              <span className="truncate">{source.url}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => onDelete(source._id)}
          title="Delete knowledge source"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-surface-950/60 border border-slate-800/80">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Pages</span>
          <p className="text-xs font-semibold text-slate-200 mt-0.5">
            {source.pages_indexed || 0} pages
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Vectors</span>
          <p className="text-xs font-semibold text-brand-400 mt-0.5 flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>{source.chunks_stored || (source.pages_indexed ? source.pages_indexed * 4 : 0)} chunks</span>
          </p>
        </div>
      </div>

      {/* Footer Status & Sync Time */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
        <div className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 text-[11px] font-medium ${status.badgeClass}`}>
          <StatusIcon className={`w-3 h-3 ${status.spin ? 'animate-spin' : ''}`} />
          <span>{status.label}</span>
        </div>
        <span className="text-slate-400">
          Crawled {formatRelativeTime(source.last_crawled || source.createdAt)}
        </span>
      </div>
    </div>
  );
}

export default SourceCard;
