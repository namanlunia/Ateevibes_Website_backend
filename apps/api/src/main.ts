import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') || 'api/v1';

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // CORS configuration
  const isProduction = process.env.NODE_ENV === "production";
  const rawOrigins = configService.get<string>("CORS_ORIGINS");
  const allowedOrigins = rawOrigins
    ? rawOrigins
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : [];

  const allowAllInDev = !isProduction && allowedOrigins.length === 0;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      if (allowAllInDev) {
        return callback(null, true);
      }
      const isAllowed =
        allowedOrigins.includes(origin) ||
        (() => {
          try {
            const { hostname } = new URL(origin);
            return hostname === "vercel.app" || hostname.endsWith(".vercel.app");
          } catch {
            return origin.endsWith(".vercel.app");
          }
        })();

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Serve static uploaded media safely
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Ateevibes Commerce Engine API')
    .setDescription(
      'Authoritative REST API for Ateevibes menswear storefront and private admin operations platform.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Ateevibes API Documentation',
  });

  await app.listen(port);
  logger.log(`Ateevibes Commerce Backend running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Interactive OpenAPI Documentation at: http://localhost:${port}/api/docs`);
}

bootstrap();
