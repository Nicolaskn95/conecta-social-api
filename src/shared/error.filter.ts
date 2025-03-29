import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export default class ErrorFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();

    // Verifica se a exceção é do tipo HttpException, para pegar o status apropriado
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500; // Status 500 por padrão para exceções genéricas

    console.error(exception); // Log da exceção para debug

    // Resposta com informações sobre a exceção
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof Error ? exception.message : 'Unknown error',
    });
  }
}
