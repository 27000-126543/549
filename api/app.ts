import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import schedulingRoutes from './routes/scheduling.js';
import approvalRoutes from './routes/approvals.js';
import monitoringRoutes from './routes/monitoring.js';
import analyticsRoutes from './routes/analytics.js';
import exceptionRoutes from './routes/exceptions.js';
import tenantRoutes from './routes/tenants.js';
import { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDatabase();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/tenants', tenantRoutes);

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    });
  },
);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    timestamp: Date.now(),
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API不存在',
    data: null,
    timestamp: Date.now(),
  });
});

export default app;
