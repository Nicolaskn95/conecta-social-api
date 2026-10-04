import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import ErrorFilter from '../src/common/filter/error.filter';
import { ResponseInterceptor } from '../src/common/interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import pino from 'pino-http';
import { LoggerService } from '../src/common/logger/logger.service';
import { LoggingInterceptor } from '../src/common/interceptor/logging.interceptor';

let cachedServer: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const logger = app.get(LoggerService);
  app.useGlobalFilters(new ErrorFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );
  app.use(
    pino({
      transport: {
        target: 'pino-pretty',
      },
    })
  );
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const config = new DocumentBuilder()
    .setTitle('API Conecta Social')
    .setDescription('Documentação da API de Funcionários')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
}
