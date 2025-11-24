import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import pino from 'pino';
import axios from 'axios';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger = pino();

  async log(
    message: string,
    context?: string,
    body?: string,
    response?: string
  ) {
    this.logger.info({ message, context });
    void this.sendToBetterStack(
      'info',
      message,
      context,
      undefined,
      body,
      response
    );
  }

  async error(
    message: string,
    trace?: string,
    context?: string,
    body?: string,
    response?: string
  ) {
    this.logger.error({ message, trace, context });
    void this.sendToBetterStack(
      'error',
      message,
      context,
      trace,
      body,
      response
    );
  }

  async warn(message: string, context?: string) {
    this.logger.warn({ message, context });
    void this.sendToBetterStack('warn', message, context);
  }

  private async sendToBetterStack(
    level: 'info' | 'warn' | 'error',
    message: string,
    context?: string,
    trace?: string,
    body?: string,
    response?: string
  ) {
    try {
      await axios.post(
        process.env.BETTER_STACK_URL!,
        {
          level,
          message,
          context,
          trace,
          body,
          response,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.BETTER_STACK_TOKEN}`,
          },
        }
      );
    } catch (e) {
      this.logger.warn('Erro ao enviar log para Better Stack');
    }
  }
}
