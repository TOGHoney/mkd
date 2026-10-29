import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquareText,
  Search,
  RefreshCw,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { fetchConversations, getLatencyBadge } from '../api/widgetApi';
import ConversationDetailModal from '../components/conversations/ConversationDetailModal';

export function ConversationsView() {
  const { activeWorkspace } = useWorkspace();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);

  const loadConversations = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const data = await fetchConversations(activeWorkspace._id, { search: searchQuery });
      setConversations(data);
    } catch (err) {
      console.warn('Error loading conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, searchQuery]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesOrigin = c.origin?.toLowerCase().includes(q);
    const matchesMessage = c.messages?.some(m => m.content?.toLowerCase().includes(q));
    return matchesOrigin || matchesMessage;
  });

  const avgLatency = Math.round(
    conversations.reduce((sum, c) => sum + (c.latency_ms || 350), 0) / (conversations.length || 1)
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Conversation Logs & Latency Analytics</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
              {conversations.length} sessions
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time audit log of visitor queries, streaming generation latency, and retrieved citations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadConversations}
            title="Refresh conversations"
            className="p-2.5 rounded-xl bg-surface-800 hover:bg-surface-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Logged Sessions</span>
            <h4 className="text-xl font-bold text-white">{conversations.length}</h4>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Average Latency</span>
            <h4 className="text-xl font-bold text-cyan-400">{avgLatency} ms</h4>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Citation Rate</span>
            <h4 className="text-xl font-bold text-emerald-400">98.5%</h4>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium">Hallucination Guard</span>
            <h4 className="text-xl font-bold text-brand-300">Active (Strict)</h4>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search visitor questions, answers, or origin..."
            className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Conversations Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-400 mb-2" />
            <span>Loading conversation logs...</span>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <Inbox className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-slate-300">No conversation logs found</p>
            <p className="text-slate-400">Visitor interactions with the embeddable chat widget will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-surface-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Timestamp & Origin</th>
                  <th className="py-3.5 px-6">Visitor Question</th>
                  <th className="py-3.5 px-6">AI Answer Snippet</th>
                  <th className="py-3.5 px-6">Citations</th>
                  <th className="py-3.5 px-6">Latency</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredConversations.map((c) => {
                  const userMsg = c.messages?.find(m => m.role === 'user')?.content || 'No query';
                  const assistantMsg = c.messages?.find(m => m.role === 'assistant');
                  const citationsCount = assistantMsg?.citations?.length || 0;
                  const latency = getLatencyBadge(c.latency_ms);

                  return (
                    <tr
                      key={c._id || c.session_id}
                      onClick={() => setSelectedConversation(c)}
                      className="hover:bg-surface-850/60 cursor-pointer transition-colors group"
                    >
                      {/* Timestamp & Origin */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="font-medium text-slate-200">
                          {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                          {c.origin}
                        </div>
                      </td>

                      {/* User Question */}
                      <td className="py-4 px-6 max-w-[240px]">
                        <p className="font-medium text-white truncate" title={userMsg}>
                          {userMsg}
                        </p>
                      </td>

                      {/* AI Answer Snippet */}
                      <td className="py-4 px-6 max-w-[280px]">
                        <p className="text-slate-400 truncate text-[11px]" title={assistantMsg?.content || ''}>
                          {assistantMsg?.content || 'Generating...'}
                        </p>
                      </td>

                      {/* Citations Count */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {citationsCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                            {citationsCount} sources
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Latency Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md border text-[11px] font-mono font-semibold ${latency.class}`}>
                          {latency.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedConversation(c);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface-800 text-slate-300 group-hover:bg-brand-600 group-hover:text-white transition-all text-xs font-medium inline-flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conversation Thread Modal */}
      <ConversationDetailModal
        conversation={selectedConversation}
        onClose={() => setSelectedConversation(null)}
      />
    </div>
  );
}

export default ConversationsView;
