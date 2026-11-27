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
    const loggedBody = /(?:^|\/)needs(?:\/|$)/.test(req.path) ? undefined : this.sanitize(body);

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - now;
        this.logger.log(
          `[${method}] ${originalUrl} - ${duration}ms`,
          'HTTP',
          loggedBody
        );
      }),
      catchError((err) => {
        const duration = Date.now() - now;
        this.logger.error(
          `[${method}] ${originalUrl} - ${duration}ms - ${err.message}`,
          err.stack,
          'HTTP',
          loggedBody
        );
        throw err;
      })
    );
  }

  private sanitize(payload: any) {
    if (!payload || typeof payload !== 'object') return payload;
    const redacted = { ...payload };
    Object.keys(redacted).forEach((key) => {
      if (/password|senha|token|authorization/i.test(key) ||
        ['monthly_income_cents', 'housing_description'].includes(key)) {
        redacted[key] = '[REDACTED]';
      }
    });
    return redacted;
  }
}
