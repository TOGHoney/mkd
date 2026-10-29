/**
 * Creates the floating action launcher button.
 */
export function createLauncherButton({ primaryColor = '#2563EB', onToggle } = {}) {
  const button = document.createElement('button');
  button.className = 'sm-launcher-btn';
  button.setAttribute('aria-label', 'Open support chat');
  button.setAttribute('type', 'button');

  // Chat Bubble SVG
  const chatSvg = `
    <svg class="sm-launcher-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

  // Close ('X') SVG
  const closeSvg = `
    <svg class="sm-close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;

  // Notification Dot Badge
  const badge = `
    <span class="sm-notification-badge" aria-hidden="true"></span>
  `;

  button.innerHTML = `${chatSvg}${closeSvg}${badge}`;

  let isOpen = false;

  button.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      button.classList.add('sm-open');
      button.setAttribute('aria-label', 'Close support chat');
      // Hide notification badge once opened
      const badgeEl = button.querySelector('.sm-notification-badge');
      if (badgeEl) badgeEl.style.display = 'none';
    } else {
      button.classList.remove('sm-open');
      button.setAttribute('aria-label', 'Open support chat');
    }

    if (typeof onToggle === 'function') {
      onToggle(isOpen);
    }
  });

  return {
    element: button,
    setOpen(open) {
      isOpen = open;
      if (isOpen) {
        button.classList.add('sm-open');
      } else {
        button.classList.remove('sm-open');
      }
    }
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createLauncherButton };
}
