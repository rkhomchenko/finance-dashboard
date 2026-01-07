import { useReducer, useCallback, useRef } from 'react';
import { aiApi } from '@/services';
import type { ChatContext, StreamEvent, ChartConfig } from '@/types';

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  status: 'running' | 'complete';
  result?: Record<string, unknown>;
}

interface ChartItem {
  title: string;
  chartConfig: ChartConfig;
}

interface StreamingMessage {
  id: string;
  textContent: string;
  toolCalls: ToolCall[];
  charts: ChartItem[];
  thinking: string | null;
  hasError: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'text' | 'chart';
  content?: string;
  title?: string;
  chartConfig?: ChartConfig;
}

interface ChatState {
  messages: Message[];
  streamingMessage: StreamingMessage | null;
  isProcessing: boolean;
  addedPanels: string[];
}

type ChatAction =
  | { type: 'RESET' }
  | { type: 'ADD_USER_MESSAGE'; payload: { id: string; content: string } }
  | { type: 'START_STREAMING'; payload: { id: string } }
  | { type: 'UPDATE_THINKING'; payload: { content: string } }
  | { type: 'ADD_TOOL_CALL'; payload: { name: string; args: Record<string, unknown> } }
  | { type: 'COMPLETE_TOOL_CALL'; payload: { name: string; result: Record<string, unknown> } }
  | { type: 'UPDATE_TEXT'; payload: { content: string } }
  | { type: 'ADD_CHART'; payload: { title: string; chartConfig: ChartConfig } }
  | { type: 'SET_ERROR'; payload: { content: string } }
  | { type: 'FINISH_STREAMING' }
  | { type: 'ADD_PANEL'; payload: { panelId: string } };

const initialState: ChatState = {
  messages: [],
  streamingMessage: null,
  isProcessing: false,
  addedPanels: [],
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'RESET':
      return initialState;

    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.payload.id,
            type: 'user',
            content: action.payload.content,
          },
        ],
        isProcessing: true,
      };

    case 'START_STREAMING':
      return {
        ...state,
        streamingMessage: {
          id: action.payload.id,
          textContent: '',
          toolCalls: [],
          charts: [],
          thinking: null,
          hasError: false,
        },
      };

    case 'UPDATE_THINKING':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          thinking: action.payload.content,
        },
      };

    case 'ADD_TOOL_CALL':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          thinking: null,
          toolCalls: [
            ...state.streamingMessage.toolCalls,
            {
              name: action.payload.name,
              args: action.payload.args,
              status: 'running',
            },
          ],
        },
      };

    case 'COMPLETE_TOOL_CALL':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          toolCalls: state.streamingMessage.toolCalls.map((tc) =>
            tc.name === action.payload.name && tc.status === 'running'
              ? { ...tc, status: 'complete' as const, result: action.payload.result }
              : tc
          ),
        },
      };

    case 'UPDATE_TEXT':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          thinking: null,
          textContent: action.payload.content,
        },
      };

    case 'ADD_CHART':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          thinking: null,
          charts: [
            ...state.streamingMessage.charts,
            {
              title: action.payload.title,
              chartConfig: action.payload.chartConfig,
            },
          ],
        },
      };

    case 'SET_ERROR':
      if (!state.streamingMessage) return state;
      return {
        ...state,
        streamingMessage: {
          ...state.streamingMessage,
          hasError: true,
          textContent: action.payload.content,
        },
      };

    case 'FINISH_STREAMING': {
      const streaming = state.streamingMessage;
      if (!streaming) {
        return {
          ...state,
          isProcessing: false,
        };
      }

      const newMessages: Message[] = [];

      if (streaming.textContent) {
        newMessages.push({
          id: streaming.id,
          type: 'text',
          content: streaming.textContent,
        });
      }

      streaming.charts.forEach((chart, idx) => {
        newMessages.push({
          id: `${streaming.id}-chart-${idx}`,
          type: 'chart',
          title: chart.title,
          chartConfig: chart.chartConfig,
        });
      });

      if (newMessages.length === 0 && !streaming.hasError) {
        newMessages.push({
          id: streaming.id,
          type: 'text',
          content: "I've processed your request.",
        });
      }

      return {
        ...state,
        messages: [...state.messages, ...newMessages],
        streamingMessage: null,
        isProcessing: false,
      };
    }

    case 'ADD_PANEL':
      return {
        ...state,
        addedPanels: [...state.addedPanels, action.payload.panelId],
      };

    default:
      return state;
  }
}

export function useAIChat() {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const streamingCompleteRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    streamingCompleteRef.current = false;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: 'RESET' });
  }, []);

  const sendMessage = useCallback((question: string, context: ChatContext) => {
    const userMessageId = crypto.randomUUID();
    dispatch({ type: 'ADD_USER_MESSAGE', payload: { id: userMessageId, content: question } });

    const streamingId = crypto.randomUUID();
    streamingCompleteRef.current = false;
    dispatch({ type: 'START_STREAMING', payload: { id: streamingId } });

    const handleEvent = (event: StreamEvent) => {
      switch (event.type) {
        case 'thinking':
          dispatch({ type: 'UPDATE_THINKING', payload: { content: event.content || '' } });
          break;
        case 'tool_call':
          dispatch({
            type: 'ADD_TOOL_CALL',
            payload: {
              name: event.toolName || '',
              args: (event.toolArgs as Record<string, unknown>) || {},
            },
          });
          break;
        case 'tool_result':
          dispatch({
            type: 'COMPLETE_TOOL_CALL',
            payload: {
              name: event.toolName || '',
              result: (event.toolResult as Record<string, unknown>) || {},
            },
          });
          break;
        case 'text':
          dispatch({ type: 'UPDATE_TEXT', payload: { content: event.content || '' } });
          break;
        case 'chart':
          if (event.chartConfig) {
            const chartConfig: ChartConfig = {
              id: event.chartConfig.id || crypto.randomUUID(),
              chartType: event.chartConfig.chartType,
              query: event.chartConfig.query,
            };
            dispatch({
              type: 'ADD_CHART',
              payload: { title: event.title || 'Chart', chartConfig },
            });
          }
          break;
        case 'error':
          dispatch({ type: 'SET_ERROR', payload: { content: event.content || 'An error occurred' } });
          break;
        case 'done':
          if (!streamingCompleteRef.current) {
            streamingCompleteRef.current = true;
            dispatch({ type: 'FINISH_STREAMING' });
          }
          break;
      }
    };

    abortControllerRef.current = aiApi.streamChat(question, context, {
      onEvent: handleEvent,
      onError: (error) => {
        dispatch({ type: 'SET_ERROR', payload: { content: error.message } });
        if (!streamingCompleteRef.current) {
          streamingCompleteRef.current = true;
          dispatch({ type: 'FINISH_STREAMING' });
        }
      },
      onComplete: () => {
        if (!streamingCompleteRef.current) {
          streamingCompleteRef.current = true;
          dispatch({ type: 'FINISH_STREAMING' });
        }
      },
    });
  }, []);

  const addPanel = useCallback((panelId: string) => {
    dispatch({ type: 'ADD_PANEL', payload: { panelId } });
  }, []);

  return {
    messages: state.messages,
    streamingMessage: state.streamingMessage,
    isProcessing: state.isProcessing,
    addedPanels: state.addedPanels,
    sendMessage,
    reset,
    addPanel,
  };
}

export type { Message, StreamingMessage, ChartItem, ToolCall };
