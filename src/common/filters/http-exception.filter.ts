import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>;
        message = (res.message as string) || exception.message;
        code = (res.code as string) || this.getCodeFromStatus(status);

        // Handle class-validator errors
        if (Array.isArray(res.message)) {
          message = (res.message as string[]).join(', ');
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Never expose stack traces in production
      if (process.env.NODE_ENV === 'development') {
        console.error(exception.stack);
      }
    }

    response.status(status).json({
      success: false,
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && exception instanceof Error
        ? { stack: exception.stack }
        : {}),
    });
  }

  private getCodeFromStatus(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };
    return codes[status] || 'UNKNOWN_ERROR';
  }
}
