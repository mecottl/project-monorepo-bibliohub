import { AsyncLocalStorage } from 'node:async_hooks';

// Identificador de la petición en curso: lo añaden los logs para poder seguir una petición completa.
export const contextoPeticion = new AsyncLocalStorage<{ requestId: string }>();
