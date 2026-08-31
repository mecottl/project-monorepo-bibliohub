// Configuración usada en el build de producción (`ng build`).
// Ruta relativa: asume que el backend se sirve bajo /api en el mismo origen
// (p. ej. detrás de un reverse proxy). Si el backend vive en otro dominio,
// cambia esto por su URL completa antes de desplegar.
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
