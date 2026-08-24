import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import { bootstrap } from '../src/main';

let cachedServer: Express | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cachedServer) {
    const app = await bootstrap();
    cachedServer = app.getHttpAdapter().getInstance() as Express;
  }
  return cachedServer(req, res);
}