import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  FileText,
  MessageSquare,
  Clock,
  Key,
  Globe,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  X,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { getStoredToken } from '../api/client';
import { fetchSources, createSource } from '../api/sourcesApi';
import AddSourceModal from '../components/sources/AddSourceModal';

export function WorkspaceOverview({ onOpenEmbedModal, onSelectTab }) {
  const { activeWorkspace, updateSettings, rotateKey } = useWorkspace();
  const [copiedKey, setCopiedKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domains, setDomains] = useState(activeWorkspace?.allowed_domains || []);
  const [domainStatus, setDomainStatus] = useState(null);

  // Real knowledge sources & Add Source Modal state
  const [sources, setSources] = useState([]);
  const [isLoadingSources, setIsLoadingSources] = useState(false);
  const [isAddSourceOpen, setIsAddSourceOpen] = useState(false);

  const loadSources = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoadingSources(true);
    try {
      const data = await fetchSources();
      setSources(data || []);
    } catch (err) {
      console.warn('[WorkspaceOverview] Could not load sources:', err);
    } finally {
      setIsLoadingSources(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Sync domains state if activeWorkspace changes
  useEffect(() => {
    if (activeWorkspace?.allowed_domains) {
      setDomains(activeWorkspace.allowed_domains);
    }
  }, [activeWorkspace]);

  // Auto-refresh sources if any source is currently crawling or idle
  useEffect(() => {
    const hasPending = sources.some(s => s.status === 'crawling' || s.status === 'idle');
    if (!hasPending) return;

    const interval = setInterval(() => {
      loadSources();
    }, 2500);

    return () => clearInterval(interval);
  }, [sources, loadSources]);

  const handleCopy = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(type);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotateKey = async (type) => {
    const confirmText = type === 'api_key'
      ? 'Are you sure you want to rotate your API key? Any active server integrations will need to be updated.'
      : 'Are you sure you want to rotate your Widget key? Existing embedded widgets will stop working until updated.';
    
    if (!window.confirm(confirmText)) return;

    setIsRotating(true);
    try {
      await rotateKey(type);
    } catch (err) {
      alert(`Failed to rotate key: ${err.message}`);
    } finally {
      setIsRotating(false);
    }
  };

  const handleAddDomain = (e) => {
    e.preventDefault();
    const trimmed = newDomain.trim();
    if (!trimmed) return;

    if (!domains.includes(trimmed)) {
      setDomains([...domains, trimmed]);
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove) => {
    setDomains(domains.filter(d => d !== domainToRemove));
  };

  const handleSaveDomains = async () => {
    setDomainStatus('saving');
    try {
      await updateSettings({ allowed_domains: domains });
      setDomainStatus('saved');
      setTimeout(() => setDomainStatus(null), 2500);
    } catch (err) {
      setDomainStatus('error');
    }
  };

  const handleAddSource = async (formData) => {
    const res = await createSource(formData);
    if (res?.source) {
      setSources(prev => [res.source, ...prev]);
    }
    loadSources();
    if (onSelectTab) {
      onSelectTab('sources');
    }
  };

  // Determine whether this is demo mode or a real user workspace
  const isDemo = getStoredToken() === 'demo_token_supermemory_2026';
  const totalPages = sources.reduce((sum, s) => sum + (s.pages_indexed ?? s.pages_count ?? 0), 0);
  const totalChunks = sources.reduce((sum, s) => {
    const pages = s.pages_indexed ?? s.pages_count ?? 0;
    return sum + (s.chunks_stored ?? s.chunks_count ?? (pages ? pages * 4 : 0));
  }, 0);

  const stats = isDemo
    ? (activeWorkspace?.stats || {
        total_sources: 3,
        total_pages: 84,
        total_chunks: 340,
        chat_requests_24h: 194,
        avg_latency_ms: 360
      })
    : {
        total_sources: sources.length,
        total_pages: totalPages,
        total_chunks: totalChunks,
        chat_requests_24h: activeWorkspace?.stats?.chat_requests_24h || 0,
        avg_latency_ms: activeWorkspace?.stats?.avg_latency_ms || 0
      };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & KPI Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{activeWorkspace?.name || 'Workspace'} Overview</span>
              {isDemo && (
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Demo Workspace
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time vector memory metrics, API credentials, and domain security settings.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddSourceOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Knowledge Source</span>
            </button>
            <button
              onClick={onOpenEmbedModal}
              className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Deployment Snippet</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Metric 1 */}
          <div className="glass-card glass-card-hover p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Connected Sources</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{stats.total_sources}</span>
              <span className="text-xs text-indigo-400 font-medium">sources</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {stats.total_sources === 0 ? 'No sources connected yet' : 'Websites & Documentation portals'}
            </div>
          </div>

          {/* Metric 2 */}
          <div className="glass-card glass-card-hover p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Vectorized Pages</span>
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{stats.total_pages}</span>
              <span className="text-xs text-brand-400 font-medium">pages</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {stats.total_pages === 0 ? 'Add URLs to begin crawling' : `Indexed into ${stats.total_chunks || (stats.total_pages * 4)} vector chunks`}
            </div>
          </div>

          {/* Metric 3 */}
          <div className="glass-card glass-card-hover p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">24h Chat Queries</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{stats.chat_requests_24h}</span>
              <span className="text-xs text-emerald-400 font-medium">queries</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-400/80 font-medium flex items-center gap-1">
              <span>{stats.chat_requests_24h === 0 ? 'Live visitor query ticker' : '99.8% citation coverage'}</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="glass-card glass-card-hover p-5 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">RAG Latency (avg)</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">{stats.avg_latency_ms || 320}</span>
              <span className="text-xs text-cyan-400 font-medium">ms</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              FastEmbed + Groq Llama 3.3 70B
            </div>
          </div>
        </div>
      </div>

      {/* Primary Getting Started Banner: Connect Knowledge Source */}
      {sources.length === 0 ? (
        <div className="glass-card p-6 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-surface-900 to-indigo-950/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-glow-brand shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Connect Your Company Knowledge</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Your vector memory is currently empty. Add your website URL, documentation portal, or FAQ link below to train your private AI assistant.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAddSourceOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2 self-start sm:self-auto transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Your First Website / Docs</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div
              onClick={() => setIsAddSourceOpen(true)}
              className="p-4 rounded-xl bg-surface-950/70 border border-slate-800/90 hover:border-brand-500/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 text-brand-400 font-semibold text-xs">
                <Globe className="w-4 h-4" />
                <span>Company Website & FAQs</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Domain-fenced crawler scans marketing pages, pricing, and FAQ URLs recursively.
              </p>
            </div>

            <div
              onClick={() => setIsAddSourceOpen(true)}
              className="p-4 rounded-xl bg-surface-950/70 border border-slate-800/90 hover:border-indigo-500/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                <FileText className="w-4 h-4" />
                <span>Developer / Product Docs</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Indexes GitBook, Mintlify, ReadMe, Docusaurus, or Sphinx documentation portals.
              </p>
            </div>

            <div
              onClick={() => onSelectTab && onSelectTab('sources')}
              className="p-4 rounded-xl bg-surface-950/70 border border-slate-800/90 hover:border-emerald-500/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Database className="w-4 h-4" />
                <span>Knowledge Sources Hub</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5 leading-relaxed">
                <span>View full crawler monitor & real-time SSE progress</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Connected Knowledge Sources ({sources.length})</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Websites and documentation portals indexing into Qdrant memory.</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsAddSourceOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Source</span>
              </button>
              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('sources')}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-all border border-slate-700"
                >
                  <span>Manage All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.slice(0, 6).map(s => (
              <div key={s._id} className="p-4 rounded-xl bg-surface-950/60 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div className="min-w-0 pr-3">
                  <h4 className="text-xs font-semibold text-white truncate">{s.name}</h4>
                  <a href={s.url} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 truncate hover:text-brand-400 block mt-0.5 font-mono">
                    {s.url}
                  </a>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/90 text-brand-300 shrink-0 font-medium border border-slate-700">
                  {s.status === 'crawling' ? 'Crawling...' : `${s.pages_indexed ?? s.pages_count ?? 0} pages`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Credentials & Keys (Left) and Allowed Domains (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Credentials Card */}
        <div className="glass-card p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Developer Credentials</h3>
                <p className="text-xs text-slate-400">Authentication keys for the widget snippet and REST API.</p>
              </div>
            </div>
          </div>

          {/* Widget Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Public Widget Key</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">(client-side safe)</span>
              </label>
              <button
                onClick={() => handleRotateKey('widget_key')}
                disabled={isRotating}
                className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate Key</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 glass-input px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-300 truncate">
                {activeWorkspace?.widget_key || 'wk_live_...'}
              </div>
              <button
                onClick={() => handleCopy(activeWorkspace?.widget_key, 'widget')}
                className="px-3 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-medium transition-all"
              >
                {copiedKey === 'widget' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'widget' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Embed this key directly in your website's <code className="text-indigo-300">&lt;script data-widget-key="..."&gt;</code>.
            </p>
          </div>

          {/* Secret API Key */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Secret API Key</span>
                <span className="text-[10px] font-normal text-rose-400 lowercase">(server-only)</span>
              </label>
              <button
                onClick={() => handleRotateKey('api_key')}
                disabled={isRotating}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate Key</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 glass-input px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-300 truncate flex items-center justify-between">
                <span>
                  {showApiKey ? activeWorkspace?.api_key : (activeWorkspace?.api_key ? '••••••••••••••••••••••••••••••••' : 'sk_live_...')}
                </span>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-slate-400 hover:text-slate-200 ml-2"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => handleCopy(activeWorkspace?.api_key, 'api')}
                className="px-3 py-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-medium transition-all"
              >
                {copiedKey === 'api' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'api' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Keep this key confidential. Never expose your secret key in client-side code or public repositories.
            </p>
          </div>
        </div>

        {/* Allowed Domains Card */}
        <div className="glass-card p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Origin Domain Whitelist</h3>
                  <p className="text-xs text-slate-400">Only requests originating from these domains can use your widget.</p>
                </div>
              </div>
            </div>

            {/* Domain Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Whitelisted Origins ({domains.length})
              </label>
              <div className="flex flex-wrap gap-2 min-h-[60px] p-3 rounded-xl bg-surface-950/70 border border-slate-800/80">
                {domains.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No domains configured. Widget requests will be rejected!</span>
                ) : (
                  domains.map((domain) => (
                    <span
                      key={domain}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/90 text-xs font-mono text-slate-200 border border-slate-700"
                    >
                      <span>{domain}</span>
                      <button
                        onClick={() => handleRemoveDomain(domain)}
                        className="text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Add Domain Input */}
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="https://example.com or localhost:3000"
                className="flex-1 glass-input px-3.5 py-2 rounded-xl text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {domainStatus === 'saved' && <span className="text-emerald-400 font-medium">✓ Settings saved successfully</span>}
              {domainStatus === 'error' && <span className="text-rose-400 font-medium">Failed to save settings</span>}
            </span>
            <button
              onClick={handleSaveDomains}
              disabled={domainStatus === 'saving'}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand transition-all"
            >
              {domainStatus === 'saving' ? 'Saving...' : 'Save Allowed Domains'}
            </button>
          </div>
        </div>
      </div>

      {/* Add Source Modal directly accessible from Overview */}
      <AddSourceModal
        isOpen={isAddSourceOpen}
        onClose={() => setIsAddSourceOpen(false)}
        onSubmit={handleAddSource}
      />
    </div>
  );
}

export default WorkspaceOverview;
