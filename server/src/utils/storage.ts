import fs from 'fs';
import path from 'path';

/** Project root is cwd when running via npm/tsx from `application/` (avoids __dirname in ESM). */
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const PAYOUTS_FILE = path.join(DATA_DIR, 'payouts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StorageData {
  earnings: {
    totalEarned: number;
    availableBalance: number;
    pendingBalance: number;
    paidOut: number;
  };
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    date: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

const defaultData: StorageData = {
  earnings: {
    totalEarned: 12450.75,
    availableBalance: 8320.5,
    pendingBalance: 2130.25,
    paidOut: 2000.0,
  },
  transactions: [
    {
      id: '1',
      amount: 1500.0,
      currency: 'USD',
      status: 'completed',
      date: '2024-12-15',
      description: 'December payout',
      createdAt: '2024-12-15T10:00:00.000Z',
      updatedAt: '2024-12-15T10:00:00.000Z',
    },
    {
      id: '2',
      amount: 500.0,
      currency: 'USD',
      status: 'completed',
      date: '2024-11-15',
      description: 'November payout',
      createdAt: '2024-11-15T10:00:00.000Z',
      updatedAt: '2024-11-15T10:00:00.000Z',
    },
    {
      id: '3',
      amount: 2130.25,
      currency: 'USD',
      status: 'pending',
      date: '2025-01-05',
      description: 'Pending settlement',
      createdAt: '2025-01-05T10:00:00.000Z',
      updatedAt: '2025-01-05T10:00:00.000Z',
    },
  ],
};

/**
 * Load payout data from file
 */
export function loadPayoutData(): StorageData {
  try {
    if (fs.existsSync(PAYOUTS_FILE)) {
      const data = fs.readFileSync(PAYOUTS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading payout data:', error);
  }
  
  // If file doesn't exist or error, return default and save it
  savePayoutData(defaultData);
  return defaultData;
}

/**
 * Save payout data to file
 */
export function savePayoutData(data: StorageData): void {
  try {
    fs.writeFileSync(PAYOUTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving payout data:', error);
  }
}

/**
 * Reset payout data to default
 */
export function resetPayoutData(): StorageData {
  savePayoutData(defaultData);
  return defaultData;
}
