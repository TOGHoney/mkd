/**
 * Creates clickable source citation badge pills (WIDG-05).
 */

export function formatCitationLabel(urlString) {
  try {
    const url = new URL(urlString);
    let path = url.pathname.replace(/^\/|\/$/g, '');
    if (!path) return url.hostname;

    // e.g. "docs/pricing/enterprise" -> "docs › pricing"
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 2) {
      return `${parts[0]} › ${parts[parts.length - 1]}`;
    }
    return parts.join(' › ');
  } catch {
    return urlString.replace(/^https?:\/\//, '').split('/')[0];
  }
}

export function createCitationBadges(citationsList = []) {
  if (!citationsList || citationsList.length === 0) return null;

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(citationsList)).filter((url) => {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  });

  if (uniqueUrls.length === 0) return null;

  const container = document.createElement('div');
  container.className = 'sm-citations-container';

  const title = document.createElement('div');
  title.className = 'sm-citations-title';
  title.textContent = 'Sources:';
  container.appendChild(title);

  const list = document.createElement('div');
  list.className = 'sm-citations-list';

  uniqueUrls.forEach((url, idx) => {
    const pill = document.createElement('a');
    pill.className = 'sm-citation-pill';
    pill.setAttribute('href', url);
    pill.setAttribute('target', '_blank');
    pill.setAttribute('rel', 'noopener noreferrer');
    pill.setAttribute('title', url);

    const linkSvg = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
      </svg>
    `;

    pill.innerHTML = `[${idx + 1}] ${linkSvg}<span>${formatCitationLabel(url)}</span>`;
    list.appendChild(pill);
  });

  container.appendChild(list);
  return container;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCitationBadges,
    formatCitationLabel
  };
}
