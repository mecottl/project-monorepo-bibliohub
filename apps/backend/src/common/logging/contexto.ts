import { AsyncLocalStorage } from 'node:async_hooks';

export interface ContextoPeticion {
  requestId: string;
  ip?: string;
  // Lo rellena ActorInterceptor cuando la petición ya pasó por los guards.
  usuario?: { id: string; tipo: string; rol: string; nombre: string };
}

// Datos de la petición en curso: los logs añaden el requestId para seguir una petición completa y la
// bitácora (#50) toma de aquí quién hizo la acción y desde qué IP sin pasarlos por cada servicio.
export const contextoPeticion = new AsyncLocalStorage<ContextoPeticion>();
