import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl, body } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - now;
        this.logger.log(
          `[${method}] ${originalUrl} - ${duration}ms`,
          'HTTP',
          body,
          response
        );
      }),
      catchError((err) => {
        const duration = Date.now() - now;
        this.logger.error(
          `[${method}] ${originalUrl} - ${duration}ms - ${err.message}`,
          err.stack,
          'HTTP',
          body,
          err.response
        );
        throw err;
      })
    );
  }
}
