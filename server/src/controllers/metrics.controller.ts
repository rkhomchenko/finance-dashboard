import { Request, Response } from 'express';
import { IMetricsService, createMetricsService } from '../services';

interface MetricsQuery {
  startDate?: string;
  endDate?: string;
  productIds?: string[];
  groupBy?: 'month' | 'product' | 'month-product';
  comparison?: 'none' | 'previous' | 'yoy';
}

export class MetricsController {
  constructor(
    private metricsService: IMetricsService = createMetricsService()
  ) {}

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const query = this.parseQuery(req);

      if (query.startDate && query.endDate && query.startDate > query.endDate) {
        res.status(400).json({
          error: 'Invalid date range',
          message: 'Start date must be before end date'
        });
        return;
      }

      const result = await this.metricsService.getAggregatedMetrics(query);
      res.json(result);
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch metrics');
    }
  }

  private parseQuery(req: Request): MetricsQuery {
    const productIdsStr = req.query.productIds as string | undefined;

    return {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      productIds: productIdsStr ? productIdsStr.split(',').map(id => id.trim()) : undefined,
      groupBy: (req.query.groupBy as MetricsQuery['groupBy']) || 'month',
      comparison: (req.query.comparison as MetricsQuery['comparison']) || 'none'
    };
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    console.error(defaultMessage, error);
    res.status(500).json({
      error: defaultMessage,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function createMetricsController(service?: IMetricsService): MetricsController {
  return new MetricsController(service || createMetricsService());
}
