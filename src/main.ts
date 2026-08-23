import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

let app: INestApplication | null = null;

/**
 * Bootstrap NestJS application.
 *
 * This function is intentionally exported because the Vercel
 * serverless handler imports it.
 *
 * The application is initialized only once per warm Vercel
 * function instance.
 */
export async function bootstrap(): Promise<INestApplication> {
  if (app) {
    return app;
  }

  const nestApp = await NestFactory.create(AppModule);

  const configService = nestApp.get(ConfigService);

  // ---------------------------------------------------------------------------
  // Environment
  // ---------------------------------------------------------------------------

  const port = configService.get<number>('PORT', 4000);

  // ---------------------------------------------------------------------------
  // Global API Prefix
  // ---------------------------------------------------------------------------

  nestApp.setGlobalPrefix('api/v1');

  // ---------------------------------------------------------------------------
  // Security Headers
  // ---------------------------------------------------------------------------

  nestApp.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }),
  );

  // ---------------------------------------------------------------------------
  // Cookie Parser
  // ---------------------------------------------------------------------------

  nestApp.use(cookieParser());

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------

  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  const allowedOrigins =
    corsOrigin === '*'
      ? true
      : corsOrigin
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean);

  nestApp.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------------------------------
  // Global Validation
  // ---------------------------------------------------------------------------

  nestApp.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ---------------------------------------------------------------------------
  // Global Exception Filter
  // ---------------------------------------------------------------------------

  nestApp.useGlobalFilters(new HttpExceptionFilter());

  // ---------------------------------------------------------------------------
  // Global Response Interceptor
  // ---------------------------------------------------------------------------

  nestApp.useGlobalInterceptors(new TransformInterceptor());

  // ---------------------------------------------------------------------------
  // Swagger
  // ---------------------------------------------------------------------------

  const publicApiUrl =
    configService.get<string>('PUBLIC_API_URL') ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : `http://localhost:${port}`);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KDBA API')
    .setDescription('KDBA - Khizar Digital Branding Agency API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT access token',
        in: 'header',
      },
      'access-token',
    )
    .addCookieAuth('refreshToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'refreshToken',
    })
    .addServer(publicApiUrl, 'Current Server')
    .build();

  const document = SwaggerModule.createDocument(nestApp, swaggerConfig);

  SwaggerModule.setup('docs', nestApp, document, {
    customSiteTitle: 'KDBA API Documentation',

    customCssUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',

    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
    ],

    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
    },
  });

  // ---------------------------------------------------------------------------
  // Initialize NestJS
  // ---------------------------------------------------------------------------

  await nestApp.init();

  // Cache the initialized application for warm invocations.
  app = nestApp;

  console.log('🚀 KDBA NestJS application initialized');

  console.log(`📖 Swagger: ${publicApiUrl}/docs`);

  return app;
}

/**
 * Local development only.
 *
 * Vercel does NOT execute app.listen().
 * The Vercel serverless handler is responsible for receiving
 * HTTP requests.
 */
if (!process.env.VERCEL) {
  void bootstrap()
    .then(async (nestApp) => {
      const configService = nestApp.get(ConfigService);

      const port = configService.get<number>('PORT', 4000);

      await nestApp.listen(port);

      console.log(`🚀 KDBA API running at http://localhost:${port}`);

      console.log(`📖 Swagger: http://localhost:${port}/docs`);
    })
    .catch((err: unknown) => {
      console.error('❌ Failed to start application locally:', err);
      process.exit(1);
    });
}
