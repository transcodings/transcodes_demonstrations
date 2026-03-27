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

export interface UpdateTransactionStatusRequest {
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
