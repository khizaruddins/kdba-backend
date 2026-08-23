import { NestFactory } from '@nestjs/core';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';

const server: Express = express();
let cachedApp: INestApplication | null = null;

export async function bootstrap(): Promise<INestApplication> {
  if (cachedApp) {
    return cachedApp;
  }

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Security
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(cookieParser());

  // CORS
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.includes(',') ? corsOrigin.split(',') : corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger (optional in production)
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('KDBA API')
      .setDescription('KDBA - Khizar Digital Branding Agency API')
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refreshToken')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.init();
  cachedApp = app;
  return app;
}

// If running in local standalone dev mode (npm run start:dev)
if (!process.env.VERCEL) {
  bootstrap().then(async (app) => {
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 4000);
    await app.listen(port);
    console.log(`🚀 KDBA API running locally on http://localhost:${port}`);
    console.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
  });
}

// Vercel Serverless Function Handler
export default async function handler(req: Request, res: Response) {
  await bootstrap();
  server(req, res);
}
