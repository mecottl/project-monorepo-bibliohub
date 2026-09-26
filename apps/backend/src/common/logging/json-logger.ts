import { LoggerService } from '@nestjs/common';
import { contextoPeticion } from './contexto';

type Nivel = 'error' | 'warn' | 'log' | 'debug' | 'verbose' | 'fatal';

// Logger de Nest que escribe una línea JSON por evento (fácil de ingerir en cualquier agregador).
export class JsonLogger implements LoggerService {
  private escribir(nivel: Nivel, mensaje: unknown, optionalParams: unknown[]): void {
    const ultimo = optionalParams[optionalParams.length - 1];
    const contexto = typeof ultimo === 'string' ? ultimo : undefined;
    const extra = contexto ? optionalParams.slice(0, -1) : optionalParams;
    const registro: Record<string, unknown> = {
      ts: new Date().toISOString(),
      nivel: nivel === 'log' ? 'info' : nivel,
      contexto,
      requestId: contextoPeticion.getStore()?.requestId,
      mensaje: mensaje instanceof Error ? mensaje.message : mensaje,
    };
    if (mensaje instanceof Error) registro.stack = mensaje.stack;
    // Nest pasa el stack como primer parámetro extra en logger.error(msg, stack, ctx).
    if (extra.length) registro.detalle = extra.length === 1 ? extra[0] : extra;
    const linea = JSON.stringify(registro);
    (nivel === 'error' || nivel === 'fatal' ? process.stderr : process.stdout).write(linea + '\n');
  }

  log(mensaje: unknown, ...p: unknown[]) {
    this.escribir('log', mensaje, p);
  }
  error(mensaje: unknown, ...p: unknown[]) {
    this.escribir('error', mensaje, p);
  }
  warn(mensaje: unknown, ...p: unknown[]) {
    this.escribir('warn', mensaje, p);
  }
  debug(mensaje: unknown, ...p: unknown[]) {
    this.escribir('debug', mensaje, p);
  }
  verbose(mensaje: unknown, ...p: unknown[]) {
    this.escribir('verbose', mensaje, p);
  }
  fatal(mensaje: unknown, ...p: unknown[]) {
    this.escribir('fatal', mensaje, p);
  }
}
