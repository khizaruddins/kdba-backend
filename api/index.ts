import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { bootstrap } from '../src/main';

let cachedServer: Express | null = null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (!cachedServer) {
    const app = await bootstrap();
    const expressApp = app.getHttpAdapter().getInstance() as Express;
    
    // Crucial for Vercel's proxy environment
    expressApp.set('trust proxy', 1);
    
    cachedServer = expressApp;
  }
  return cachedServer(req, res);
}