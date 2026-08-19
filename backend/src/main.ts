import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Global API prefix — everything mounts under /api (e.g. /api/auth/login).
  app.setGlobalPrefix('api');

  // Validation: strip unknown props, transform payloads to typed instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cookies (httpOnly auth cookie) + CORS with credentials for the frontend.
  app.use(cookieParser());
  const configuredCorsOrigins =
    config.get<string>('CORS_ORIGIN') ??
    'http://localhost:3000,https://kwmoc-complaint-frontend.vercel.app';
  const corsOrigins = configuredCorsOrigins
    .split(',')
    .map((s: string) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (!corsOrigins.includes('https://kwmoc-complaint-frontend.vercel.app')) {
    corsOrigins.push('https://kwmoc-complaint-frontend.vercel.app');
  }
  app.enableCors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '');
      return callback(null, corsOrigins.includes(normalizedOrigin));
    },
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // JwtAuthGuard is registered globally via APP_GUARD in AppModule (DI-aware,
  // so its Reflector dependency is injected). No manual useGlobalGuards here.

  // Swagger / OpenAPI docs at /api.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KwaraMOc Complaints API')
    .setDescription('Complaint Management & Ticketing System — backend API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Serve uploaded files statically (local storage dev).
  app.useStaticAssets(path.resolve(process.env.UPLOADS_DIR ?? './uploads'), {
    prefix: '/uploads/',
  });

  // Graceful drain on SIGTERM/SIGINT (nestjs-features-performance: "drain before shutdown").
  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  Logger.log(`🚀 Backend running on http://localhost:${port}`, 'Bootstrap');
  Logger.log(`📘 Swagger at http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
