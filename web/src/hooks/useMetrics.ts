import { useQuery } from '@tanstack/react-query';
import { metricsApi } from '@/services';
import type { MetricsQuery } from '@/types';

export function useMetrics(query: MetricsQuery, enabled = true) {
  return useQuery({
    queryKey: ['metrics', query],
    queryFn: () => metricsApi.get(query),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useMonthlyMetrics(
  startDate?: string,
  endDate?: string,
  productIds?: string[],
  comparison: MetricsQuery['comparison'] = 'none'
) {
  return useMetrics(
    {
      startDate,
      endDate,
      productIds,
      groupBy: 'month',
      comparison,
    },
    Boolean(startDate && endDate)
  );
}

export function useProductMetrics(
  startDate?: string,
  endDate?: string,
  productIds?: string[],
  comparison: MetricsQuery['comparison'] = 'none'
) {
  return useMetrics(
    {
      startDate,
      endDate,
      productIds,
      groupBy: 'product',
      comparison,
    },
    Boolean(startDate && endDate)
  );
}

export function useMonthProductMetrics(
  startDate?: string,
  endDate?: string,
  productIds?: string[],
  comparison: MetricsQuery['comparison'] = 'none'
) {
  return useMetrics(
    {
      startDate,
      endDate,
      productIds,
      groupBy: 'month-product',
      comparison,
    },
    Boolean(startDate && endDate)
  );
}
