import assert from 'assert';
import { getScopedStyles, WIDGET_SCOPED_CSS } from '../src/styles.js';
import { createLauncherButton } from '../src/components/launcher.js';
import { createChatWindow } from '../src/components/chatWindow.js';
import { SuperMemoryChat } from '../src/widget.js';

// Simple DOM environment simulator for Node.js
class MockClassList {
  constructor() {
    this.classes = new Set();
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.children = [];
    this.attributes = new Map();
    this._innerHTML = '';
    this.style = {};
    this.listeners = new Map();
    this.scrollTop = 0;
    this.scrollHeight = 100;
  }
  get className() {
    return Array.from(this.classList.classes).join(' ');
  }
  set className(val) {
    this.classList.classes = new Set(val.split(' ').filter(Boolean));
  }
  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(val) {
    this._innerHTML = val;
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  insertBefore(newNode, refNode) {
    const idx = this.children.indexOf(refNode);
    if (idx !== -1) {
      this.children.splice(idx, 0, newNode);
    } else {
      this.children.push(newNode);
    }
    return newNode;
  }
  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  dispatchEvent(event) {
    const handlers = this.listeners.get(event.type) || [];
    for (const h of handlers) h(event);
  }
  click() {
    this.dispatchEvent({ type: 'click' });
  }
  querySelector(selector) {
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      const find = (el) => {
        if (el.classList && el.classList.contains(cls)) return el;
        for (const c of el.children) {
          const res = find(c);
          if (res) return res;
        }
        return null;
      };
      return find(this);
    }
    return new MockElement('div');
  }
}

global.document = {
  createElement: (tag) => new MockElement(tag)
};

async function runShadowDomTests() {
  console.log('--- Running Plan 04-01 Tests: Shadow DOM & UI Components ---');

  // Test 1: Scoped CSS Stylesheet (WIDG-02)
  console.log('Test 1: Scoped Shadow DOM stylesheet generation...');
  assert.ok(WIDGET_SCOPED_CSS.includes(':host'), 'Stylesheet must target :host');
  assert.ok(WIDGET_SCOPED_CSS.includes('z-index: 2147483647'), 'Stylesheet must enforce max z-index');
  assert.ok(WIDGET_SCOPED_CSS.includes('right: 24px'), 'Default position must be bottom-right');

  const leftStyles = getScopedStyles({ primaryColor: '#10B981', position: 'bottom-left' });
  assert.ok(leftStyles.includes('left: 24px'), 'Position bottom-left must align to left: 24px');
  assert.ok(leftStyles.includes('#10B981'), 'Custom primary color #10B981 must be injected');
  console.log('✓ Scoped stylesheet generation and theme overrides verified');

  // Test 2: Floating Launcher FAB (WIDG-03)
  console.log('Test 2: Floating Launcher button component...');
  let launcherToggled = false;
  let isOpenState = null;

  const launcher = createLauncherButton({
    primaryColor: '#2563EB',
    onToggle: (state) => {
      launcherToggled = true;
      isOpenState = state;
    }
  });

  assert.ok(launcher.element.classList.contains('sm-launcher-btn'), 'Launcher button must have sm-launcher-btn class');
  assert.strictEqual(launcher.element.classList.contains('sm-open'), false, 'Launcher must start closed');

  // Simulate click to open
  launcher.element.click();
  assert.strictEqual(launcherToggled, true, 'Clicking launcher should trigger onToggle callback');
  assert.strictEqual(isOpenState, true, 'First click should open launcher');
  assert.strictEqual(launcher.element.classList.contains('sm-open'), true, 'Launcher should have sm-open class');

  // Simulate click to close
  launcher.element.click();
  assert.strictEqual(isOpenState, false, 'Second click should close launcher');
  assert.strictEqual(launcher.element.classList.contains('sm-open'), false, 'sm-open class should be removed');
  console.log('✓ Launcher FAB click toggle functionality verified');

  // Test 3: Chat Window Component Layout (WIDG-03)
  console.log('Test 3: Chat Window component layout and messages...');
  let closedTriggered = false;
  let messageSent = null;

  const chat = createChatWindow({
    botName: 'InnoBrain Assistant',
    welcomeMessage: 'Hello from InnoBrain!',
    primaryColor: '#2563EB',
    onClose: () => { closedTriggered = true; },
    onSendMessage: (msg) => { messageSent = msg; }
  });

  assert.ok(chat.element.classList.contains('sm-chat-window'), 'Chat window must have sm-chat-window class');
  assert.ok(chat.element.classList.contains('sm-hidden'), 'Chat window must start hidden');

  // Open and close window
  chat.show();
  assert.strictEqual(chat.element.classList.contains('sm-hidden'), false, 'chat.show() should remove sm-hidden class');

  chat.hide();
  assert.strictEqual(chat.element.classList.contains('sm-hidden'), true, 'chat.hide() should add sm-hidden class');

  // Test message addition
  const userBubble = chat.addMessage('user', '<p>What is your pricing?</p>');
  assert.ok(userBubble.innerHTML.includes('What is your pricing?'), 'User message bubble should contain query');

  console.log('✓ Chat Window component and message flow verified');

  // Test 4: Custom Web Component Class Definition (WIDG-02)
  console.log('Test 4: SuperMemoryChat Web Component definition...');
  assert.ok(typeof SuperMemoryChat === 'function', 'SuperMemoryChat must be a constructor');

  const instance = new SuperMemoryChat();
  instance.attachShadow = function (options) {
    assert.strictEqual(options.mode, 'open', 'Shadow root must be created with mode: open');
    return new MockElement('shadow-root');
  };
  instance.getAttribute = function (attr) {
    if (attr === 'data-widget-key') return 'wk_live_test_sample';
    return null;
  };

  instance.connectedCallback();
  assert.ok(instance.shadow !== null, 'connectedCallback must initialize shadow root');
  assert.ok(instance.launcher !== null, 'connectedCallback must initialize launcher');
  assert.ok(instance.chatWindow !== null, 'connectedCallback must initialize chat window');
  console.log('✓ SuperMemoryChat attaches open Shadow Root and mounts child components');

  console.log('\n--- ALL PLAN 04-01 TESTS PASSED SUCCESSFULLY ---');
}

runShadowDomTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
