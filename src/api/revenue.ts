import { apiClient, API_BASE_URL, ApiResponse } from './client';

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

export const revenueApi = {
  // Get all revenue data
  getAll: (): Promise<ApiResponse<RevenueData>> => {
    return apiClient.get<RevenueData>('/revenue');
  },

  // Get revenue summary
  getSummary: (): Promise<ApiResponse<RevenueSummary>> => {
    return apiClient.get<RevenueSummary>('/revenue/summary');
  },

  // Get monthly revenue data
  getMonthly: (): Promise<ApiResponse<MonthlyRevenue[]>> => {
    return apiClient.get<MonthlyRevenue[]>('/revenue/monthly');
  },

  // Get monthly revenue details
  getDetails: (): Promise<ApiResponse<MonthlyRevenueDetail[]>> => {
    return apiClient.get<MonthlyRevenueDetail[]>('/revenue/details');
  },

  // Export revenue data as CSV (requires step-up session)
  // Using POST instead of GET to include sid in request body for demo purposes
  exportCSV: async (sid: string): Promise<{ data?: Blob; error?: string; filename?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/revenue/export/csv`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sid }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;

      return { data: blob, filename };
    } catch (error) {
      console.error('CSV export failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
};
