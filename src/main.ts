import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
  .setTitle('Jobs API')
  .setDescription('The job API description')
  .setVersion('1.0')
  .addTag('Jobs')
  .build();
const document = SwaggerModule.createDocument(app, config);

SwaggerModule.setup('api', app, document);
  const configService = app.get(ConfigService);
  app.use(cookieParser());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  const port = configService.get<number>('PORT');
  await app.listen(port);
}
bootstrap();
