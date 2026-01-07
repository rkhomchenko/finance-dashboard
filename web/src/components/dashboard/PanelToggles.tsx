import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VisiblePanels } from '@/context';

interface PanelTogglesProps {
  visiblePanels: VisiblePanels;
  onToggle: (panelId: keyof VisiblePanels) => void;
}

const PANELS: Array<{ id: keyof VisiblePanels; label: string }> = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'product', label: 'Expenses' },
  { id: 'margin', label: 'Margin' },
  { id: 'productBreakdown', label: 'Product Breakdown' },
  { id: 'stackedRevenue', label: 'Revenue Categories' },
];

export function PanelToggles({ visiblePanels, onToggle }: PanelTogglesProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {PANELS.map((panel) => (
        <button
          key={panel.id}
          onClick={() => onToggle(panel.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors',
            visiblePanels[panel.id]
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {visiblePanels[panel.id] && <Check size={12} />}
          <span>{panel.label}</span>
        </button>
      ))}
    </div>
  );
}
