import { getDatabase, IDatabase } from '../database';
import { Metric, DateRange } from '../types';

export interface MetricFilter {
  startDate?: string;
  endDate?: string;
  productIds?: string[];
}

export interface IMetricRepository {
  findAll(): Promise<Metric[]>;
  findByFilter(filter: MetricFilter): Promise<Metric[]>;
  getDateRange(): Promise<DateRange>;
}

export class MetricRepository implements IMetricRepository {
  private db: IDatabase;

  constructor(database?: IDatabase) {
    this.db = database || getDatabase();
  }

  async findAll(): Promise<Metric[]> {
    return this.db.getMetrics();
  }

  async findByFilter(filter: MetricFilter): Promise<Metric[]> {
    let metrics = await this.db.getMetrics();

    if (filter.startDate) {
      metrics = metrics.filter(m => m.date >= filter.startDate!);
    }

    if (filter.endDate) {
      metrics = metrics.filter(m => m.date <= filter.endDate!);
    }

    if (filter.productIds && filter.productIds.length > 0) {
      metrics = metrics.filter(m => filter.productIds!.includes(m.productId));
    }

    return metrics;
  }

  async getDateRange(): Promise<DateRange> {
    const metrics = await this.db.getMetrics();
    const dates = metrics.map(m => m.date).sort();
    const uniqueDates = Array.from(new Set(dates));

    return {
      minDate: uniqueDates[0] || '',
      maxDate: uniqueDates[uniqueDates.length - 1] || '',
      months: uniqueDates
    };
  }
}

export function createMetricRepository(db?: IDatabase): IMetricRepository {
  return new MetricRepository(db);
}
