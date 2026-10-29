import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client, { getStoredWorkspaceId, setStoredWorkspaceId } from '../api/client';
import { useAuth } from './AuthContext';
import { DEFAULT_WIDGET_SETTINGS, DEMO_WORKSPACE } from '../constants';

export { DEFAULT_WIDGET_SETTINGS, DEMO_WORKSPACE };

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWorkspaces = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkspaces([]);
      setActiveWorkspace(null);
      return;
    }

    // Demo token handling
    if (token === 'demo_token_supermemory_2026') {
      setWorkspaces([DEMO_WORKSPACE]);
      setActiveWorkspace(DEMO_WORKSPACE);
      setStoredWorkspaceId(DEMO_WORKSPACE._id);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await client.get('/workspaces');
      const list = data?.workspaces || [];
      setWorkspaces(list);

      if (list.length > 0) {
        const storedId = getStoredWorkspaceId();
        const found = list.find(w => w._id === storedId) || list[0];
        setActiveWorkspace(found);
        setStoredWorkspaceId(found._id);
      } else {
        setActiveWorkspace(null);
      }
    } catch (err) {
      console.warn('[WorkspaceContext] Could not load workspaces from backend, fallback to demo:', err.message);
      setWorkspaces([DEMO_WORKSPACE]);
      setActiveWorkspace(DEMO_WORKSPACE);
      setStoredWorkspaceId(DEMO_WORKSPACE._id);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const selectWorkspace = useCallback((id) => {
    const found = workspaces.find(w => w._id === id);
    if (found) {
      setActiveWorkspace(found);
      setStoredWorkspaceId(id);
    }
  }, [workspaces]);

  const updateSettings = useCallback(async (settings) => {
    if (!activeWorkspace) return;

    if (token === 'demo_token_supermemory_2026') {
      const updated = {
        ...activeWorkspace,
        ...settings,
        widget_settings: {
          ...activeWorkspace.widget_settings,
          ...(settings.widget_settings || {})
        }
      };
      setActiveWorkspace(updated);
      setWorkspaces(prev => prev.map(w => w._id === updated._id ? updated : w));
      return updated;
    }

    try {
      const res = await client.patch(`/workspaces/${activeWorkspace._id}/settings`, settings, {
        workspaceId: activeWorkspace._id
      });
      if (res?.workspace) {
        setActiveWorkspace(res.workspace);
        setWorkspaces(prev => prev.map(w => w._id === res.workspace._id ? res.workspace : w));
      }
      return res.workspace;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [activeWorkspace, token]);

  const rotateKey = useCallback(async (type) => {
    if (!activeWorkspace) return;

    if (token === 'demo_token_supermemory_2026') {
      const newKey = type === 'api_key'
        ? `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
        : `wk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      const updated = {
        ...activeWorkspace,
        [type]: newKey
      };
      setActiveWorkspace(updated);
      setWorkspaces(prev => prev.map(w => w._id === updated._id ? updated : w));
      return updated;
    }

    try {
      const res = await client.post(`/workspaces/${activeWorkspace._id}/rotate-keys`, { type }, {
        workspaceId: activeWorkspace._id
      });
      const updated = {
        ...activeWorkspace,
        api_key: res.api_key,
        widget_key: res.widget_key
      };
      setActiveWorkspace(updated);
      setWorkspaces(prev => prev.map(w => w._id === updated._id ? updated : w));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [activeWorkspace, token]);

  const value = {
    workspaces,
    activeWorkspace,
    isLoading,
    error,
    loadWorkspaces,
    selectWorkspace,
    updateSettings,
    rotateKey
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}

export default WorkspaceContext;
