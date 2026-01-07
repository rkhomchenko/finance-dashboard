export type MessageType = 'user' | 'text' | 'chart' | 'thinking' | 'tool';

export interface ChartQuery {
  groupBy: 'month' | 'product';
  metric: 'revenue' | 'expenses' | 'profit' | 'margin' | 'cac' | 'ltv';
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  sortDirection?: 'asc' | 'desc';
}

export interface ChartConfig {
  id: string;
  chartType: 'bar' | 'line' | 'horizontalBar';
  query: ChartQuery;
}

export interface ChatMessage {
  id: string;
  type: MessageType;
  content?: string;
  title?: string;
  chartConfig?: ChartConfig;
  toolName?: string;
  toolResult?: unknown;
  timestamp: Date;
}

export interface ChatContext {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  products?: Array<{
    id: string;
    name: string;
  }>;
}

export type StreamEventType =
  | 'thinking'
  | 'tool_call'
  | 'tool_result'
  | 'text'
  | 'chart'
  | 'done'
  | 'error';

export interface StreamEvent {
  type: StreamEventType;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  chartConfig?: Omit<ChartConfig, 'id'> & { id?: string };
  title?: string;
}

export interface CustomPanel extends ChartConfig {
  title: string;
}
