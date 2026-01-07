import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { MoreVertical } from 'lucide-react';
import { useDashboard } from '@/context';
import { useMonthProductMetrics } from '@/hooks';
import { formatCompactCurrency } from '@/utils';

const PRODUCT_COLORS: Record<string, string> = {
  'Enterprise Plan': '#ec4899',
  'Professional Plan': '#8b5cf6',
  'Starter Plan': '#06b6d4',
  'Consulting Services': '#f59e0b',
};

const DEFAULT_COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#6366f1'];

export function StackedRevenueChart() {
  const { dateRange, selectedProductIds, comparisonMode, products } = useDashboard();

  const { data: metricsData, isLoading, error } = useMonthProductMetrics(
    dateRange.startDate ?? undefined,
    dateRange.endDate ?? undefined,
    selectedProductIds,
    comparisonMode
  );

  const data = metricsData?.data ?? [];

  const { chartData, productNames } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], productNames: [] };

    const monthsMap = new Map<string, Record<string, number | string>>();
    const productsSet = new Set<string>();

    data.forEach((item) => {
      const month = item.label?.split(' - ')[0] || item.date || '';
      const productName = item.productName || 'Unknown';
      productsSet.add(productName);

      if (!monthsMap.has(month)) {
        monthsMap.set(month, { label: month });
      }
      const monthData = monthsMap.get(month)!;
      monthData[productName] = item.totalRevenue;
    });

    const productNames = Array.from(productsSet);
    const chartData = Array.from(monthsMap.values()).sort((a, b) => {
      const labelA = a.label as string;
      const labelB = b.label as string;
      return labelA.localeCompare(labelB);
    });

    return { chartData, productNames };
  }, [data]);

  const selectedProductNames = useMemo(() => {
    if (productNames.length === 0) return [];
    const selectedNames = products
      .filter((p) => selectedProductIds.includes(p.id))
      .map((p) => p.name);
    return productNames.filter((name) => selectedNames.includes(name));
  }, [products, selectedProductIds, productNames]);

  if (isLoading && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <span className="text-gray-500">Loading chart...</span>
      </div>
    );
  }

  if (error && (!data || data.length === 0)) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <span className="text-red-500">Error loading chart</span>
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
        <h3 className="text-base font-medium text-gray-900">Revenue by Product (Stacked)</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {selectedProductNames.map((name, idx) => (
              <div key={name} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: PRODUCT_COLORS[name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] }}
                />
                <span className="text-gray-600">{name}</span>
              </div>
            ))}
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
            tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
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
          {selectedProductNames.map((name, idx) => (
            <Bar
              key={name}
              dataKey={name}
              name={name}
              stackId="revenue"
              fill={PRODUCT_COLORS[name] || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]}
              radius={idx === selectedProductNames.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
