import React from 'react';
import {
  LayoutDashboard,
  Database,
  Palette,
  MessageSquareText,
  Sparkles,
  ChevronDown,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { NAV_ITEMS } from '../../constants';

const ICON_MAP = {
  LayoutDashboard,
  Database,
  Palette,
  MessageSquareText
};

export function Sidebar({ currentTab, onSelectTab, onOpenEmbedModal }) {
  const { workspaces, activeWorkspace, selectWorkspace } = useWorkspace();

  return (
    <aside className="w-64 bg-surface-900 border-r border-slate-800/80 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center shadow-glow-brand shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
            SuperMemory <span className="text-xs px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">AI</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">Enterprise Knowledge RAG</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Platform
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600/15 text-brand-300 border border-brand-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-glow-brand" />
              )}
            </button>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Integration
        </div>
        <button
          onClick={onOpenEmbedModal}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all border border-slate-800"
        >
          <span className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Get Embed Snippet
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </nav>

      {/* Workspace Switcher Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-surface-950/40">
        <div className="relative group">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800/90 text-left">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center shrink-0 border border-slate-700">
                <Building2 className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-slate-200 truncate">
                  {activeWorkspace?.name || 'Default Workspace'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  ID: {activeWorkspace?._id?.substring(0, 10)}...
                </span>
              </div>
            </div>
            {workspaces.length > 1 && (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </div>

          {workspaces.length > 1 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 p-1.5 bg-surface-900 border border-slate-800 rounded-xl shadow-xl hidden group-hover:block z-50">
              <div className="px-2 py-1 text-[11px] font-semibold text-slate-400">Switch Workspace</div>
              {workspaces.map((w) => (
                <button
                  key={w._id}
                  onClick={() => selectWorkspace(w._id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate flex items-center justify-between ${
                    w._id === activeWorkspace?._id
                      ? 'bg-brand-600/20 text-brand-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{w.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
