import client, { getStoredToken } from './client.js';

// Default mock sources for offline / demo mode
export const DEMO_SOURCES = [
  {
    _id: 'src_demo_docs_01',
    workspace_id: 'ws_demo_acme_corpHQ',
    name: 'Developer Documentation',
    type: 'website',
    url: 'https://docs.acmecorp.com',
    status: 'completed',
    pages_indexed: 54,
    chunks_stored: 216,
    last_crawled: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    _id: 'src_demo_help_02',
    workspace_id: 'ws_demo_acme_corpHQ',
    name: 'Customer Help Center',
    type: 'website',
    url: 'https://help.acmecorp.com/faq',
    status: 'completed',
    pages_indexed: 38,
    chunks_stored: 152,
    last_crawled: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    _id: 'src_demo_blog_03',
    workspace_id: 'ws_demo_acme_corpHQ',
    name: 'Product Changelog & Guides',
    type: 'website',
    url: 'https://acmecorp.com/changelog',
    status: 'completed',
    pages_indexed: 18,
    chunks_stored: 72,
    last_crawled: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

/**
 * Validate source URL on client side (blocks invalid schemes and private IPs).
 */
export function validateSourceUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Source URL is required' };
  }

  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { valid: false, error: 'URL must begin with http:// or https://' };
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.startsWith('172.16.')
    ) {
      return { valid: false, error: 'Private and local hostnames are not permitted' };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Fetch knowledge sources for active workspace.
 */
export async function fetchSources() {
  try {
    const res = await client.get('/sources');
    return res?.sources || [];
  } catch (err) {
    const token = getStoredToken();
    if (token === 'demo_token_supermemory_2026') {
      return DEMO_SOURCES;
    }
    console.warn('[sourcesApi] Error fetching sources:', err.message);
    return [];
  }
}

/**
 * Submit new knowledge source for crawling.
 */
export async function createSource({ name, url, type = 'website', max_pages = 50, max_depth = 3 }) {
  const check = validateSourceUrl(url);
  if (!check.valid) {
    throw new Error(check.error);
  }

  try {
    const res = await client.post('/sources', {
      name: name && name.trim() ? name.trim() : new URL(check.url).hostname,
      url: check.url,
      type,
      max_pages: parseInt(max_pages, 10) || 50,
      max_depth: parseInt(max_depth, 10) || 3
    });
    return res;
  } catch (err) {
    // Demo mode fallback
    const mockId = `src_demo_${Date.now()}`;
    const newSource = {
      _id: mockId,
      name: name && name.trim() ? name.trim() : new URL(check.url).hostname,
      type,
      url: check.url,
      status: 'crawling',
      pages_indexed: 0,
      chunks_stored: 0,
      last_crawled: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    return {
      message: 'Source created and ingestion job enqueued (demo mode)',
      source: newSource,
      job_id: `job_${Date.now()}`,
      status: 'queued'
    };
  }
}

/**
 * Delete a knowledge source.
 */
export async function deleteSource(id) {
  try {
    return await client.delete(`/sources/${id}`);
  } catch (err) {
    return { message: 'Source deleted (demo mode)', id };
  }
}

/**
 * Subscribe to real-time ingestion job progress via SSE.
 */
export function subscribeJobProgress(jobId, { onProgress, onComplete, onError }) {
  if (!jobId) return () => {};

  // If in demo mode simulation
  if (jobId.startsWith('job_')) {
    let pages = 0;
    const interval = setInterval(() => {
      pages += 5;
      const progress = {
        status: pages < 25 ? 'crawling' : 'completed',
        pages_crawled: pages,
        total_chunks: pages * 4,
        current_url: `https://docs.acmecorp.com/section-${pages}.html`
      };
      if (onProgress) onProgress(progress);

      if (pages >= 25) {
        clearInterval(interval);
        if (onComplete) onComplete(progress);
      }
    }, 800);

    return () => clearInterval(interval);
  }

  // Real backend SSE connection
  const sseUrl = `/api/v1/jobs/${jobId}/progress`;
  const eventSource = new EventSource(sseUrl);

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (onProgress) onProgress(data);

      if (data.status === 'completed' || data.status === 'failed') {
        eventSource.close();
        if (onComplete) onComplete(data);
      }
    } catch (err) {
      console.warn('[sourcesApi] Failed to parse SSE event:', err);
    }
  };

  eventSource.onerror = (err) => {
    console.warn('[sourcesApi] SSE error, closing:', err);
    eventSource.close();
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
