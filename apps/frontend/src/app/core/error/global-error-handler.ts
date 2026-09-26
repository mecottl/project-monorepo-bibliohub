import { ErrorHandler, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/api.config';

const MAX_REPORTES_POR_SESION = 5;

// Además de dejar el error en la consola, lo reporta al backend (POST /telemetria/errores), donde
// queda en el log estructurado. Sin dependencias externas; si el reporte falla se ignora en silencio.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private reportados = 0;

  handleError(error: unknown): void {
    console.error(error);
    if (this.reportados >= MAX_REPORTES_POR_SESION) return;
    this.reportados++;

    const e = error instanceof Error ? error : new Error(String(error));
    try {
      void fetch(`${API_BASE_URL}/telemetria/errores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          mensaje: e.message.slice(0, 500),
          stack: e.stack?.slice(0, 4000),
          url: location.pathname.slice(0, 300),
        }),
      }).catch(() => undefined);
    } catch {
      // ignorado: reportar es un extra
    }
  }
}
