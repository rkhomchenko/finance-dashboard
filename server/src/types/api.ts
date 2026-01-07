export interface MetricsQuery {
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  groupBy?: 'month' | 'product' | 'month-product';
  comparison?: 'none' | 'previous' | 'yoy';
}

export interface AggregatedMetric {
  label: string;
  date?: string;
  productId?: string;
  productName?: string;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: number;
  operatingCashFlow: number;
  netProfit: number;
  cac?: number;
  ltv?: number;
  ltvCacRatio?: number;
  mau?: number;
}

export interface MetricsSummary {
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: number;
  operatingCashFlow: number;
}

export interface MetricsResponse {
  data: AggregatedMetric[];
  comparison?: AggregatedMetric[];
  summary: MetricsSummary;
}

export interface DateRange {
  minDate: string;
  maxDate: string;
  months: string[];
}

export interface ApiError {
  error: string;
  message?: string;
}
