import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        if (
          data &&
          typeof data === 'object' &&
          'status_code' in data &&
          'success' in data &&
          'message' in data &&
          'data' in data
        ) {
          return data;
        }

        return {
          status_code: response.statusCode,
          success: response.statusCode >= 200 && response.statusCode < 300,
          message: response.statusMessage ?? 'Requisição bem-sucedida',
          data,
        };
      })
    );
  }
}
