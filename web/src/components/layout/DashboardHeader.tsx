import { useState, useRef, useEffect, type RefObject } from 'react';
import { Calendar, Package, ChevronDown, X, Check, GitCompare, Sparkles, LayoutGrid } from 'lucide-react';
import { useDashboard } from '@/context';
import { cn } from '@/lib/utils';
import { AICFOModal } from '../ai/AICFOModal';
import { PanelToggles } from '../dashboard/PanelToggles';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
}

function DateFilterPopup({ isOpen, onClose, anchorRef }: PopupProps) {
  const { dateRange, availableDateRange, updateDateRangePreset, updateDateRangeCustom } =
    useDashboard();
  const popupRef = useRef<HTMLDivElement>(null);

  const presets = [
    { value: 'last30days' as const, label: 'Last 30 Days' },
    { value: 'last90days' as const, label: 'Last 90 Days' },
    { value: 'last12months' as const, label: 'Last 12 Months' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-80"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">Date Range</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => updateDateRangePreset(preset.value)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-lg transition-colors',
              dateRange.preset === preset.value
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">From</label>
          <input
            type="date"
            value={dateRange.startDate || ''}
            min={availableDateRange.minDate || undefined}
            max={dateRange.endDate || undefined}
            onChange={(e) => updateDateRangeCustom(e.target.value, dateRange.endDate || '')}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">To</label>
          <input
            type="date"
            value={dateRange.endDate || ''}
            min={dateRange.startDate || undefined}
            max={availableDateRange.maxDate || undefined}
            onChange={(e) => updateDateRangeCustom(dateRange.startDate || '', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}

function ProductFilterPopup({ isOpen, onClose, anchorRef }: PopupProps) {
  const { selectedProductIds, updateSelectedProducts, products, productsLoading } = useDashboard();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const handleProductToggle = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      updateSelectedProducts(selectedProductIds.filter((id) => id !== productId));
    } else {
      updateSelectedProducts([...selectedProductIds, productId]);
    }
  };

  const allSelected = selectedProductIds.length === products.length && products.length > 0;
  const noneSelected = selectedProductIds.length === 0;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-64"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">Products</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => updateSelectedProducts(products.map((p) => p.id))}
          disabled={allSelected}
          className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Select All
        </button>
        <button
          onClick={() => updateSelectedProducts([])}
          disabled={noneSelected}
          className="px-3 py-1 text-xs rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
      </div>

      {productsLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {products.map((product) => (
            <label
              key={product.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div
                className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  selectedProductIds.includes(product.id)
                    ? 'bg-primary border-primary'
                    : 'border-gray-300'
                )}
              >
                {selectedProductIds.includes(product.id) && (
                  <Check size={12} className="text-white" />
                )}
              </div>
              <input
                type="checkbox"
                checked={selectedProductIds.includes(product.id)}
                onChange={() => handleProductToggle(product.id)}
                className="sr-only"
              />
              <span className="text-sm text-gray-700">{product.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

interface PanelTogglesPopupProps extends PopupProps {
  visiblePanels: import('@/context').VisiblePanels;
  onToggle: (panelId: keyof import('@/context').VisiblePanels) => void;
}

function PanelTogglesPopup({ isOpen, onClose, anchorRef, visiblePanels, onToggle }: PanelTogglesPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-64"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">Toggle Charts</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>
      <PanelToggles visiblePanels={visiblePanels} onToggle={onToggle} />
    </div>
  );
}

function ComparisonFilterPopup({ isOpen, onClose, anchorRef }: PopupProps) {
  const { comparisonMode, updateComparisonMode } = useDashboard();
  const popupRef = useRef<HTMLDivElement>(null);

  const options = [
    { value: 'none' as const, label: 'No comparison' },
    { value: 'previous' as const, label: 'vs Previous Period (MoM)' },
    { value: 'yoy' as const, label: 'vs Year Ago (YoY)' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-56"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">Compare</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-1">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              updateComparisonMode(option.value);
              onClose();
            }}
            className={cn(
              'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2',
              comparisonMode === option.value
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {comparisonMode === option.value && <Check size={14} />}
            <span className={comparisonMode === option.value ? '' : 'ml-5'}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DashboardHeader() {
  const [datePopupOpen, setDatePopupOpen] = useState(false);
  const [productPopupOpen, setProductPopupOpen] = useState(false);
  const [comparisonPopupOpen, setComparisonPopupOpen] = useState(false);
  const [panelPopupOpen, setPanelPopupOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const productButtonRef = useRef<HTMLButtonElement>(null);
  const comparisonButtonRef = useRef<HTMLButtonElement>(null);
  const panelButtonRef = useRef<HTMLButtonElement>(null);

  const { dateRange, selectedProductIds, products, comparisonMode, visiblePanels, togglePanel } = useDashboard();

  const visiblePanelCount = Object.values(visiblePanels).filter(Boolean).length;
  const totalPanelCount = Object.keys(visiblePanels).length;

  const getDateLabel = () => {
    if (dateRange.preset === 'last30days') return 'Last 30 Days';
    if (dateRange.preset === 'last90days') return 'Last 90 Days';
    if (dateRange.preset === 'last12months') return 'Last 12 Months';
    if (dateRange.startDate && dateRange.endDate) {
      const start = new Date(dateRange.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const end = new Date(dateRange.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${start} - ${end}`;
    }
    return 'Select dates';
  };

  const getProductLabel = () => {
    if (selectedProductIds.length === 0) return 'No products';
    if (selectedProductIds.length === products.length) return 'All products';
    if (selectedProductIds.length === 1) {
      const product = products.find((p) => p.id === selectedProductIds[0]);
      return product?.name || '1 product';
    }
    return `${selectedProductIds.length} products`;
  };

  const getComparisonLabel = () => {
    if (comparisonMode === 'previous') return 'vs Previous';
    if (comparisonMode === 'yoy') return 'vs YoY';
    return 'Compare';
  };

  return (
    <header className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                ref={dateButtonRef}
                onClick={() => {
                  setDatePopupOpen(!datePopupOpen);
                  setProductPopupOpen(false);
                  setComparisonPopupOpen(false);
                  setPanelPopupOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  datePopupOpen
                    ? 'bg-primary text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                )}
              >
                <Calendar size={16} />
                <span>{getDateLabel()}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', datePopupOpen && 'rotate-180')}
                />
              </button>
              <DateFilterPopup
                isOpen={datePopupOpen}
                onClose={() => setDatePopupOpen(false)}
                anchorRef={dateButtonRef}
              />
            </div>

            <div className="relative">
              <button
                ref={productButtonRef}
                onClick={() => {
                  setProductPopupOpen(!productPopupOpen);
                  setDatePopupOpen(false);
                  setComparisonPopupOpen(false);
                  setPanelPopupOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  productPopupOpen
                    ? 'bg-primary text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                )}
              >
                <Package size={16} />
                <span>{getProductLabel()}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', productPopupOpen && 'rotate-180')}
                />
              </button>
              <ProductFilterPopup
                isOpen={productPopupOpen}
                onClose={() => setProductPopupOpen(false)}
                anchorRef={productButtonRef}
              />
            </div>

            <div className="relative">
              <button
                ref={comparisonButtonRef}
                onClick={() => {
                  setComparisonPopupOpen(!comparisonPopupOpen);
                  setDatePopupOpen(false);
                  setProductPopupOpen(false);
                  setPanelPopupOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  comparisonPopupOpen || comparisonMode !== 'none'
                    ? 'bg-primary text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                )}
              >
                <GitCompare size={16} />
                <span>{getComparisonLabel()}</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', comparisonPopupOpen && 'rotate-180')}
                />
              </button>
              <ComparisonFilterPopup
                isOpen={comparisonPopupOpen}
                onClose={() => setComparisonPopupOpen(false)}
                anchorRef={comparisonButtonRef}
              />
            </div>

            <div className="relative">
              <button
                ref={panelButtonRef}
                onClick={() => {
                  setPanelPopupOpen(!panelPopupOpen);
                  setDatePopupOpen(false);
                  setProductPopupOpen(false);
                  setComparisonPopupOpen(false);
                }}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors',
                  panelPopupOpen
                    ? 'bg-primary text-white'
                    : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                )}
              >
                <LayoutGrid size={16} />
                <span>Charts ({visiblePanelCount}/{totalPanelCount})</span>
                <ChevronDown
                  size={14}
                  className={cn('transition-transform', panelPopupOpen && 'rotate-180')}
                />
              </button>
              <PanelTogglesPopup
                isOpen={panelPopupOpen}
                onClose={() => setPanelPopupOpen(false)}
                anchorRef={panelButtonRef}
                visiblePanels={visiblePanels}
                onToggle={togglePanel}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Sparkles size={16} />
          <span>AI CFO</span>
        </button>
      </div>

      <AICFOModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />

      <div className="mt-4">
        <nav className="flex gap-6 border-b border-gray-200 -mb-px">
          <button className="pb-3 text-sm font-medium text-gray-900 border-b-2 border-gray-900">
            Snapshot
          </button>
        </nav>
      </div>
    </header>
  );
}
