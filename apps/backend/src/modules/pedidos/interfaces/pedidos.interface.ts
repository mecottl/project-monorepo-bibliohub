export interface TotalesCheckout {
  subtotal: number;
  descuentoPuntos: number;
  costoEnvio: number;
  total: number;
  puntosGanados: number;
}

export interface IniciarCheckoutResult {
  clientSecret: string;
  totales: TotalesCheckout;
}
