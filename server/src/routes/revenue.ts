import { Router, Request, Response } from 'express';
import {
  MonthlyRevenue,
  MonthlyRevenueDetail,
  RevenueData,
  RevenueSummary,
} from '../types/revenue';
import { verifyStepUpSession, StepUpAuthRequest } from '../middleware/stepUpAuth';

const router = Router();

// Mock Revenue Data
const monthlyData: MonthlyRevenue[] = [
  { month: 'Jan 2024', revenue: 45000, transactions: 234 },
  { month: 'Feb 2024', revenue: 52000, transactions: 267 },
  { month: 'Mar 2024', revenue: 48000, transactions: 245 },
  { month: 'Apr 2024', revenue: 61000, transactions: 312 },
  { month: 'May 2024', revenue: 58000, transactions: 298 },
  { month: 'Jun 2024', revenue: 67000, transactions: 342 },
  { month: 'Jul 2024', revenue: 72000, transactions: 368 },
  { month: 'Aug 2024', revenue: 69000, transactions: 354 },
  { month: 'Sep 2024', revenue: 78000, transactions: 398 },
  { month: 'Oct 2024', revenue: 84000, transactions: 429 },
  { month: 'Nov 2024', revenue: 91000, transactions: 465 },
  { month: 'Dec 2024', revenue: 95000, transactions: 486 },
];

const monthlyDetails: MonthlyRevenueDetail[] = [
  {
    month: 'Dec 2024',
    revenue: 95000,
    fees: 2850,
    netRevenue: 92150,
    transactions: 486,
    avgTransaction: 195.47,
  },
  {
    month: 'Nov 2024',
    revenue: 91000,
    fees: 2730,
    netRevenue: 88270,
    transactions: 465,
    avgTransaction: 195.7,
  },
  {
    month: 'Oct 2024',
    revenue: 84000,
    fees: 2520,
    netRevenue: 81480,
    transactions: 429,
    avgTransaction: 195.8,
  },
  {
    month: 'Sep 2024',
    revenue: 78000,
    fees: 2340,
    netRevenue: 75660,
    transactions: 398,
    avgTransaction: 195.98,
  },
  {
    month: 'Aug 2024',
    revenue: 69000,
    fees: 2070,
    netRevenue: 66930,
    transactions: 354,
    avgTransaction: 194.92,
  },
  {
    month: 'Jul 2024',
    revenue: 72000,
    fees: 2160,
    netRevenue: 69840,
    transactions: 368,
    avgTransaction: 195.65,
  },
  {
    month: 'Jun 2024',
    revenue: 67000,
    fees: 2010,
    netRevenue: 64990,
    transactions: 342,
    avgTransaction: 195.91,
  },
  {
    month: 'May 2024',
    revenue: 58000,
    fees: 1740,
    netRevenue: 56260,
    transactions: 298,
    avgTransaction: 194.63,
  },
  {
    month: 'Apr 2024',
    revenue: 61000,
    fees: 1830,
    netRevenue: 59170,
    transactions: 312,
    avgTransaction: 195.51,
  },
  {
    month: 'Mar 2024',
    revenue: 48000,
    fees: 1440,
    netRevenue: 46560,
    transactions: 245,
    avgTransaction: 195.92,
  },
  {
    month: 'Feb 2024',
    revenue: 52000,
    fees: 1560,
    netRevenue: 50440,
    transactions: 267,
    avgTransaction: 194.76,
  },
  {
    month: 'Jan 2024',
    revenue: 45000,
    fees: 1350,
    netRevenue: 43650,
    transactions: 234,
    avgTransaction: 192.31,
  },
];

// Calculate summary
const calculateSummary = (): RevenueSummary => {
  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTransactions = monthlyData.reduce((sum, item) => sum + item.transactions, 0);
  const avgMonthlyRevenue = totalRevenue / monthlyData.length;
  const currentMonthRevenue = monthlyData[monthlyData.length - 1].revenue;
  const previousMonthRevenue = monthlyData[monthlyData.length - 2].revenue;
  const growthRate = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  return {
    totalRevenue,
    totalTransactions,
    avgMonthlyRevenue,
    currentMonthRevenue,
    previousMonthRevenue,
    growthRate,
  };
};

// GET /api/revenue - Get all revenue data
router.get('/', (req: Request, res: Response) => {
  const data: RevenueData = {
    monthlyData,
    monthlyDetails,
  };
  res.json(data);
});

// GET /api/revenue/summary - Get revenue summary
router.get('/summary', (req: Request, res: Response) => {
  const summary = calculateSummary();
  res.json(summary);
});

// GET /api/revenue/monthly - Get monthly revenue data
router.get('/monthly', (req: Request, res: Response) => {
  res.json(monthlyData);
});

// GET /api/revenue/details - Get monthly revenue details
router.get('/details', (req: Request, res: Response) => {
  res.json(monthlyDetails);
});

// POST /api/revenue/export/csv - Export revenue data as CSV (requires step-up auth)
// Using POST to receive sid in request body for demo purposes
router.post('/export/csv', verifyStepUpSession, (req: StepUpAuthRequest, res: Response) => {
  // Log step-up session info
  console.log('='.repeat(60));
  console.log('[Revenue] Processing CSV Export');
  console.log('  SID:', req.stepUpSession?.sessionId);
  console.log('  User ID:', req.stepUpSession?.userId);
  console.log('  Project ID:', req.stepUpSession?.projectId);
  console.log('  Action:', req.stepUpSession?.action);
  console.log('  Role:', req.stepUpSession?.role);
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  const headers = ['Month', 'Revenue', 'Fees', 'Net Revenue', 'Transactions', 'Avg Transaction'];
  const csvContent = [
    headers.join(','),
    ...monthlyDetails.map((row) =>
      [
        row.month,
        row.revenue,
        row.fees,
        row.netRevenue,
        row.transactions,
        row.avgTransaction.toFixed(2),
      ].join(','),
    ),
  ].join('\n');

  const filename = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

export default router;
