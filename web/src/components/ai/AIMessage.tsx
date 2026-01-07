import { Plus } from 'lucide-react';
import { DynamicChart } from '@/components/charts';
import { cn } from '@/lib/utils';
import type { ChartConfig } from '@/types';
import type { Message } from '@/hooks';

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-900 text-white">{content}</div>
    </div>
  );
}

interface TextMessageProps {
  content: string;
}

export function TextMessage({ content }: TextMessageProps) {
  const formatContent = (text: string): string => {
    if (!text) return '';

    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/^[•·-]\s+/gm, '• ')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-900"
        dangerouslySetInnerHTML={{ __html: formatContent(content) }}
      />
    </div>
  );
}

interface ChartWithTitle extends ChartConfig {
  title: string;
}

interface ChartMessageProps {
  title: string;
  chartConfig: ChartConfig;
  onAddToDashboard?: (chart: ChartWithTitle) => void;
  isAdded?: boolean;
}

export function ChartMessage({
  title,
  chartConfig,
  onAddToDashboard,
  isAdded = false,
}: ChartMessageProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
      </div>

      <div className="p-4">
        <DynamicChart config={chartConfig} height={180} />
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => onAddToDashboard?.({ ...chartConfig, title })}
          disabled={isAdded}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
            isAdded
              ? 'bg-green-100 text-green-700 cursor-default'
              : 'bg-primary text-white hover:bg-primary-dark'
          )}
        >
          <Plus size={14} />
          <span>{isAdded ? 'Added to Dashboard' : 'Add to Dashboard'}</span>
        </button>
      </div>
    </div>
  );
}

interface AIMessageRendererProps {
  message: Message;
  onAddToDashboard?: (chart: ChartWithTitle) => void;
  addedPanels?: string[];
}

export function AIMessageRenderer({
  message,
  onAddToDashboard,
  addedPanels = [],
}: AIMessageRendererProps) {
  if (message.type === 'user') {
    return <UserMessage content={message.content || ''} />;
  }

  if (message.type === 'text') {
    return <TextMessage content={message.content || ''} />;
  }

  if (message.type === 'chart' && message.chartConfig) {
    const isAdded = addedPanels.includes(message.chartConfig.id);
    return (
      <ChartMessage
        title={message.title || 'Chart'}
        chartConfig={message.chartConfig}
        onAddToDashboard={onAddToDashboard}
        isAdded={isAdded}
      />
    );
  }

  return null;
}
