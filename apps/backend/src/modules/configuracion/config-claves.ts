export const CONFIG = {
  tasaPuntosAcumulacion: 'tasa_puntos_acumulacion',
  tasaPuntosCanje: 'tasa_puntos_canje',
  costoEnvioDefault: 'costo_envio_default',
  envioGratisDesde: 'envio_gratis_desde',
} as const;

export type ConfigClave = (typeof CONFIG)[keyof typeof CONFIG];
