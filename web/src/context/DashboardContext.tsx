import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { subMonths, format, parseISO } from 'date-fns';
import { useDateRange, useProducts } from '@/hooks';
import type { ChartConfig, Product } from '@/types';

export interface DateRangeState {
  startDate: string | null;
  endDate: string | null;
  preset: 'last30days' | 'last90days' | 'last12months' | 'custom';
}

export interface VisiblePanels {
  revenue: boolean;
  product: boolean;
  margin: boolean;
  productBreakdown: boolean;
  stackedRevenue: boolean;
}

const DEFAULT_VISIBLE_PANELS: VisiblePanels = {
  revenue: true,
  product: true,
  margin: true,
  productBreakdown: true,
  stackedRevenue: true,
};

export interface CustomPanel extends ChartConfig {
  title: string;
  addedAt: number;
}

interface DashboardContextValue {
  dateRange: DateRangeState;
  selectedProductIds: string[];
  comparisonMode: 'none' | 'previous' | 'yoy';
  customPanels: CustomPanel[];
  visiblePanels: VisiblePanels;
  products: Product[];
  productsLoading: boolean;
  availableDateRange: { minDate: string | null; maxDate: string | null };
  updateDateRangePreset: (preset: DateRangeState['preset']) => void;
  updateDateRangeCustom: (startDate: string, endDate: string) => void;
  updateSelectedProducts: (productIds: string[]) => void;
  updateComparisonMode: (mode: 'none' | 'previous' | 'yoy') => void;
  addCustomPanel: (panel: Omit<CustomPanel, 'addedAt'>) => void;
  removeCustomPanel: (panelId: string) => void;
  togglePanel: (panelId: keyof VisiblePanels) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
    preset: 'last12months',
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<'none' | 'previous' | 'yoy'>('none');

  const [customPanels, setCustomPanels] = useState<CustomPanel[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('dashboard-custom-panels') || '[]');
    } catch {
      return [];
    }
  });

  const [visiblePanels, setVisiblePanels] = useState<VisiblePanels>(() => {
    try {
      const saved = localStorage.getItem('dashboard-visible-panels');
      return saved ? { ...DEFAULT_VISIBLE_PANELS, ...JSON.parse(saved) } : DEFAULT_VISIBLE_PANELS;
    } catch {
      return DEFAULT_VISIBLE_PANELS;
    }
  });

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: dateRangeData } = useDateRange();

  const availableDateRange = {
    minDate: dateRangeData?.minDate ?? null,
    maxDate: dateRangeData?.maxDate ?? null,
  };

  useEffect(() => {
    if (dateRangeData && !dateRange.startDate) {
      const { minDate, maxDate } = dateRangeData;
      const maxDateObj = parseISO(maxDate);
      let startDateObj = subMonths(maxDateObj, 12);
      const minDateObj = parseISO(minDate);

      if (startDateObj < minDateObj) {
        startDateObj = minDateObj;
      }

      setDateRange({
        startDate: format(startDateObj, 'yyyy-MM-dd'),
        endDate: maxDate,
        preset: 'last12months',
      });
    }
  }, [dateRangeData, dateRange.startDate]);

  useEffect(() => {
    if (products.length > 0 && selectedProductIds.length === 0) {
      setSelectedProductIds(products.map((p) => p.id));
    }
  }, [products, selectedProductIds.length]);

  const updateDateRangePreset = useCallback(
    (preset: DateRangeState['preset']) => {
      if (preset === 'custom') return;

      const endDate = availableDateRange.maxDate
        ? parseISO(availableDateRange.maxDate)
        : new Date();
      const minDateLimit = availableDateRange.minDate
        ? parseISO(availableDateRange.minDate)
        : null;

      let startDate: Date;

      switch (preset) {
        case 'last30days':
          startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last90days':
          startDate = new Date(endDate);
          startDate.setDate(startDate.getDate() - 90);
          break;
        case 'last12months':
        default:
          startDate = subMonths(endDate, 12);
          break;
      }

      if (minDateLimit && startDate < minDateLimit) {
        startDate = minDateLimit;
      }

      setDateRange({
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        preset,
      });
    },
    [availableDateRange]
  );

  const updateDateRangeCustom = useCallback((startDate: string, endDate: string) => {
    setDateRange({
      startDate,
      endDate,
      preset: 'custom',
    });
  }, []);

  const updateSelectedProducts = useCallback((productIds: string[]) => {
    setSelectedProductIds(productIds);
  }, []);

  const updateComparisonMode = useCallback((mode: 'none' | 'previous' | 'yoy') => {
    setComparisonMode(mode);
  }, []);

  const addCustomPanel = useCallback((panel: Omit<CustomPanel, 'addedAt'>) => {
    const newPanel: CustomPanel = {
      ...panel,
      id: panel.id || crypto.randomUUID(),
      addedAt: Date.now(),
    };
    setCustomPanels((prev) => {
      const updated = [...prev, newPanel];
      localStorage.setItem('dashboard-custom-panels', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeCustomPanel = useCallback((panelId: string) => {
    setCustomPanels((prev) => {
      const updated = prev.filter((p) => p.id !== panelId);
      localStorage.setItem('dashboard-custom-panels', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const togglePanel = useCallback((panelId: keyof VisiblePanels) => {
    setVisiblePanels((prev) => {
      const updated = { ...prev, [panelId]: !prev[panelId] };
      localStorage.setItem('dashboard-visible-panels', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: DashboardContextValue = {
    dateRange,
    selectedProductIds,
    comparisonMode,
    customPanels,
    visiblePanels,
    products,
    productsLoading,
    availableDateRange,
    updateDateRangePreset,
    updateDateRangeCustom,
    updateSelectedProducts,
    updateComparisonMode,
    addCustomPanel,
    removeCustomPanel,
    togglePanel,
  };

  return (
    <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
  );
}
