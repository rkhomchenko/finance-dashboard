import { apiClient } from './api';
import type { MetricsQuery, MetricsResponse } from '@/types';

export const metricsApi = {
  get: async (query: MetricsQuery): Promise<MetricsResponse> => {
    const params = new URLSearchParams();

    if (query.startDate) {
      params.set('startDate', query.startDate);
    }
    if (query.endDate) {
      params.set('endDate', query.endDate);
    }
    if (query.groupBy) {
      params.set('groupBy', query.groupBy);
    }
    if (query.comparison) {
      params.set('comparison', query.comparison);
    }
    if (query.productIds?.length) {
      params.set('productIds', query.productIds.join(','));
    }

    const { data } = await apiClient.get<MetricsResponse>(
      `/api/metrics?${params.toString()}`
    );
    return data;
  },
};
