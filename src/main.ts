import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import ErrorFilter from './common/filter/error.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptors';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalFilters(new ErrorFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não definidos nos DTOs
      forbidNonWhitelisted: true, // lança erro se passar campo inválido
      transform: true, // habilita o transform para DTOs
    })
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
