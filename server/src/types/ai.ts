export interface ChatContext {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  products?: Array<{ id: string; name: string }>;
}

export interface ChatMessage {
  type: 'text' | 'chart';
  content?: string | null;
  title?: string | null;
  chartConfig?: ChartConfig | null;
}

export interface ChartConfig {
  chartType: 'bar' | 'line' | 'horizontalBar';
  query: ChartQuery;
}

export interface ChartQuery {
  groupBy: 'month' | 'product';
  metric: 'revenue' | 'expenses' | 'profit' | 'margin' | 'cac' | 'ltv';
  startDate?: string | null;
  endDate?: string | null;
  productIds?: string[] | null;
  sortDirection?: 'asc' | 'desc' | null;
}

export interface StructuredResponse {
  messages: ChatMessage[];
}

export interface StreamEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'text' | 'chart' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: object;
  toolResult?: object;
  chartConfig?: object;
  title?: string;
}
