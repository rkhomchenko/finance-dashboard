import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: productsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDateRange() {
  return useQuery({
    queryKey: ['dateRange'],
    queryFn: productsApi.getDateRange,
    staleTime: 5 * 60 * 1000,
  });
}
