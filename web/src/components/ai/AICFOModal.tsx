import { useRef, useEffect, useCallback } from 'react';
import { X, Sparkles, ArrowRight, Loader2, Wrench, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboard, type CustomPanel } from '@/context';
import { useAIChat, type StreamingMessage, type ToolCall } from '@/hooks';
import { AIMessageRenderer } from './AIMessage';
import type { ChartConfig, Product } from '@/types';

const SUGGESTED_QUESTIONS = [
  'Show me revenue trends for Q3 2024',
  'Compare Professional vs Starter Plan revenue',
  'Which product has the highest CAC?',
  'What services are most unprofitable?',
];

interface ChartWithTitle extends ChartConfig {
  title: string;
}

interface AICFOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPanelAdded?: (panel: CustomPanel) => void;
}

export function AICFOModal({ isOpen, onClose, onPanelAdded }: AICFOModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputValueRef = useRef('');

  const { dateRange, products } = useDashboard();

  const { messages, streamingMessage, isProcessing, addedPanels, sendMessage, reset, addPanel } =
    useAIChat();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      inputValueRef.current = '';
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [isOpen, reset]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const question = inputValueRef.current.trim();
      if (!question || isProcessing) return;

      inputValueRef.current = '';
      if (inputRef.current) {
        inputRef.current.value = '';
      }

      const context = {
        dateRange: dateRange.startDate && dateRange.endDate
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : undefined,
        products: products.map((p: Product) => ({ id: p.id, name: p.name })),
      };

      sendMessage(question, context);
    },
    [isProcessing, dateRange, products, sendMessage]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    inputValueRef.current = e.target.value;
  };

  const handleSuggestedQuestion = (question: string) => {
    inputValueRef.current = question;
    if (inputRef.current) {
      inputRef.current.value = question;
      inputRef.current.focus();
    }
  };

  const { addCustomPanel } = useDashboard();

  const handleAddToDashboard = (chartConfig: ChartWithTitle) => {
    if (!chartConfig?.id) return;

    addPanel(chartConfig.id);

    addCustomPanel({
      ...chartConfig,
      id: chartConfig.id,
    });

    onPanelAdded?.({
      ...chartConfig,
      addedAt: Date.now(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative h-full w-full max-w-md bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">AI CFO</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 && !streamingMessage ? (
            <div className="h-full flex flex-col justify-center items-center text-center">
              <Sparkles size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Ask me about your finances
              </h3>
              <p className="text-sm text-gray-500 max-w-xs">
                I can help you analyze revenue trends, compare products, and identify areas for
                improvement.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <AIMessageRenderer
                  key={message.id}
                  message={message}
                  onAddToDashboard={handleAddToDashboard}
                  addedPanels={addedPanels}
                />
              ))}

              {streamingMessage && (
                <StreamingMessageComponent
                  state={streamingMessage}
                  onAddToDashboard={handleAddToDashboard}
                  addedPanels={addedPanels}
                />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {messages.length === 0 && !streamingMessage && (
          <div className="px-6 pb-4">
            <p className="text-xs text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-left"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                defaultValue=""
                onChange={handleInputChange}
                placeholder="Your request"
                disabled={isProcessing}
                className="w-full px-4 py-3 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className={cn(
                'p-3 rounded-xl transition-colors',
                !isProcessing
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              )}
            >
              <ArrowRight size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

interface StreamingMessageComponentProps {
  state: StreamingMessage;
  onAddToDashboard: (chart: ChartWithTitle) => void;
  addedPanels: string[];
}

function StreamingMessageComponent({
  state,
  onAddToDashboard,
  addedPanels,
}: StreamingMessageComponentProps) {
  return (
    <div className="space-y-3">
      {state.thinking && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 size={14} className="animate-spin" />
          <span>{state.thinking}</span>
        </div>
      )}

      {state.toolCalls.length > 0 && (
        <div className="space-y-2">
          {state.toolCalls.map((tool: ToolCall, idx: number) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2"
            >
              {tool.status === 'running' ? (
                <Loader2 size={12} className="animate-spin text-primary" />
              ) : (
                <CheckCircle2 size={12} className="text-green-500" />
              )}
              <Wrench size={12} className="text-gray-400" />
              <span className="text-gray-600 font-medium">{formatToolName(tool.name)}</span>
              {tool.args && Object.keys(tool.args).length > 0 && (
                <span className="text-gray-400">({formatToolArgs(tool.args)})</span>
              )}
            </div>
          ))}
        </div>
      )}

      {state.charts.map((chart, idx) => (
        <AIMessageRenderer
          key={`streaming-chart-${idx}`}
          message={{
            id: `streaming-chart-${idx}`,
            type: 'chart',
            title: chart.title,
            chartConfig: chart.chartConfig,
          }}
          onAddToDashboard={onAddToDashboard}
          addedPanels={addedPanels}
        />
      ))}

      {!state.thinking &&
        !state.textContent &&
        state.toolCalls.length === 0 &&
        state.charts.length === 0 && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3 bg-gray-100">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatToolArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';
  return (
    entries
      .slice(0, 2)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(', ') + (entries.length > 2 ? '...' : '')
  );
}
