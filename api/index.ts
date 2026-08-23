import { bootstrap } from '../src/main';

export default async function handler(req: any, res: any) {
  try {
    const app = await bootstrap();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error: any) {
    console.error('CRITICAL SERVERLESS BOOTSTRAP ERROR:', error);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        success: false,
        error: 'Serverless initialization failed',
        message: error?.message || String(error),
        timestamp: new Date().toISOString(),
      });
    }
    throw error;
  }
}
