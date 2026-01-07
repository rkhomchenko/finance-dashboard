import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MoreVertical } from 'lucide-react';
import { useDashboard } from '@/context';
import { useMonthlyMetrics } from '@/hooks';
import { formatCompactCurrency } from '@/utils';

interface RevenueChartProps {
  height?: number;
}

export function RevenueChart({ height = 280 }: RevenueChartProps) {
  const { dateRange, selectedProductIds, comparisonMode } = useDashboard();

  const { data: metricsData, isLoading, error } = useMonthlyMetrics(
    dateRange.startDate ?? undefined,
    dateRange.endDate ?? undefined,
    selectedProductIds,
    comparisonMode
  );

  const data = metricsData?.data ?? [];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item) => ({
      ...item,
      inflow: item.totalRevenue,
      outflow: item.totalExpenses || item.totalRevenue * 0.45,
    }));
  }, [data]);

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-96 flex items-center justify-center">
        <span className="text-gray-500">Loading chart...</span>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-96 flex items-center justify-center">
        <span className="text-red-500">Error loading chart</span>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-96 flex items-center justify-center">
        <span className="text-gray-500">No data available</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-900">Inflow vs Outflow</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              <span className="text-gray-600">inflow, $</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-200"></span>
              <span className="text-gray-600">outflow, $</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}`}
          />
          <Tooltip
            formatter={(value) => formatCompactCurrency(value as number)}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Bar dataKey="inflow" name="Inflow" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar
            dataKey="outflow"
            name="Outflow"
            fill="#fbcfe8"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
