/**
 * SuperMemory Dashboard API Client
 */

const TOKEN_KEY = 'supermemory_jwt_token';
const WORKSPACE_KEY = 'supermemory_active_workspace_id';

export function getStoredToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function getStoredWorkspaceId() {
  try {
    return localStorage.getItem(WORKSPACE_KEY);
  } catch {
    return null;
  }
}

export function setStoredWorkspaceId(id) {
  try {
    if (id) {
      localStorage.setItem(WORKSPACE_KEY, id);
    } else {
      localStorage.removeItem(WORKSPACE_KEY);
    }
  } catch {}
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

/**
 * Perform authenticated API request.
 */
export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const workspaceId = options.workspaceId || getStoredWorkspaceId();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (workspaceId) {
    headers['x-workspace-id'] = workspaceId;
  }

  const path = `/api/v1${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const client = {
  get: (url, options) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiRequest(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options) => apiRequest(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body, options) => apiRequest(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url, options) => apiRequest(url, { ...options, method: 'DELETE' })
};

export default client;
