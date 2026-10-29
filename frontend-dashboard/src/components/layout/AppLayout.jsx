import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import Sidebar from './Sidebar';
import Header from './Header';
import WorkspaceOverview from '../../pages/WorkspaceOverview';
import LoginModal from '../../pages/LoginModal';
import SourcesView from '../../pages/SourcesView';
import WidgetCustomizer from '../../pages/WidgetCustomizer';
import ConversationsView from '../../pages/ConversationsView';
import EmbedSnippetModal from '../widget/EmbedSnippetModal';

export function AppLayout({
  activeTab = 'overview',
  views = {}
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [embedModalOpen, setEmbedModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Loading SuperMemory AI...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal />;
  }

  return (
    <div className="flex min-h-screen bg-surface-950 text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenEmbedModal={() => setEmbedModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentTab={currentTab}
          onOpenEmbedModal={() => setEmbedModalOpen(true)}
        />

        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === 'overview' && (
            <WorkspaceOverview
              onOpenEmbedModal={() => setEmbedModalOpen(true)}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'sources' && (
            <SourcesView />
          )}

          {currentTab === 'customizer' && (
            <WidgetCustomizer onOpenEmbedModal={() => setEmbedModalOpen(true)} />
          )}

          {currentTab === 'conversations' && (
            <ConversationsView />
          )}
        </main>
      </div>

      {/* Embed Modal */}
      <EmbedSnippetModal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
      />
    </div>
  );
}

export default AppLayout;
