import express from 'express';
import rateLimit from 'express-rate-limit';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { logger } from './utils/logger.js';
import contentRoutes from './routes/content.js';
import catalogRoutes from './routes/catalog.js';

export function createServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // basic rate limiter
  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use(limiter);

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // secure all POST endpoints with API key
  app.use((req, res, next) => {
    if (req.method === 'POST') return apiKeyAuth(req, res, next);
    next();
  });

  app.use('/content', contentRoutes);
  app.use('/catalog', catalogRoutes);

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

  // error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}