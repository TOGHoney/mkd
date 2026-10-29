/**
 * Lightweight, zero-dependency streaming Markdown renderer and XSS sanitizer.
 * Guarantees that untrusted web content and LLM outputs cannot inject arbitrary scripts.
 */

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderMarkdown(rawText) {
  if (!rawText) return '';

  // 1. First escape all raw HTML to eliminate XSS (T-04-03)
  let text = escapeHtml(rawText);

  // 2. Fenced Code Blocks (```lang\ncode\n```)
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
  });

  // 3. Inline Code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 4. Bold (**text** or __text__)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>');

  // 5. Italic (*text* or _text_)
  text = text.replace(/(\*|_)(.*?)\1/g, '<em>$2</em>');

  // 6. Links [label](url) with safe scheme check
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
    const cleanUrl = url.trim();
    // Strictly disallow javascript:, data:, vbscript:
    if (/^(https?:\/\/|\/|#)/i.test(cleanUrl)) {
      return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    }
    return label;
  });

  // 7. Unordered Lists (- item or * item)
  const lines = text.split('\n');
  const formattedLines = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bulletMatch = line.match(/^\s*[-*]\s+(.*)$/);

    if (bulletMatch) {
      if (!inList) {
        formattedLines.push('<ul>');
        inList = true;
      }
      formattedLines.push(`<li>${bulletMatch[1]}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      formattedLines.push(line);
    }
  }

  if (inList) {
    formattedLines.push('</ul>');
  }

  text = formattedLines.join('\n');

  // 8. Paragraphs & Line Breaks
  // Split by double newline into paragraphs
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      // Don't wrap pre or ul in p
      if (trimmed.startsWith('<pre') || trimmed.startsWith('<ul')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(Boolean)
    .join('');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    renderMarkdown
  };
}
