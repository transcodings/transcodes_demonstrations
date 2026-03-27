import { apiClient, ApiResponse } from './client';

export interface PayoutTransaction {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  date: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Earnings {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  paidOut: number;
}

export interface PayoutData {
  earnings: Earnings;
  transactions: PayoutTransaction[];
}

export interface CreatePayoutRequest {
  amount: number;
  description?: string;
}

export interface CreatePayoutResponse {
  message: string;
  transaction: PayoutTransaction;
  earnings: Earnings;
}

export const payoutApi = {
  // Get all payout data (earnings + transactions)
  getAll: (): Promise<ApiResponse<PayoutData>> => {
    return apiClient.get<PayoutData>('/payouts');
  },

  // Get earnings summary
  getEarnings: (): Promise<ApiResponse<Earnings>> => {
    return apiClient.get<Earnings>('/payouts/earnings');
  },

  // Get all transactions
  getTransactions: (): Promise<ApiResponse<PayoutTransaction[]>> => {
    return apiClient.get<PayoutTransaction[]>('/payouts/transactions');
  },

  // Get a specific transaction
  getTransaction: (id: string): Promise<ApiResponse<PayoutTransaction>> => {
    return apiClient.get<PayoutTransaction>(`/payouts/transactions/${id}`);
  },

  // Request a new payout (requires step-up session)
  // sid is included in the request body for demo purposes
  requestPayout: (data: CreatePayoutRequest, sid: string): Promise<ApiResponse<CreatePayoutResponse>> => {
    return apiClient.post<CreatePayoutResponse>('/payouts/request', { ...data, sid });
  },

  // Update transaction status
  updateTransactionStatus: (
    id: string,
    status: PayoutTransaction['status'],
  ): Promise<ApiResponse<{ message: string; transaction: PayoutTransaction }>> => {
    return apiClient.patch(`/payouts/transactions/${id}/status`, { status });
  },

  // Delete a transaction
  deleteTransaction: (
    id: string,
  ): Promise<ApiResponse<{ message: string; transaction: PayoutTransaction }>> => {
    return apiClient.delete(`/payouts/transactions/${id}`);
  },

  // Reset payout data to default (for demo purposes)
  reset: (): Promise<ApiResponse<PayoutData>> => {
    return apiClient.post<PayoutData>('/payouts/reset');
  },
};
