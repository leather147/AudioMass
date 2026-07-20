import 'reflect-metadata';

import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module.js';
import { parseCorsOrigins } from './config/environment.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 2 * 1024 * 1024,
      trustProxy: true,
    }),
  );
  const config = app.get(ConfigService);
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
  });

  app.enableCors({
    credentials: true,
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS')),
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableVersioning({ defaultVersion: '1', type: VersioningType.URI });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      whitelist: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('AudioMass API')
    .setDescription('Project persistence and audio processing orchestration')
    .setVersion('1.0')
    .addApiKey({ in: 'header', name: 'x-api-key', type: 'apiKey' }, 'api-key')
    .build();
  const document = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/openapi.json',
  });

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
