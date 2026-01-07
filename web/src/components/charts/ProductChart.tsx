import { useMemo } from 'react';
import { MoreVertical } from 'lucide-react';
import { useDashboard } from '@/context';
import { useProductMetrics } from '@/hooks';
import { formatCompactCurrency } from '@/utils';

const COLORS = ['#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', '#fdf2f8', '#fff1f2'];

export function ProductChart() {
  const { dateRange, selectedProductIds, comparisonMode } = useDashboard();

  const { data: metricsData, isLoading, error } = useProductMetrics(
    dateRange.startDate ?? undefined,
    dateRange.endDate ?? undefined,
    selectedProductIds,
    comparisonMode
  );

  const data = metricsData?.data ?? [];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data
      .map((item) => ({
        name: item.label,
        value: item.totalRevenue,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [data]);

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <span className="text-red-500">Error loading data</span>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <span className="text-gray-500">No data available</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-900">Top expenses, $</h3>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3">
            <div className="w-24 text-xs text-gray-600 truncate">{item.name}</div>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-300"
                style={{
                  width: `${(item.value / chartData[0].value) * 100}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
            </div>
            <div className="w-16 text-xs text-gray-600 text-right font-medium">
              {formatCompactCurrency(item.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
