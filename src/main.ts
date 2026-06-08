import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Strip unknown fields and validate all incoming request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strip properties not in the DTO
      forbidNonWhitelisted: false,
      transform: true,       // auto-transform payloads to DTO class instances
    }),
  );

  // Honour @Exclude() decorators on entity classes globally
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Jobs API')
    .setDescription('Job Portal REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT');
  await app.listen(port);
}
bootstrap();
