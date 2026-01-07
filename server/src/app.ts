import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createRouter } from './routes';
import { getDatabase } from './database';

export async function createApp() {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:3002', 'http://localhost:3003'],
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const db = getDatabase();
  await db.connect();

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      database: db.isConnected()
    });
  });

  app.use('/api', createRouter());

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  return app;
}
