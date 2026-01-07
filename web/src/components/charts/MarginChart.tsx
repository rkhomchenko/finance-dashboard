import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { MoreVertical } from 'lucide-react';
import { useDashboard } from '@/context';
import { useMonthlyMetrics } from '@/hooks';

interface MarginChartProps {
  height?: number;
}

export function MarginChart({ height = 280 }: MarginChartProps) {
  const { dateRange, selectedProductIds, comparisonMode } = useDashboard();

  const { data: metricsData, isLoading, error } = useMonthlyMetrics(
    dateRange.startDate ?? undefined,
    dateRange.endDate ?? undefined,
    selectedProductIds,
    comparisonMode
  );

  const data = metricsData?.data ?? [];

  const chartData = useMemo(() => {
    if (!data || data.length < 2) return [];

    return data.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          revenueGrowth: 0,
          cogsGrowth: 0,
        };
      }

      const prevItem = data[index - 1];
      const revenueGrowth =
        prevItem.totalRevenue > 0
          ? ((item.totalRevenue - prevItem.totalRevenue) / prevItem.totalRevenue) * 100
          : 0;
      const cogsGrowth =
        prevItem.totalExpenses > 0
          ? ((item.totalExpenses - prevItem.totalExpenses) / prevItem.totalExpenses) * 100
          : 0;

      return {
        ...item,
        revenueGrowth: Math.round(revenueGrowth),
        cogsGrowth: Math.round(cogsGrowth),
      };
    });
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
        <h3 className="text-base font-medium text-gray-900">Revenue growth vs COGS growth</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-600">Revenue Growth, %</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-indigo-400"></span>
              <span className="text-gray-600">Cogs Growth, %</span>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
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
            tickFormatter={(value: number) => `${value}%`}
          />
          <ReferenceLine y={0} stroke="#e5e7eb" />
          <Tooltip
            formatter={(value) => [`${value}%`]}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          />
          <Line
            type="monotone"
            dataKey="revenueGrowth"
            name="Revenue Growth"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="cogsGrowth"
            name="COGS Growth"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: '#818cf8', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
