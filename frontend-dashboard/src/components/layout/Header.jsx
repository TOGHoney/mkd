import React from 'react';
import {
  Code2,
  LogOut,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export function Header({ currentTab, onOpenEmbedModal }) {
  const { user, logout } = useAuth();
  const { activeWorkspace } = useWorkspace();

  const titles = {
    overview: 'Workspace Overview & Credentials',
    sources: 'Knowledge Sources & Crawlers',
    customizer: 'Widget Designer & Live Preview',
    conversations: 'Conversation Logs & Latency Analytics'
  };

  return (
    <header className="h-16 bg-surface-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-40">
      {/* Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">
            {titles[currentTab] || 'Dashboard'}
          </h1>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>{activeWorkspace?.name || 'Workspace'}</span>
            <span>/</span>
            <span className="capitalize">{currentTab}</span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* Engine Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>RAG Pipeline Ready</span>
        </div>

        {/* Get Embed Snippet button */}
        <button
          onClick={onOpenEmbedModal}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-glow-brand transition-all active:scale-95"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Embed Widget</span>
        </button>

        <div className="h-6 w-px bg-slate-800" />

        {/* User profile & logout */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold border border-indigo-400/40">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
              {user?.email || 'user@example.com'}
            </span>
          </div>
          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
