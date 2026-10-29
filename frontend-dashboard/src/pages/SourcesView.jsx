import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Database,
  Globe,
  FileText,
  Filter,
  RefreshCw,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import {
  fetchSources,
  createSource,
  deleteSource,
  subscribeJobProgress
} from '../api/sourcesApi';
import SourceCard from '../components/sources/SourceCard';
import AddSourceModal from '../components/sources/AddSourceModal';
import IngestionProgress from '../components/sources/IngestionProgress';

export function SourcesView() {
  const { activeWorkspace } = useWorkspace();
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);

  // Load sources
  const loadSources = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      console.warn('Error fetching sources:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  // Handle active job progress subscription
  useEffect(() => {
    if (!activeJob?.job_id) return;

    const unsubscribe = subscribeJobProgress(activeJob.job_id, {
      onProgress: (prog) => {
        setActiveJob(prev => ({
          ...prev,
          ...prog
        }));
      },
      onComplete: (result) => {
        setActiveJob(prev => ({
          ...prev,
          ...result,
          status: 'completed'
        }));
        // Reload sources after completion to reflect new page counts
        loadSources();
      },
      onError: () => {
        setActiveJob(prev => ({
          ...prev,
          status: 'failed'
        }));
      }
    });

    return unsubscribe;
  }, [activeJob?.job_id, loadSources]);

  const handleAddSource = async (formData) => {
    const res = await createSource(formData);
    if (res?.source) {
      setSources(prev => [res.source, ...prev]);
    }
    if (res?.job_id) {
      setActiveJob({
        job_id: res.job_id,
        status: 'crawling',
        pages_crawled: 0,
        total_chunks: 0,
        current_url: formData.url,
        target_pages: formData.max_pages
      });
    }
  };

  const handleDeleteSource = async (id) => {
    if (!window.confirm('Are you sure you want to delete this knowledge source and remove its vector memories?')) {
      return;
    }

    try {
      await deleteSource(id);
      setSources(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      alert(`Failed to delete source: ${err.message}`);
    }
  };

  // Filter sources
  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    return matchesSearch && s.status === filterType;
  });

  const totalPages = sources.reduce((sum, s) => sum + (s.pages_indexed || 0), 0);
  const totalChunks = sources.reduce((sum, s) => sum + (s.chunks_stored || (s.pages_indexed ? s.pages_indexed * 4 : 0)), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Knowledge Sources</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
              {sources.length} active
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Connect documentation portals, sitemaps, and guides into the private Qdrant vector memory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadSources}
            title="Refresh sources"
            className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Knowledge Source</span>
          </button>
        </div>
      </div>

      {/* Top Ingestion Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Total Sources</span>
            <h4 className="text-xl font-bold text-white">{sources.length} portals</h4>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Indexed Web Pages</span>
            <h4 className="text-xl font-bold text-white">{totalPages} pages</h4>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Qdrant Vector Memories</span>
            <h4 className="text-xl font-bold text-white">{totalChunks} embeddings</h4>
          </div>
        </div>
      </div>

      {/* Live Ingestion Progress (Rendered when job is active) */}
      {activeJob && (
        <IngestionProgress
          progress={activeJob}
          onDismiss={() => setActiveJob(null)}
        />
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sources by name or URL..."
            className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {['all', 'completed', 'crawling'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                filterType === type
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-500/40'
                  : 'bg-surface-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
          <span>Loading knowledge sources...</span>
        </div>
      ) : filteredSources.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-surface-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No knowledge sources found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? 'No sources matched your search query.'
                : 'Connect your company documentation, website, or FAQ to begin vector indexing.'}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-brand inline-flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Connect First Source</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSources.map((source) => (
            <SourceCard
              key={source._id}
              source={source}
              onDelete={handleDeleteSource}
            />
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSource}
      />
    </div>
  );
}

export default SourcesView;
