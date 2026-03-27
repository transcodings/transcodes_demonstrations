import { Router, Request, Response } from 'express';
import {
  PayoutTransaction,
  Earnings,
  PayoutData,
  CreatePayoutRequest,
  UpdateTransactionStatusRequest,
} from '../types/payout';
import { verifyStepUpSession, StepUpAuthRequest } from '../middleware/stepUpAuth';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { loadPayoutData, savePayoutData } from '../utils/storage';

const router = Router();

// Load data from file on startup
let { earnings, transactions } = loadPayoutData();

// GET /api/payouts - Get all payout data (earnings + transactions)
// Requires Bearer token from Transcodes SDK
router.get('/', verifyToken, (req: AuthRequest, res: Response) => {
  console.log('='.repeat(60));
  console.log('[Payouts] GET /api/payouts');
  console.log('  ✅ Token verified successfully');
  console.log('  sub (userId):', req.user?.sub);
  console.log('  email:', req.user?.email);
  console.log('  role:', req.user?.role);
  console.log('  projectId:', req.user?.projectId);
  console.log('  iat:', req.user?.iat ? new Date(req.user.iat * 1000).toISOString() : '-');
  console.log('  exp:', req.user?.exp ? new Date(req.user.exp * 1000).toISOString() : '-');
  console.log('='.repeat(60));

  // Reload from file to get latest data
  const data = loadPayoutData();
  earnings = data.earnings;
  transactions = data.transactions;

  const responseData: PayoutData = {
    earnings,
    transactions: transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ),
  };
  res.json(responseData);
});

// GET /api/payouts/earnings - Get earnings summary
router.get('/earnings', (req: Request, res: Response) => {
  const data = loadPayoutData();
  res.json(data.earnings);
});

// GET /api/payouts/transactions - Get all transactions
router.get('/transactions', (req: Request, res: Response) => {
  const data = loadPayoutData();
  const sortedTransactions = data.transactions.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  res.json(sortedTransactions);
});

// GET /api/payouts/transactions/:id - Get a specific transaction
router.get('/transactions/:id', (req: Request, res: Response) => {
  const data = loadPayoutData();
  const transaction = data.transactions.find((t) => t.id === req.params.id);

  if (!transaction) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json(transaction);
});

// POST /api/payouts/request - Request a new payout (requires step-up auth)
router.post('/request', verifyStepUpSession, (req: StepUpAuthRequest, res: Response) => {
  const { amount, description }: CreatePayoutRequest = req.body;
  
  // Log step-up session info
  console.log('='.repeat(60));
  console.log('[Payout] Processing Payout Request');
  console.log('  SID:', req.stepUpSession?.sessionId);
  console.log('  User ID:', req.stepUpSession?.userId);
  console.log('  Project ID:', req.stepUpSession?.projectId);
  console.log('  Action:', req.stepUpSession?.action);
  console.log('  Role:', req.stepUpSession?.role);
  console.log('  Amount:', amount);
  console.log('  Description:', description);
  console.log('  Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));

  // Validate amount
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  if (amount > earnings.availableBalance) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  // Load current data
  const data = loadPayoutData();
  earnings = data.earnings;
  transactions = data.transactions;

  // Create new transaction
  const newTransaction: PayoutTransaction = {
    id: Date.now().toString(),
    amount,
    currency: 'USD',
    status: 'processing',
    date: new Date().toISOString().split('T')[0],
    description: description || 'Payout initiated',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  transactions.unshift(newTransaction);

  // Update earnings
  earnings.availableBalance -= amount;
  earnings.paidOut += amount;

  // Save to file
  savePayoutData({ earnings, transactions });

  res.status(201).json({
    message: 'Payout request created successfully',
    transaction: newTransaction,
    earnings,
  });
});

// PATCH /api/payouts/transactions/:id/status - Update transaction status
router.patch('/transactions/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status }: UpdateTransactionStatusRequest = req.body;

  if (!status || !['pending', 'processing', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  // Load current data
  const data = loadPayoutData();
  transactions = data.transactions;

  const transactionIndex = transactions.findIndex((t) => t.id === id);

  if (transactionIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  transactions[transactionIndex] = {
    ...transactions[transactionIndex],
    status,
    updatedAt: new Date().toISOString(),
  };

  // Save to file
  savePayoutData({ earnings: data.earnings, transactions });

  res.json({
    message: 'Transaction status updated',
    transaction: transactions[transactionIndex],
  });
});

// DELETE /api/payouts/transactions/:id - Delete a transaction (admin only)
router.delete('/transactions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  // Load current data
  const data = loadPayoutData();
  transactions = data.transactions;
  
  const transactionIndex = transactions.findIndex((t) => t.id === id);

  if (transactionIndex === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const deletedTransaction = transactions[transactionIndex];
  transactions = transactions.filter((t) => t.id !== id);

  // Save to file
  savePayoutData({ earnings: data.earnings, transactions });

  res.json({
    message: 'Transaction deleted successfully',
    transaction: deletedTransaction,
  });
});

// POST /api/payouts/reset - Reset payout data to default (for demo purposes)
router.post('/reset', (req: Request, res: Response) => {
  const { resetPayoutData } = require('../utils/storage');
  const data = resetPayoutData();
  
  console.log('🔄 Payout data reset to default');
  
  res.json({
    message: 'Payout data reset successfully',
    earnings: data.earnings,
    transactions: data.transactions,
  });
});

export default router;
