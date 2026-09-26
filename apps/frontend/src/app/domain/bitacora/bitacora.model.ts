export interface EntradaBitacora {
  id: string;
  empleadoId: string | null;
  empleadoNombre: string | null;
  accion: string;
  entidad: string;
  entidadId: string | null;
  antes: Record<string, unknown> | null;
  despues: Record<string, unknown> | null;
  ip: string | null;
  fecha: string;
}

export interface BitacoraPaginada {
  data: EntradaBitacora[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FiltrosBitacora {
  accion?: string;
  entidad?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export const ETIQUETAS_ACCION: Record<string, string> = {
  ajuste_puntos: 'Ajuste de puntos',
  cambio_libro: 'Cambio de libro (precio/stock mínimo)',
  baja_libro: 'Baja de libro',
  eliminar_libro: 'Libro eliminado',
  movimiento_inventario: 'Movimiento de inventario',
  cancelar_venta: 'Venta cancelada',
  cancelar_pedido: 'Pedido cancelado',
  alta_empleado: 'Alta de empleado',
  cambio_empleado: 'Cambio de empleado',
  cambio_configuracion: 'Cambio de configuración',
};
