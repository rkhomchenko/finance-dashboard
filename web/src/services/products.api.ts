import { apiClient } from './api';
import type { Product, DateRange } from '@/types';

interface ProductsResponse {
  products: Product[];
}

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const { data } = await apiClient.get<ProductsResponse>('/api/products');
    return data.products;
  },

  getDateRange: async (): Promise<DateRange> => {
    const { data } = await apiClient.get<DateRange>('/api/date-range');
    return data;
  },
};
