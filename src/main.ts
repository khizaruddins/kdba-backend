import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // ---------------------------------------------------------------------------
  // Global API Prefix
  // ---------------------------------------------------------------------------

  app.setGlobalPrefix('api/v1');

  // ---------------------------------------------------------------------------
  // Security Headers
  // ---------------------------------------------------------------------------

  app.use(
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

  app.use(cookieParser());

  // ---------------------------------------------------------------------------
  // CORS
  // ---------------------------------------------------------------------------

  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  const allowedOrigins =
    corsOrigin === '*'
      ? true
      : corsOrigin.includes(',')
        ? corsOrigin.split(',').map((origin) => origin.trim())
        : corsOrigin.trim();

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ---------------------------------------------------------------------------
  // Global Validation
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Global Exception Filter
  // ---------------------------------------------------------------------------

  app.useGlobalFilters(new HttpExceptionFilter());

  // ---------------------------------------------------------------------------
  // Global Response Interceptor
  // ---------------------------------------------------------------------------

  app.useGlobalInterceptors(new TransformInterceptor());

  // ---------------------------------------------------------------------------
  // Swagger
  // ---------------------------------------------------------------------------

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
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
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
  // Start Application
  // ---------------------------------------------------------------------------

  const port = configService.get<number>('PORT', 4000);

  await app.listen(port);

  console.log(`🚀 KDBA API running on port ${port}`);

  console.log(`📖 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
