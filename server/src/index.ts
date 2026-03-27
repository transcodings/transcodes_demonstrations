import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import todoRoutes from './routes/todos';
import healthRoutes from './routes/health';
import payoutRoutes from './routes/payouts';
import revenueRoutes from './routes/revenue';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3007;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5180',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/revenue', revenueRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Refine Dashboard Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      todos: '/api/todos',
      payouts: '/api/payouts',
      revenue: '/api/revenue',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
  console.log(`🌍[server]: Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
