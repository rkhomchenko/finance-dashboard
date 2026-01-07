import { IMetricRepository, createMetricRepository } from '../repositories';
import { Metric, AggregatedMetric, MetricsQuery, MetricsResponse, MetricsSummary } from '../types';

export interface IMetricsService {
  getAggregatedMetrics(query: MetricsQuery): Promise<MetricsResponse>;
}

export class MetricsService implements IMetricsService {
  constructor(
    private metricRepo: IMetricRepository = createMetricRepository()
  ) {}

  async getAggregatedMetrics(query: MetricsQuery): Promise<MetricsResponse> {
    const { startDate, endDate, productIds, groupBy = 'month', comparison = 'none' } = query;

    const metrics = await this.metricRepo.findByFilter({ startDate, endDate, productIds });

    const data = this.aggregate(metrics, groupBy);

    const summary = this.calculateSummary(data);

    let comparisonData: AggregatedMetric[] | undefined;
    if (comparison !== 'none' && startDate && endDate) {
      const compRange = this.calculateComparisonDateRange(startDate, endDate, comparison);
      const compMetrics = await this.metricRepo.findByFilter({
        startDate: compRange.startDate,
        endDate: compRange.endDate,
        productIds
      });
      comparisonData = this.aggregate(compMetrics, groupBy);
    }

    return { data, comparison: comparisonData, summary };
  }

  private aggregate(metrics: Metric[], groupBy: string): AggregatedMetric[] {
    switch (groupBy) {
      case 'product':
        return this.aggregateByProduct(metrics);
      case 'month-product':
        return this.aggregateByMonthProduct(metrics);
      default:
        return this.aggregateByMonth(metrics);
    }
  }

  private aggregateByMonth(metrics: Metric[]): AggregatedMetric[] {
    const grouped = this.groupBy(metrics, m => m.date);

    return Object.entries(grouped)
      .map(([date, items]) => this.aggregateGroup(items, {
        label: this.formatDateLabel(date),
        date
      }))
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  private aggregateByProduct(metrics: Metric[]): AggregatedMetric[] {
    const grouped = this.groupBy(metrics, m => m.productId);

    return Object.entries(grouped).map(([productId, items]) => {
      const base = this.aggregateGroup(items, {
        label: items[0].productName,
        productId,
        productName: items[0].productName
      });

      const avgCac = this.average(items, m => m.cac);
      const avgLtv = this.average(items, m => m.ltv);
      const avgMau = this.average(items, m => m.mau);

      return {
        ...base,
        cac: Math.round(avgCac),
        ltv: Math.round(avgLtv),
        ltvCacRatio: avgCac > 0 ? avgLtv / avgCac : 0,
        mau: Math.round(avgMau)
      };
    });
  }

  private aggregateByMonthProduct(metrics: Metric[]): AggregatedMetric[] {
    const grouped = this.groupBy(metrics, m => `${m.date}|${m.productId}`);

    return Object.entries(grouped)
      .map(([key, items]) => {
        const [date, productId] = key.split('|');
        return this.aggregateGroup(items, {
          label: this.formatDateLabel(date),
          date,
          productId,
          productName: items[0].productName
        });
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private aggregateGroup(items: Metric[], base: Partial<AggregatedMetric>): AggregatedMetric {
    const totalRevenue = this.sum(items, m => m.totalRevenue);
    const totalExpenses = this.sum(items, m => m.totalExpenses);
    const grossProfit = this.sum(items, m => m.grossProfit);
    const operatingCashFlow = this.sum(items, m => m.operatingCashFlow);
    const netProfit = this.sum(items, m => m.netProfit);

    return {
      label: base.label || '',
      date: base.date,
      productId: base.productId,
      productName: base.productName,
      totalRevenue,
      totalExpenses,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      operatingCashFlow,
      netProfit
    };
  }

  private sum(items: Metric[], valueFn: (m: Metric) => number): number {
    return items.reduce((sum, m) => sum + valueFn(m), 0);
  }

  private average(items: Metric[], valueFn: (m: Metric) => number): number {
    if (items.length === 0) return 0;
    return this.sum(items, valueFn) / items.length;
  }

  private calculateSummary(data: AggregatedMetric[]): MetricsSummary {
    const totalRevenue = data.reduce((sum, m) => sum + m.totalRevenue, 0);
    const totalExpenses = data.reduce((sum, m) => sum + m.totalExpenses, 0);
    const grossProfit = data.reduce((sum, m) => sum + m.grossProfit, 0);
    const operatingCashFlow = data.reduce((sum, m) => sum + m.operatingCashFlow, 0);

    return {
      totalRevenue,
      totalExpenses,
      grossProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      operatingCashFlow
    };
  }

  private calculateComparisonDateRange(
    startDate: string,
    endDate: string,
    comparison: 'previous' | 'yoy'
  ): { startDate: string; endDate: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (comparison === 'previous') {
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays);

      return {
        startDate: prevStart.toISOString().split('T')[0],
        endDate: prevEnd.toISOString().split('T')[0]
      };
    }

    const yoyStart = new Date(start);
    yoyStart.setFullYear(yoyStart.getFullYear() - 1);
    const yoyEnd = new Date(end);
    yoyEnd.setFullYear(yoyEnd.getFullYear() - 1);

    return {
      startDate: yoyStart.toISOString().split('T')[0],
      endDate: yoyEnd.toISOString().split('T')[0]
    };
  }

  private formatDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  }
}

export function createMetricsService(metricRepo?: IMetricRepository): IMetricsService {
  return new MetricsService(metricRepo || createMetricRepository());
}
