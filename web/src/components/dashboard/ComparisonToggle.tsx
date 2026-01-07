import { useDashboard } from '@/context';

type ComparisonMode = 'none' | 'previous' | 'yoy';

const OPTIONS: Array<{ value: ComparisonMode; label: string }> = [
  { value: 'none', label: 'No Comparison' },
  { value: 'previous', label: 'vs Previous Period' },
  { value: 'yoy', label: 'vs Year Ago' },
];

export function ComparisonToggle() {
  const { comparisonMode, updateComparisonMode } = useDashboard();

  return (
    <div className="comparison-toggle">
      <span className="comparison-label">Compare:</span>
      <div className="comparison-buttons">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`comparison-btn ${comparisonMode === option.value ? 'active' : ''}`}
            onClick={() => updateComparisonMode(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
