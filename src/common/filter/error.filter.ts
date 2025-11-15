import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationErrorResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  details?: string[];
}

@Catch()
export default class ErrorFilter implements ExceptionFilter {
  private static readonly FRIENDLY_MESSAGES: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Requisição inválida',
    [HttpStatus.UNAUTHORIZED]: 'Não autorizado',
    [HttpStatus.FORBIDDEN]: 'Acesso negado',
    [HttpStatus.NOT_FOUND]: 'Recurso não encontrado',
    [HttpStatus.CONFLICT]: 'Conflito na requisição',
    [HttpStatus.UNPROCESSABLE_ENTITY]: 'Erro de validação',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
  };

  private static readonly DEFAULT_STATUS = HttpStatus.INTERNAL_SERVER_ERROR;

  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const status = this.getStatusCode(exception);
    const { message, details } = this.formatError(exception, status);

    this.logError(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(details && details.length > 0 && { details }),
    };

    response.status(status).json(errorResponse);
  }

  private getStatusCode(exception: Error): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : ErrorFilter.DEFAULT_STATUS;
  }

  private formatError(
    exception: Error,
    status: number
  ): { message: string; details?: string[] } {
    if (!(exception instanceof HttpException)) {
      return {
        message: this.getFriendlyMessage(status),
      };
    }

    const responseData = exception.getResponse();

    if (this.isValidationErrorResponse(responseData)) {
      return this.formatValidationError(responseData, status);
    }

    if (this.isErrorResponseWithMessage(responseData)) {
      return this.formatErrorWithMessage(responseData, status);
    }

    return {
      message: this.getFriendlyMessage(status),
    };
  }

  private isValidationErrorResponse(
    responseData: unknown
  ): responseData is ValidationErrorResponse {
    return (
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData &&
      Array.isArray(responseData.message)
    );
  }

  private isErrorResponseWithMessage(
    responseData: unknown
  ): responseData is ValidationErrorResponse {
    return (
      typeof responseData === 'object' &&
      responseData !== null &&
      'message' in responseData
    );
  }

  private formatValidationError(
    responseData: ValidationErrorResponse,
    status: number
  ): { message: string; details: string[] } {
    const message = this.getFriendlyMessage(status);
    const details = Array.isArray(responseData.message)
      ? responseData.message
      : [responseData.message];

    return { message, details };
  }

  private formatErrorWithMessage(
    responseData: ValidationErrorResponse,
    status: number
  ): { message: string; details?: string[] } {
    const message =
      typeof responseData.message === 'string'
        ? responseData.message
        : this.getFriendlyMessage(status);

    return { message };
  }

  private getFriendlyMessage(status: number): string {
    return (
      ErrorFilter.FRIENDLY_MESSAGES[status] ||
      ErrorFilter.FRIENDLY_MESSAGES[ErrorFilter.DEFAULT_STATUS]
    );
  }

  private logError(exception: Error): void {
    console.error('Error caught by ErrorFilter:', {
      name: exception.name,
      message: exception.message,
      stack: exception.stack,
    });
  }
}
