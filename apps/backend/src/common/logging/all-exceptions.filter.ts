import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Registra con stack los errores no controlados (5xx); las HttpException 4xx son esperadas y no ensucian el log.
@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('Excepcion');

  catch(exception: unknown, host: ArgumentsHost): void {
    const esHttp = exception instanceof HttpException;
    if (!esHttp || exception.getStatus() >= 500) {
      const error = exception instanceof Error ? exception : new Error(String(exception));
      this.logger.error(error.message, error.stack);
    }
    super.catch(exception, host);
  }
}
