/**
 * Scoped stylesheet injected directly into the Shadow Root.
 * Completely immune to external host website styles and global resets.
 */
export function getScopedStyles({ primaryColor = '#2563EB', position = 'bottom-right' } = {}) {
  const isRight = position !== 'bottom-left';

  return `
    :host {
      all: initial;
      position: fixed;
      ${isRight ? 'right: 24px;' : 'left: 24px;'}
      bottom: 24px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #0f172a;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* Container wrapper */
    .sm-widget-container {
      position: relative;
      display: flex;
      flex-direction: column;
      ${isRight ? 'align-items: flex-end;' : 'align-items: flex-start;'}
    }

    /* Floating Launcher Button */
    .sm-launcher-btn {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: ${primaryColor};
      color: #ffffff;
      border: none;
      outline: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.2), 0 4px 10px -2px rgba(0, 0, 0, 0.1);
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease;
      position: relative;
      user-select: none;
    }

    .sm-launcher-btn:hover {
      transform: scale(1.06);
      box-shadow: 0 14px 28px -4px rgba(0, 0, 0, 0.25);
    }

    .sm-launcher-btn:active {
      transform: scale(0.96);
    }

    .sm-launcher-icon, .sm-close-icon {
      position: absolute;
      transition: opacity 0.2s ease, transform 0.25s ease;
    }

    .sm-launcher-btn.sm-open .sm-launcher-icon {
      opacity: 0;
      transform: rotate(90deg) scale(0.6);
    }

    .sm-launcher-btn.sm-open .sm-close-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .sm-launcher-btn:not(.sm-open) .sm-launcher-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .sm-launcher-btn:not(.sm-open) .sm-close-icon {
      opacity: 0;
      transform: rotate(-90deg) scale(0.6);
    }

    /* Notification Unread Dot */
    .sm-notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    /* Chat Window Dialog */
    .sm-chat-window {
      width: 380px;
      height: 580px;
      max-width: calc(100vw - 32px);
      max-height: calc(100vh - 104px);
      background: #ffffff;
      border-radius: 18px;
      box-shadow: 0 24px 48px -12px rgba(15, 23, 42, 0.25), 0 8px 16px -4px rgba(15, 23, 42, 0.08);
      border: 1px solid rgba(226, 232, 240, 0.9);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 16px;
      transform-origin: ${isRight ? 'bottom right' : 'bottom left'};
      transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s ease, visibility 0.22s;
    }

    .sm-chat-window.sm-hidden {
      opacity: 0;
      visibility: hidden;
      transform: scale(0.85) translateY(20px);
      pointer-events: none;
    }

    .sm-chat-window:not(.sm-hidden) {
      opacity: 1;
      visibility: visible;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }

    /* Chat Window Header */
    .sm-chat-header {
      background: ${primaryColor};
      color: #ffffff;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      user-select: none;
    }

    .sm-header-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sm-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 16px;
      border: 1.5px solid rgba(255, 255, 255, 0.4);
    }

    .sm-header-text h3 {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
      color: #ffffff;
    }

    .sm-status-indicator {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      opacity: 0.9;
    }

    .sm-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }

    .sm-header-close-btn {
      background: transparent;
      border: none;
      color: #ffffff;
      opacity: 0.8;
      cursor: pointer;
      display: flex;
      padding: 6px;
      border-radius: 6px;
      transition: opacity 0.15s ease, background 0.15s ease;
    }

    .sm-header-close-btn:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Message History Container */
    .sm-messages-list {
      flex: 1;
      overflow-y: auto;
      padding: 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f8fafc;
      scroll-behavior: smooth;
    }

    .sm-messages-list::-webkit-scrollbar {
      width: 5px;
    }

    .sm-messages-list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 4px;
    }

    /* Message Bubble Styles */
    .sm-message-row {
      display: flex;
      flex-direction: column;
      width: 100%;
    }

    .sm-message-row.sm-user {
      align-items: flex-end;
    }

    .sm-message-row.sm-assistant {
      align-items: flex-start;
    }

    .sm-bubble {
      padding: 10px 14px;
      font-size: 13.5px;
      line-height: 1.5;
      word-break: break-word;
      animation: smFadeIn 0.2s ease forwards;
    }

    .sm-user .sm-bubble {
      background: ${primaryColor};
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
      max-width: 82%;
    }

    .sm-assistant .sm-bubble {
      background: #ffffff;
      color: #0f172a;
      border-radius: 16px 16px 16px 4px;
      max-width: 88%;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    /* Markdown Formatted Elements inside Assistant Bubble */
    .sm-bubble p {
      margin-bottom: 8px;
    }
    .sm-bubble p:last-child {
      margin-bottom: 0;
    }
    .sm-bubble strong {
      font-weight: 600;
    }
    .sm-bubble em {
      font-style: italic;
    }
    .sm-bubble code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: #f1f5f9;
      padding: 2px 5px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }
    .sm-bubble pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 8px 0;
    }
    .sm-bubble pre code {
      background: transparent;
      color: inherit;
      border: none;
      padding: 0;
    }
    .sm-bubble ul, .sm-bubble ol {
      margin: 6px 0 6px 18px;
    }
    .sm-bubble a {
      color: ${primaryColor};
      text-decoration: underline;
      word-break: break-all;
    }

    /* Loading dots */
    .sm-typing-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 0;
    }

    .sm-typing-indicator span {
      width: 6px;
      height: 6px;
      background: #94a3b8;
      border-radius: 50%;
      animation: smBounce 1.4s infinite ease-in-out both;
    }

    .sm-typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .sm-typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

    /* Source Citation Badges */
    .sm-citations-container {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sm-citations-title {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sm-citations-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .sm-citation-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f1f5f9;
      color: #334155;
      text-decoration: none !important;
      font-size: 11.5px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 12px;
      border: 1px solid #cbd5e1;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sm-citation-pill:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
      color: ${primaryColor};
    }

    /* Chat Footer & Input */
    .sm-chat-footer {
      padding: 12px 14px;
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: flex-end;
      gap: 8px;
    }

    .sm-chat-input {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 9px 12px;
      font-size: 13.5px;
      line-height: 1.4;
      max-height: 100px;
      min-height: 38px;
      resize: none;
      outline: none;
      font-family: inherit;
      color: #0f172a;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .sm-chat-input:focus {
      border-color: ${primaryColor};
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .sm-send-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: ${primaryColor};
      color: #ffffff;
      border: none;
      outline: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.15s ease, transform 0.15s ease;
      flex-shrink: 0;
    }

    .sm-send-btn:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }

    .sm-send-btn:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    /* Powered by footer branding */
    .sm-branding-tag {
      text-align: center;
      font-size: 10.5px;
      color: #94a3b8;
      padding: 4px 0 8px 0;
      background: #ffffff;
      user-select: none;
    }

    /* Keyframe Animations */
    @keyframes smBounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    @keyframes smFadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}

export const WIDGET_SCOPED_CSS = getScopedStyles();

// CommonJS export fallback for test environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getScopedStyles,
    WIDGET_SCOPED_CSS
  };
}
