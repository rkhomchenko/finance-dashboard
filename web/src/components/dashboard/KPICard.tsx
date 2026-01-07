import { TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';
import { formatCompactCurrency, formatPercent } from '@/utils';

interface KPICardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  isPercent?: boolean;
  comparisonValue?: number | null;
  comparisonLabel?: string | null;
}

export function KPICard({
  title,
  value,
  format = 'currency',
  isPercent = false,
  comparisonValue,
  comparisonLabel,
}: KPICardProps) {
  const formatValue = (val: number): string => {
    if (isPercent) {
      return formatPercent(val);
    }
    if (format === 'currency') {
      return formatCompactCurrency(val);
    }
    return val?.toLocaleString() || '0';
  };

  const comparisonChange =
    comparisonValue !== undefined && comparisonValue !== null && comparisonValue !== 0
      ? ((value - comparisonValue) / Math.abs(comparisonValue)) * 100
      : null;
  const comparisonIsPositive = comparisonChange !== null && comparisonChange >= 0;

  const currentDate = new Date();
  const dateLabel = `for ${currentDate
    .toLocaleDateString('en-US', { month: 'short' })
    .toLowerCase()}-${currentDate.getFullYear().toString().slice(-2)}`;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <button className="text-gray-400 hover:text-gray-600 -mr-1">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="text-2xl font-semibold text-gray-900 mb-2">{formatValue(value)}</div>

      <div className="flex items-center gap-2 text-xs">
        {comparisonChange !== null && (
          <span
            className={`flex items-center gap-0.5 font-medium ${
              comparisonIsPositive ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {comparisonIsPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {comparisonLabel || 'MoM'} {Math.abs(comparisonChange).toFixed(0)}%
          </span>
        )}
        <span className="text-gray-400">{dateLabel}</span>
      </div>
    </div>
  );
}
