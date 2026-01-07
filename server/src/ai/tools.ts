import { createMetricsService, IMetricsService } from '../services/metrics.service';
import { createProductService, IProductService } from '../services/product.service';

export interface QueryMetricsParams {
  groupBy: 'month' | 'product';
  metric: 'revenue' | 'expenses' | 'profit' | 'margin' | 'cac' | 'ltv';
  startDate?: string;
  endDate?: string;
  productIds?: string[];
}

interface ToolResult {
  success: boolean;
  [key: string]: unknown;
}

export class ToolExecutor {
  constructor(
    private metricsService: IMetricsService = createMetricsService(),
    private productService: IProductService = createProductService()
  ) {}

  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    switch (toolName) {
      case 'query_metrics':
        return this.queryMetrics(args as unknown as QueryMetricsParams);
      case 'get_products':
        return this.getProducts();
      case 'get_date_range':
        return this.getDateRange();
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  }

  private async queryMetrics(params: QueryMetricsParams): Promise<ToolResult> {
    const { groupBy, metric, startDate, endDate, productIds } = params;

    const result = await this.metricsService.getAggregatedMetrics({
      startDate,
      endDate,
      productIds,
      groupBy,
      comparison: 'none'
    });

    const metricFieldMap: Record<string, string> = {
      revenue: 'totalRevenue',
      expenses: 'totalExpenses',
      profit: 'grossProfit',
      margin: 'grossMargin',
      cac: 'cac',
      ltv: 'ltv'
    };

    const field = metricFieldMap[metric] || 'totalRevenue';

    const transformedData = result.data.map((item) => ({
      label: item.label,
      value: (item as unknown as Record<string, unknown>)[field],
      productId: item.productId,
      productName: item.productName,
      date: item.date
    }));

    return {
      success: true,
      metric,
      groupBy,
      data: transformedData,
      summary: {
        total: transformedData.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
        count: transformedData.length,
        average: transformedData.length > 0
          ? transformedData.reduce((sum, item) => sum + (Number(item.value) || 0), 0) / transformedData.length
          : 0
      }
    };
  }

  private async getProducts(): Promise<ToolResult> {
    const products = await this.productService.getAllProducts();
    return {
      success: true,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category
      }))
    };
  }

  private async getDateRange(): Promise<ToolResult> {
    const dateRange = await this.productService.getDateRange();
    return {
      success: true,
      minDate: dateRange.minDate,
      maxDate: dateRange.maxDate,
      totalMonths: dateRange.months.length
    };
  }
}

export function createToolExecutor(
  metricsService?: IMetricsService,
  productService?: IProductService
): ToolExecutor {
  return new ToolExecutor(
    metricsService || createMetricsService(),
    productService || createProductService()
  );
}
