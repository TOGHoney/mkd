/**
 * Creates the chat window dialog component.
 */
export function createChatWindow({
  botName = 'SuperMemory AI',
  welcomeMessage = 'Hi there! How can I help you today?',
  primaryColor = '#2563EB',
  onClose,
  onSendMessage
} = {}) {
  const windowEl = document.createElement('div');
  windowEl.className = 'sm-chat-window sm-hidden';
  windowEl.setAttribute('role', 'dialog');
  windowEl.setAttribute('aria-label', `${botName} Support Window`);

  // 1. Header
  const firstLetter = botName ? botName.charAt(0).toUpperCase() : 'A';
  const headerHtml = `
    <div class="sm-chat-header">
      <div class="sm-header-info">
        <div class="sm-avatar">${firstLetter}</div>
        <div class="sm-header-text">
          <h3 class="sm-bot-name">${botName}</h3>
          <div class="sm-status-indicator">
            <span class="sm-status-dot"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
      <button class="sm-header-close-btn" type="button" aria-label="Close chat window">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;

  // 2. Messages List
  const messagesList = document.createElement('div');
  messagesList.className = 'sm-messages-list';
  messagesList.setAttribute('role', 'log');
  messagesList.setAttribute('aria-live', 'polite');

  // 3. Footer & Input
  const footerHtml = `
    <div class="sm-chat-footer">
      <textarea
        class="sm-chat-input"
        placeholder="Ask a question..."
        rows="1"
        aria-label="Your question"
      ></textarea>
      <button class="sm-send-btn" type="button" aria-label="Send message" disabled>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
      </button>
    </div>
    <div class="sm-branding-tag">
      Powered by <strong>SuperMemory AI</strong>
    </div>
  `;

  windowEl.innerHTML = `${headerHtml}${footerHtml}`;
  windowEl.insertBefore(messagesList, windowEl.querySelector('.sm-chat-footer'));

  // Wire Close Button
  const closeBtn = windowEl.querySelector('.sm-header-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof onClose === 'function') onClose();
    });
  }

  // Wire Input & Send Button
  const textarea = windowEl.querySelector('.sm-chat-input');
  const sendBtn = windowEl.querySelector('.sm-send-btn');

  const handleInput = () => {
    if (!textarea || !sendBtn) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    sendBtn.disabled = !textarea.value.trim();
  };

  if (textarea && sendBtn) {
    textarea.addEventListener('input', handleInput);

    const submitCurrentMessage = () => {
      const text = textarea.value.trim();
      if (!text) return;
      textarea.value = '';
      textarea.style.height = '38px';
      sendBtn.disabled = true;

      if (typeof onSendMessage === 'function') {
        onSendMessage(text);
      }
    };

    sendBtn.addEventListener('click', submitCurrentMessage);

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitCurrentMessage();
      }
    });
  }

  // Helper to scroll messages to bottom
  const scrollToBottom = () => {
    messagesList.scrollTop = messagesList.scrollHeight;
  };

  // Helper to add a message bubble
  const addMessage = (role, textHtml) => {
    const row = document.createElement('div');
    row.className = `sm-message-row sm-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'sm-bubble';
    bubble.innerHTML = textHtml;

    row.appendChild(bubble);
    messagesList.appendChild(row);
    scrollToBottom();
    return bubble;
  };

  // Add initial greeting message
  if (welcomeMessage) {
    addMessage('assistant', `<p>${welcomeMessage}</p>`);
  }

  // Active assistant message tracking during streaming
  let currentStreamingBubble = null;

  return {
    element: windowEl,
    show() {
      windowEl.classList.remove('sm-hidden');
      if (textarea && typeof textarea.focus === 'function') {
        setTimeout(() => textarea.focus(), 150);
      }
      scrollToBottom();
    },
    hide() {
      windowEl.classList.add('sm-hidden');
    },
    addMessage,
    startAssistantStreaming() {
      const row = document.createElement('div');
      row.className = 'sm-message-row sm-assistant';

      const bubble = document.createElement('div');
      bubble.className = 'sm-bubble';
      bubble.innerHTML = `
        <div class="sm-typing-indicator" aria-label="Thinking...">
          <span></span><span></span><span></span>
        </div>
      `;

      row.appendChild(bubble);
      messagesList.appendChild(row);
      scrollToBottom();
      currentStreamingBubble = bubble;
      return bubble;
    },
    updateAssistantBubble(contentHtml) {
      if (currentStreamingBubble) {
        currentStreamingBubble.innerHTML = contentHtml;
        scrollToBottom();
      }
    },
    endAssistantStreaming(citationsContainer) {
      if (currentStreamingBubble && citationsContainer) {
        currentStreamingBubble.appendChild(citationsContainer);
        scrollToBottom();
      }
      currentStreamingBubble = null;
    },
    updateConfig({ botName: newName, welcomeMessage: newGreeting }) {
      if (newName) {
        const titleEl = windowEl.querySelector('.sm-bot-name');
        const avatarEl = windowEl.querySelector('.sm-avatar');
        if (titleEl) titleEl.textContent = newName;
        if (avatarEl) avatarEl.textContent = newName.charAt(0).toUpperCase();
      }
    },
    scrollToBottom
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createChatWindow };
}
