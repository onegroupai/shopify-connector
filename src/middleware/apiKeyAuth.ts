import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-connector-key');
  if (!key || key !== config.CONNECTOR_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}