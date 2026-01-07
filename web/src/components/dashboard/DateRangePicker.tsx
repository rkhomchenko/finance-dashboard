import { Calendar } from 'lucide-react';
import { useDashboard, type DateRangeState } from '@/context';

const PRESETS: Array<{ value: DateRangeState['preset']; label: string }> = [
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'last12months', label: 'Last 12 Months' },
];

export function DateRangePicker() {
  const { dateRange, availableDateRange, updateDateRangePreset, updateDateRangeCustom } =
    useDashboard();

  const handlePresetChange = (preset: DateRangeState['preset']) => {
    updateDateRangePreset(preset);
  };

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      updateDateRangeCustom(value, dateRange.endDate ?? '');
    } else {
      updateDateRangeCustom(dateRange.startDate ?? '', value);
    }
  };

  if (!dateRange.startDate || !dateRange.endDate) {
    return <div className="date-range-picker">Loading date range...</div>;
  }

  return (
    <div className="date-range-picker">
      <div className="preset-buttons">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`preset-btn ${dateRange.preset === preset.value ? 'active' : ''}`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="custom-dates">
        <div className="date-input-group">
          <Calendar size={16} />
          <input
            type="date"
            value={dateRange.startDate}
            min={availableDateRange.minDate ?? undefined}
            max={dateRange.endDate ?? undefined}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className="date-input"
          />
        </div>
        <span className="date-separator">to</span>
        <div className="date-input-group">
          <Calendar size={16} />
          <input
            type="date"
            value={dateRange.endDate}
            min={dateRange.startDate ?? undefined}
            max={availableDateRange.maxDate ?? undefined}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="date-input"
          />
        </div>
      </div>
    </div>
  );
}
