/**
 * Client for consuming Server-Sent Events (SSE) chat streams from the backend gateway.
 * Uses native fetch with ReadableStream for progressive typewriter rendering (WIDG-04).
 */

export async function streamWidgetChat({
  apiHost = 'http://localhost:5000',
  widgetKey,
  message,
  sessionId,
  onToken,
  onCitations,
  onDone,
  onError
} = {}) {
  const url = `${apiHost}/api/v1/widget/chat`;
  let fullAnswer = '';
  let citations = [];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-widget-key': widgetKey
      },
      body: JSON.stringify({
        message,
        session_id: sessionId
      })
    });

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch (_) {}

      if (typeof onError === 'function') onError(errorMsg, response.status);
      return;
    }

    if (!response.body) {
      if (typeof onError === 'function') onError('No streaming body returned');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      // Keep the last partial event chunk in the buffer
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();

            if (rawData === '[DONE]') {
              if (typeof onDone === 'function') {
                onDone({ fullText: fullAnswer, citations });
              }
              return;
            }

            try {
              const parsed = JSON.parse(rawData);

              if (parsed.token) {
                fullAnswer += parsed.token;
                if (typeof onToken === 'function') {
                  onToken(parsed.token, fullAnswer);
                }
              }

              if (parsed.citations && Array.isArray(parsed.citations)) {
                citations = parsed.citations;
                if (typeof onCitations === 'function') {
                  onCitations(citations);
                }
              }
            } catch (_) {
              // Non-JSON SSE event payload, ignore
            }
          }
        }
      }
    }

    // Finished stream
    if (typeof onDone === 'function') {
      onDone({ fullText: fullAnswer, citations });
    }
  } catch (err) {
    console.error('[SSE Client] Error:', err);
    if (typeof onError === 'function') {
      onError(err.message || 'Network error connecting to assistant');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    streamWidgetChat
  };
}
