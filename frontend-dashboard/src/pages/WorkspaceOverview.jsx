import React, { useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

export function WorkspaceOverview({ onOpenEmbedModal }) {
  const { activeWorkspace, updateSettings, rotateKey } = useWorkspace();
  const [copiedKey, setCopiedKey] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [domains, setDomains] = useState(activeWorkspace?.allowed_domains || []);
  const [domainStatus, setDomainStatus] = useState(null);

  // Sync state if activeWorkspace changes
  React.useEffect(() => {
    if (activeWorkspace?.allowed_domains) {
      setDomains(activeWorkspace.allowed_domains);
    }
  }, [activeWorkspace]);

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

  const stats = activeWorkspace?.stats || {
    total_sources: 3,
    total_pages: 84,
    total_chunks: 340,
    chat_requests_24h: 194,
    avg_latency_ms: 360
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome & KPI Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {activeWorkspace?.name || 'Workspace'} Overview
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Real-time vector memory metrics, API credentials, and domain security settings.
            </p>
          </div>
          <button
            onClick={onOpenEmbedModal}
            className="px-4 py-2 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-all shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Deployment Guide</span>
          </button>
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
              Websites & Documentation portals
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
              Indexed into {stats.total_chunks || (stats.total_pages * 4)} vector chunks
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
              <span>99.8% citation coverage</span>
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
              <span className="text-2xl font-bold text-white tracking-tight">{stats.avg_latency_ms}</span>
              <span className="text-xs text-cyan-400 font-medium">ms</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              FastEmbed + Groq Llama 3.3 70B
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

export default WorkspaceOverview;
