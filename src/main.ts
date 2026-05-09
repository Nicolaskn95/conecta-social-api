import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ErrorFilter from './common/filter/error.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import pino from 'pino-http';
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor';

const DEFAULT_CORS_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/+$/, '');
}

function getAllowedCorsOrigins() {
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const allowedCorsOrigins = getAllowedCorsOrigins();
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedCorsOrigins.includes(normalizeOrigin(origin))) {
          return callback(null, true);
        }

        return callback(new Error('Origem bloqueada por CORS'), false);
      },
      credentials: true,
    },
  });
  const logger = app.get(LoggerService); // ✅ simples e funciona

  app.useGlobalFilters(new ErrorFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não definidos nos DTOs
      forbidNonWhitelisted: true, // lança erro se passar campo inválido
      transform: true, // habilita o transform para DTOs
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

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
