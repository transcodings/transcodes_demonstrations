export interface MonthlyRevenue {
  month: string;
  revenue: number;
  transactions: number;
}

export interface MonthlyRevenueDetail {
  month: string;
  revenue: number;
  fees: number;
  netRevenue: number;
  transactions: number;
  avgTransaction: number;
}

export interface RevenueData {
  monthlyData: MonthlyRevenue[];
  monthlyDetails: MonthlyRevenueDetail[];
}

export interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  avgMonthlyRevenue: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  growthRate: number;
}
