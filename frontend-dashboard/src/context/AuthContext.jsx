import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client, { getStoredToken, setStoredToken, setStoredWorkspaceId } from '../api/client';

const AuthContext = createContext(null);

export const DEMO_USER = {
  id: 'usr_demo_admin_2026',
  email: 'admin@acmecorp.com',
  name: 'Acme Admin'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and verify session
  useEffect(() => {
    async function initAuth() {
      const stored = getStoredToken();
      if (!stored) {
        setIsLoading(false);
        return;
      }

      // Check if it's the demo token
      if (stored === 'demo_token_supermemory_2026') {
        setUser(DEMO_USER);
        setIsLoading(false);
        return;
      }

      try {
        const data = await client.get('/auth/me');
        if (data?.user) {
          setUser(data.user);
        } else {
          setStoredToken(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('[AuthContext] Session expired or server unavailable, clearing token:', err.message);
        setStoredToken(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await client.post('/auth/login', { email, password });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.workspace?._id) {
        setStoredWorkspaceId(res.workspace._id);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async ({ email, password, company_name, name }) => {
    setIsLoading(true);
    setError(null);
    try {
      const displayName = company_name || name;
      const res = await client.post('/auth/register', {
        email,
        password,
        name: displayName,
        company_name: displayName
      });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.workspace?._id) {
        setStoredWorkspaceId(res.workspace._id);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const demoLogin = useCallback(() => {
    const demoToken = 'demo_token_supermemory_2026';
    setStoredToken(demoToken);
    setToken(demoToken);
    setUser(DEMO_USER);
    setStoredWorkspaceId('ws_demo_acme_corpHQ');
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setStoredWorkspaceId(null);
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    demoLogin,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
