/**
 * Core Constants & Configuration Tokens for SuperMemory Dashboard
 */

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', iconName: 'LayoutDashboard' },
  { id: 'sources', label: 'Knowledge Sources', iconName: 'Database' },
  { id: 'customizer', label: 'Widget Customizer', iconName: 'Palette' },
  { id: 'conversations', label: 'Conversation Logs', iconName: 'MessageSquareText' },
];

export const DEFAULT_WIDGET_SETTINGS = {
  bot_name: 'Acme Assistant',
  primary_color: '#6366f1',
  greeting_message: 'Hi there! Ask me anything about our product, documentation, or pricing.',
  placeholder_text: 'Type your question...',
  position: 'bottom-right',
  avatar_url: ''
};

export const DEMO_WORKSPACE = {
  _id: 'ws_demo_acme_corpHQ',
  name: 'Acme Corporation HQ',
  owner_id: 'usr_demo_admin_2026',
  api_key: 'sk_live_98a7bc64e21f45d8b02e7751a4c9018e',
  widget_key: 'wk_live_55c1e3089d814be394a1d953f938217f',
  allowed_domains: ['https://acmecorp.com', 'http://localhost:3000', 'http://localhost:5173'],
  widget_settings: DEFAULT_WIDGET_SETTINGS,
  stats: {
    total_sources: 4,
    total_pages: 142,
    total_chunks: 588,
    chat_requests_24h: 326,
    avg_latency_ms: 385
  }
};

export const BRAND_COLOR_PRESETS = [
  { name: 'Indigo Brand', hex: '#6366f1' },
  { name: 'Royal Violet', hex: '#8b5cf6' },
  { name: 'Emerald AI', hex: '#10b981' },
  { name: 'Ocean Cyan', hex: '#06b6d4' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Amber Glow', hex: '#f59e0b' },
];
