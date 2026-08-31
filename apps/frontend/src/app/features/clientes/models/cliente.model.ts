export interface Cliente {
  id: string;
  telefono: string;
  // Nulo mientras el cliente exista "solo por teléfono" (creado desde una
  // venta) y aún no se haya registrado.
  nombre: string | null;
  email: string | null;
  cuentaActiva: boolean;
  puntosSaldo: number;
  fechaRegistro: string;
  updatedAt: string;
}

export interface PaginatedClientes {
  data: Cliente[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ClientesQuery {
  busqueda?: string;
  cuentaActiva?: boolean;
  page?: number;
  limit?: number;
}

export interface UpdateClientePayload {
  nombre?: string;
  email?: string;
  cuentaActiva?: boolean;
}

export type TipoAjustePuntos = 'ganado' | 'canjeado';

export interface AjustePuntosPayload {
  tipo: TipoAjustePuntos;
  puntos: number;
  concepto?: string;
}
