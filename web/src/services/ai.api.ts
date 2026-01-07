import type { ChatContext, StreamEvent } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface StreamCallbacks {
  onEvent: (event: StreamEvent) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export const aiApi = {
  streamChat: (
    question: string,
    context: ChatContext,
    callbacks: StreamCallbacks
  ): AbortController => {
    const controller = new AbortController();

    fetch(`${API_BASE}/api/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');

          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6)) as StreamEvent;
                callbacks.onEvent(event);
              } catch {
              }
            }
          }
        }

        if (buffer.startsWith('data: ')) {
          try {
            const event = JSON.parse(buffer.slice(6)) as StreamEvent;
            callbacks.onEvent(event);
          } catch {
          }
        }

        callbacks.onComplete();
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          callbacks.onError(error);
        }
      });

    return controller;
  },
};
