import 'reflect-metadata';

let bootstrapFn: any = null;

async function getBootstrap() {
  if (bootstrapFn) return bootstrapFn;
  try {
    const distModule = require('../dist/src/main');
    bootstrapFn = distModule.bootstrap;
  } catch {
    const srcModule = require('../src/main');
    bootstrapFn = srcModule.bootstrap;
  }
  return bootstrapFn;
}

export default async function handler(req: any, res: any) {
  try {
    const bootstrap = await getBootstrap();
    const app = await bootstrap();
    const server = app.getHttpAdapter().getInstance();
    return server(req, res);
  } catch (error: any) {
    console.error('Vercel Serverless Bootstrap Error:', error);
    if (res && typeof res.status === 'function') {
      return res.status(500).json({
        success: false,
        error: 'Vercel Serverless Initialization Error',
        message: error?.message || String(error),
        hint: 'Verify that DATABASE_URL is set in Vercel Environment Variables',
      });
    }
    throw error;
  }
}
