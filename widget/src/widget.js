import { getScopedStyles } from './styles.js';
import { createLauncherButton } from './components/launcher.js';
import { createChatWindow } from './components/chatWindow.js';

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class MockHTMLElement {};

export class SuperMemoryChat extends BaseElement {
  constructor() {
    super();
    this.shadow = null;
    this.launcher = null;
    this.chatWindow = null;
    this.styleEl = null;
    this.widgetKey = null;
    this.apiHost = 'http://localhost:5000';
    this.config = {
      botName: 'SuperMemory AI',
      welcomeMessage: 'Hi there! How can I help you today?',
      primaryColor: '#2563EB',
      position: 'bottom-right'
    };
  }

  connectedCallback() {
    // Prevent duplicate attachment
    if (this.shadow) return;

    this.widgetKey = this.getAttribute('data-widget-key') || '';
    this.apiHost = this.getAttribute('data-api-host') || 'http://localhost:5000';

    // 1. Attach native Shadow DOM in open mode (WIDG-02)
    this.shadow = this.attachShadow({ mode: 'open' });

    // 2. Inject Scoped CSS
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = getScopedStyles(this.config);
    this.shadow.appendChild(this.styleEl);

    // 3. Container Root
    const container = document.createElement('div');
    container.className = 'sm-widget-container';
    this.shadow.appendChild(container);

    // 4. Initialize Launcher & Chat Window (WIDG-03)
    this.launcher = createLauncherButton({
      primaryColor: this.config.primaryColor,
      onToggle: (isOpen) => {
        if (isOpen) {
          this.chatWindow.show();
        } else {
          this.chatWindow.hide();
        }
      }
    });

    this.chatWindow = createChatWindow({
      botName: this.config.botName,
      welcomeMessage: this.config.welcomeMessage,
      primaryColor: this.config.primaryColor,
      onClose: () => {
        this.launcher.setOpen(false);
        this.chatWindow.hide();
      },
      onSendMessage: (userText) => {
        this.handleUserMessage(userText);
      }
    });

    container.appendChild(this.chatWindow.element);
    container.appendChild(this.launcher.element);

    // 5. Fetch Remote Workspace Configuration if widgetKey is present
    if (this.widgetKey) {
      this.fetchRemoteConfig();
    }
  }

  async fetchRemoteConfig() {
    try {
      const url = `${this.apiHost}/api/v1/widget/config?widget_key=${encodeURIComponent(this.widgetKey)}`;
      const res = await fetch(url);
      if (!res.ok) return;

      const data = await res.json();
      if (data && data.widget_settings) {
        const s = data.widget_settings;
        this.config = {
          botName: s.bot_name || this.config.botName,
          welcomeMessage: s.welcome_message || this.config.welcomeMessage,
          primaryColor: s.primary_color || this.config.primaryColor,
          position: s.position || this.config.position
        };

        // Re-render stylesheet with updated brand color & position
        if (this.styleEl) {
          this.styleEl.textContent = getScopedStyles(this.config);
        }

        if (this.chatWindow) {
          this.chatWindow.updateConfig(this.config);
        }
      }
    } catch (err) {
      console.warn('[SuperMemoryWidget] Using default theme config:', err.message);
    }
  }

  handleUserMessage(userText) {
    // Dispatched to chat window; in Plan 04-02 this connects to SSE streaming client
    if (this._onMessageHook) {
      this._onMessageHook(userText);
    } else {
      // Default handler
      this.chatWindow.addMessage('user', `<p>${this.escapeText(userText)}</p>`);
      this.chatWindow.startAssistantStreaming();

      setTimeout(() => {
        this.chatWindow.updateAssistantBubble(
          `<p>Thank you for asking: "${this.escapeText(userText)}". Our knowledge base is ready to stream verified citations!</p>`
        );
        this.chatWindow.endAssistantStreaming();
      }, 400);
    }
  }

  escapeText(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// Register Custom Element
if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  if (!customElements.get('supermemory-chat')) {
    customElements.define('supermemory-chat', SuperMemoryChat);
  }

  // Self-mounting script for one-line customer embeds (<script src="widget.js" data-widget-key="...">)
  const initWidget = () => {
    if (document.querySelector('supermemory-chat')) return;

    // Look for active script tag with data-widget-key
    const currentScript =
      document.currentScript ||
      document.querySelector('script[data-widget-key]') ||
      document.querySelector('script[src*="widget.js"]');

    if (currentScript) {
      const widgetKey = currentScript.getAttribute('data-widget-key') || '';
      const apiHost = currentScript.getAttribute('data-api-host') || '';

      const widgetEl = document.createElement('supermemory-chat');
      if (widgetKey) widgetEl.setAttribute('data-widget-key', widgetKey);
      if (apiHost) widgetEl.setAttribute('data-api-host', apiHost);

      if (document.body) {
        document.body.appendChild(widgetEl);
      } else {
        document.addEventListener('DOMContentLoaded', () => {
          document.body.appendChild(widgetEl);
        });
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SuperMemoryChat };
}
