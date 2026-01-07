import { useRef, useEffect } from 'react';
import { DashboardProvider, useDashboard } from '@/context';
import { useMonthlyMetrics } from '@/hooks';
import { AppSidebar, DashboardHeader } from '@/components/layout';
import { KPICard } from '@/components/dashboard';
import { RevenueChart, ProductChart, MarginChart, DynamicChart, ProductBreakdownChart, StackedRevenueChart } from '@/components/charts';
import { X } from 'lucide-react';
import type { AggregatedMetric } from '@/types';

function DashboardContent() {
  const { dateRange, selectedProductIds, comparisonMode, customPanels, removeCustomPanel, visiblePanels } =
    useDashboard();

  const customPanelsRef = useRef<HTMLDivElement>(null);
  const prevPanelCountRef = useRef(customPanels.length);

  useEffect(() => {
    if (customPanels.length > prevPanelCountRef.current && customPanelsRef.current) {
      customPanelsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevPanelCountRef.current = customPanels.length;
  }, [customPanels.length]);

  const { data: metricsData, isLoading: loading } = useMonthlyMetrics(
    dateRange.startDate ?? undefined,
    dateRange.endDate ?? undefined,
    selectedProductIds,
    comparisonMode
  );

  const summary = metricsData?.summary;
  const comparison = metricsData?.comparison;

  const comparisonSummary =
    comparison && comparison.length > 0
      ? comparison.reduce(
          (acc: { totalRevenue: number; grossProfit: number; grossMargin: number; operatingCashFlow: number; totalExpenses: number }, item: AggregatedMetric) => ({
            totalRevenue: acc.totalRevenue + item.totalRevenue,
            grossProfit: acc.grossProfit + item.grossProfit,
            grossMargin: 0,
            operatingCashFlow: acc.operatingCashFlow + item.operatingCashFlow,
            totalExpenses: acc.totalExpenses + item.totalExpenses,
          }),
          { totalRevenue: 0, grossProfit: 0, grossMargin: 0, operatingCashFlow: 0, totalExpenses: 0 }
        )
      : null;

  if (comparisonSummary && comparisonSummary.totalRevenue > 0) {
    comparisonSummary.grossMargin =
      (comparisonSummary.grossProfit / comparisonSummary.totalRevenue) * 100;
  }

  const comparisonLabel =
    comparisonMode === 'previous' ? 'MoM' : comparisonMode === 'yoy' ? 'YoY' : null;

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {loading && !summary ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                Loading metrics...
              </div>
            ) : summary ? (
              <>
                <KPICard
                  title="Revenue, $"
                  value={summary.totalRevenue}
                  format="currency"
                  comparisonValue={comparisonSummary?.totalRevenue}
                  comparisonLabel={comparisonLabel}
                />
                <KPICard
                  title="Gross Margin, $"
                  value={summary.grossProfit}
                  format="currency"
                  comparisonValue={comparisonSummary?.grossProfit}
                  comparisonLabel={comparisonLabel}
                />
                <KPICard
                  title="OpEx, $"
                  value={summary.totalExpenses}
                  format="currency"
                  comparisonValue={comparisonSummary?.totalExpenses}
                  comparisonLabel={comparisonLabel}
                />
                <KPICard
                  title="Net Profit, $"
                  value={summary.grossProfit - (summary.totalExpenses || 0)}
                  format="currency"
                  comparisonValue={null}
                  comparisonLabel={comparisonLabel}
                />
                <KPICard
                  title="Cash Balance, $"
                  value={summary.operatingCashFlow}
                  format="currency"
                  comparisonValue={comparisonSummary?.operatingCashFlow}
                  comparisonLabel={comparisonLabel}
                />
                <KPICard
                  title="Runway"
                  value={summary.grossMargin}
                  isPercent={true}
                  comparisonValue={comparisonSummary?.grossMargin}
                  comparisonLabel={comparisonLabel}
                />
              </>
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {visiblePanels.revenue && (
              <div className="lg:col-span-2">
                <RevenueChart />
              </div>
            )}
            {visiblePanels.product && (
              <div>
                <ProductChart />
              </div>
            )}
            {visiblePanels.margin && (
              <div className="lg:col-span-2">
                <MarginChart />
              </div>
            )}
            {visiblePanels.productBreakdown && (
              <div className="lg:col-span-2">
                <ProductBreakdownChart />
              </div>
            )}
            {visiblePanels.stackedRevenue && (
              <div className="lg:col-span-2">
                <StackedRevenueChart />
              </div>
            )}
          </div>

          {customPanels && customPanels.length > 0 && (
            <div className="mt-6" ref={customPanelsRef}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Generated Charts</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {customPanels.map((panel) => (
                  <div
                    key={panel.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="text-sm font-medium text-gray-900">{panel.title}</h3>
                      <button
                        onClick={() => removeCustomPanel(panel.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Remove from dashboard"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="p-4">
                      <DynamicChart config={panel} height={200} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default App;
