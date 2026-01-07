import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useMetrics } from '@/hooks';
import { formatCompactCurrency, formatPercent } from '@/utils';
import type { ChartConfig, AggregatedMetric } from '@/types';

const COLORS = ['#4f46e5', '#818cf8', '#6366f1', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff'];

const metricFieldMap: Record<string, keyof AggregatedMetric> = {
  revenue: 'totalRevenue',
  expenses: 'totalExpenses',
  profit: 'grossProfit',
  margin: 'grossMargin',
  cac: 'cac',
  ltv: 'ltv',
  cashflow: 'operatingCashFlow',
};

const tooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
};

interface DynamicChartProps {
  config: ChartConfig;
  height?: number;
}

export function DynamicChart({ config, height = 200 }: DynamicChartProps) {
  const { data: metricsData, isLoading, error } = useMetrics(
    {
      groupBy: config.query.groupBy,
      startDate: config.query.startDate ?? undefined,
      endDate: config.query.endDate ?? undefined,
      productIds: config.query.productIds ?? undefined,
    },
    Boolean(config?.query)
  );

  const data = metricsData?.data ?? [];

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const metricField = metricFieldMap[config?.query?.metric] || 'totalRevenue';
    const sortDirection = config?.query?.sortDirection;

    let transformed = data.map((item, index) => ({
      name: item.label || item.productName || `Item ${index + 1}`,
      value: (item[metricField] as number) || 0,
      ...item,
    }));

    if (sortDirection === 'desc') {
      transformed.sort((a, b) => b.value - a.value);
    } else if (sortDirection === 'asc') {
      transformed.sort((a, b) => a.value - b.value);
    }

    return transformed;
  }, [data, config]);

  const valueFormatter = useMemo(() => {
    const metric = config?.query?.metric;
    if (metric === 'margin') {
      return (value: number) => formatPercent(value);
    }
    return (value: number) => formatCompactCurrency(value);
  }, [config]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-red-500">Failed to load chart data</div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-sm text-gray-500">No data available</div>
      </div>
    );
  }

  switch (config.chartType) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={valueFormatter}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [valueFormatter(value as number), config?.query?.metric || 'Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={{ r: 3, fill: '#4f46e5' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'horizontalBar':
      return (
        <div style={{ height }} className="overflow-y-auto">
          <div className="space-y-2 py-2">
            {chartData.slice(0, 7).map((item, index) => {
              const maxValue = Math.max(...chartData.map((d) => Math.abs(d.value)));
              const percentage = maxValue > 0 ? (Math.abs(item.value) / maxValue) * 100 : 0;

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-gray-600 truncate" title={item.name}>
                    {item.name}
                  </div>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                  <div className="w-20 text-sm text-gray-700 text-right font-medium">
                    {valueFormatter(item.value)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'bar':
    default:
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={valueFormatter}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [valueFormatter(value as number), config?.query?.metric || 'Value']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
  }
}
