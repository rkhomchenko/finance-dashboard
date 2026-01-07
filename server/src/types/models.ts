export interface Product {
  id: string;
  name: string;
  category: string;
  launchDate: string;
}

export interface CategoryBreakdown {
  subscription_revenue?: number;
  setup_fees?: number;
  professional_services?: number;
  overage_fees?: number;
  salaries?: number;
  marketing?: number;
  infrastructure?: number;
  software?: number;
  operations?: number;
}

export interface Metric {
  date: string;
  productId: string;
  productName: string;
  revenueByCategory: CategoryBreakdown;
  totalRevenue: number;
  expensesByCategory: CategoryBreakdown;
  totalExpenses: number;
  grossProfit: number;
  grossMargin: number;
  operatingCashFlow: number;
  netProfit: number;
  cac: number;
  ltv: number;
  ltvCacRatio: number;
  mau: number;
}

export interface Dataset {
  products: Product[];
  revenueCategories: string[];
  expenseCategories: string[];
  metrics: Metric[];
}
