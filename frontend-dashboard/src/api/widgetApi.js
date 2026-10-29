import client, { getStoredToken } from './client.js';

export const DEMO_CONVERSATIONS = [
  {
    _id: 'conv_demo_01',
    session_id: 'sess_user_78192a',
    workspace_id: 'ws_demo_acme_corpHQ',
    user_ip: '203.0.113.42',
    origin: 'https://acmecorp.com',
    messages: [
      {
        role: 'user',
        content: 'How do I authenticate API requests with my secret key?',
        citations: []
      },
      {
        role: 'assistant',
        content: 'You can authenticate API requests by passing your API key in the `Authorization` header as a Bearer token: `Authorization: Bearer sk_live_...`. All REST requests must also include your target `x-workspace-id` header.',
        citations: [
          'https://docs.acmecorp.com/api/authentication',
          'https://docs.acmecorp.com/quickstart'
        ]
      }
    ],
    latency_ms: 340,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    _id: 'conv_demo_02',
    session_id: 'sess_user_99214b',
    workspace_id: 'ws_demo_acme_corpHQ',
    user_ip: '198.51.100.18',
    origin: 'https://acmecorp.com/pricing',
    messages: [
      {
        role: 'user',
        content: 'What is your refund policy for annual enterprise plans?',
        citations: []
      },
      {
        role: 'assistant',
        content: 'We offer a full 30-day money-back guarantee on all annual enterprise subscriptions. If you are not satisfied within your first 30 days, contact billing@acmecorp.com for an immediate refund.',
        citations: [
          'https://help.acmecorp.com/faq/billing-and-refunds'
        ]
      }
    ],
    latency_ms: 410,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    _id: 'conv_demo_03',
    session_id: 'sess_user_11843c',
    workspace_id: 'ws_demo_acme_corpHQ',
    user_ip: '192.0.2.89',
    origin: 'https://docs.acmecorp.com',
    messages: [
      {
        role: 'user',
        content: 'Can I restrict the embeddable chat widget to specific domain names?',
        citations: []
      },
      {
        role: 'assistant',
        content: 'Yes! SuperMemory enforces strict Origin/Referer domain whitelisting. In the Workspace Overview dashboard, add your allowed domains (e.g. `https://mycompany.com`). Requests from any unauthorized origin will be rejected with HTTP 403 Forbidden.',
        citations: [
          'https://docs.acmecorp.com/security/domain-whitelist',
          'https://docs.acmecorp.com/widget/embedding'
        ]
      }
    ],
    latency_ms: 620,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    _id: 'conv_demo_04',
    session_id: 'sess_user_66419d',
    workspace_id: 'ws_demo_acme_corpHQ',
    user_ip: '203.0.113.105',
    origin: 'https://acmecorp.com',
    messages: [
      {
        role: 'user',
        content: 'Does the chat widget support Server-Sent Events (SSE) streaming?',
        citations: []
      },
      {
        role: 'assistant',
        content: 'Yes, the widget connects to `POST /api/v1/widget/chat` using native `fetch` with `ReadableStream` to consume progressive SSE tokens with sub-second typewriter response rendering.',
        citations: [
          'https://docs.acmecorp.com/widget/streaming'
        ]
      }
    ],
    latency_ms: 290,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

/**
 * Validate hex color code format (#RRGGBB).
 */
export function isValidHexColor(color) {
  return /^#[0-9A-Fa-f]{6}$/i.test(color);
}

/**
 * Categorize latency into metric badge color classes.
 */
export function getLatencyBadge(latencyMs) {
  if (!latencyMs || latencyMs < 500) {
    return {
      label: `${latencyMs || 300}ms`,
      class: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30',
      status: 'fast'
    };
  }
  if (latencyMs < 1500) {
    return {
      label: `${latencyMs}ms`,
      class: 'bg-amber-950/40 text-amber-400 border-amber-500/30',
      status: 'moderate'
    };
  }
  return {
    label: `${latencyMs}ms`,
    class: 'bg-rose-950/40 text-rose-400 border-rose-500/30',
    status: 'slow'
  };
}

/**
 * Generate embed snippet tag.
 */
export function generateEmbedSnippet(widgetKey, apiHost = 'http://localhost:5000') {
  return `<script
  src="${apiHost}/dist/widget.js"
  data-widget-key="${widgetKey || 'wk_live_your_key'}"
  async
></script>`;
}

/**
 * Fetch visitor conversations for active workspace.
 */
export async function fetchConversations(workspaceId, { page = 1, limit = 20, search = '' } = {}) {
  try {
    const res = await client.get(`/conversations?page=${page}&limit=${limit}`, {
      workspaceId
    });
    return res?.conversations || [];
  } catch (err) {
    const token = getStoredToken();
    if (token === 'demo_token_supermemory_2026') {
      let filtered = DEMO_CONVERSATIONS;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.messages.some(m => m.content.toLowerCase().includes(q)) ||
          c.origin.toLowerCase().includes(q)
        );
      }
      return filtered;
    }
    console.warn('[widgetApi] Error fetching conversations:', err.message);
    return [];
  }
}

/**
 * Save customizer widget settings.
 */
export async function saveWidgetSettings(workspaceId, settings) {
  return await client.patch(`/workspaces/${workspaceId}/settings`, {
    widget_settings: settings
  }, {
    workspaceId
  });
}
