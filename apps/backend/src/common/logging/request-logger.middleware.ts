import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { contextoPeticion } from './contexto';

const logger = new Logger('HTTP');

// Asigna un requestId (o respeta el x-request-id entrante), lo devuelve en la respuesta y registra
// una línea por petición. Solo método, ruta (sin query string, que puede llevar tokens), estado y duración.
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const entrante = req.header('x-request-id');
  const requestId = entrante && entrante.length <= 64 ? entrante : randomUUID();
  res.setHeader('x-request-id', requestId);
  const inicio = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number((process.hrtime.bigint() - inicio) / 1_000_000n);
    const ruta = req.originalUrl.split('?')[0];
    contextoPeticion.run({ requestId, ip: req.ip }, () =>
      logger.log(`${req.method} ${ruta} ${res.statusCode} ${ms}ms`),
    );
  });

  contextoPeticion.run({ requestId, ip: req.ip }, next);
}
