import { Injectable } from '@nestjs/common';
import { QueryHistorialVentasDto } from '../dto/query-historial-ventas.dto';
import { DataSource } from 'typeorm';
import {
  RendimientoEmpleado,
  LibroMasVendido,
  VentasPorDia,
  HistorialVentas,
} from '../interfaces/reportes.interface';

const DIAS_DEFAULT = 30;

@Injectable()
export class ReportesService {
  constructor(private readonly dataSource: DataSource) {}

  // rendimiento_empleados y libros_mas_vendidos ya existen como vistas en
  // db/bibliohub_estructura.sql — se exponen tal cual, sin reimplementar el
  // agregado en TypeORM (mismo criterio que AGENTS.md backend pide para las
  // funciones SQL de negocio).
  async rendimientoEmpleados(): Promise<RendimientoEmpleado[]> {
    return this.dataSource.query(`
      SELECT
        id,
        nombre,
        rol,
        total_ventas AS "totalVentas",
        monto_total AS "montoTotal",
        primera_venta AS "primeraVenta",
        ultima_venta AS "ultimaVenta"
      FROM rendimiento_empleados
    `);
  }

  async librosMasVendidos(): Promise<LibroMasVendido[]> {
    return this.dataSource.query(`
      SELECT
        id,
        isbn,
        titulo,
        unidades_vendidas AS "unidadesVendidas",
        ingresos_generados AS "ingresosGenerados",
        aparece_en_ventas AS "apareceEnVentas"
      FROM libros_mas_vendidos
    `);
  }

  async ventasPorPeriodo(fechaDesde?: string, fechaHasta?: string): Promise<VentasPorDia[]> {
    const desde = fechaDesde ?? this.haceDias(DIAS_DEFAULT);
    const hasta = fechaHasta ?? this.hoy();

    return this.dataSource.query(
      `
      SELECT
        to_char(date_trunc('day', fecha), 'YYYY-MM-DD') AS fecha,
        COUNT(*)::int AS "totalVentas",
        COALESCE(SUM(total), 0) AS "montoTotal"
      FROM venta
      WHERE estado = 'completada'
        AND fecha >= $1::date
        AND fecha < ($2::date + interval '1 day')
      GROUP BY 1
      ORDER BY 1
      `,
      [desde, hasta],
    );
  }

  // Historial unificado: ventas de tienda (`venta`) + pedidos en línea ya pagados (`pedido_linea`).
  // Todos los valores del cliente van como parámetros; orden y dirección salen de listas blancas.
  async historialVentas(query: QueryHistorialVentasDto): Promise<HistorialVentas> {
    const { desde, hasta, canal, estado, busqueda, page = 1, limit = 15 } = query;
    const orden = query.orden === 'total' ? 'total' : 'fecha';
    const direccion = query.direccion === 'ASC' ? 'ASC' : 'DESC';

    const base = `
      WITH h AS (
        SELECT v.id, 'tienda'::text AS canal, v.fecha, v.subtotal, v.descuento_puntos AS descuento, v.total,
               v.puntos_usados, v.puntos_ganados, v.estado, v.medio_pago::text AS medio_pago,
               c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, e.nombre AS empleado,
               (SELECT COALESCE(SUM(d.cantidad), 0) FROM detalle_venta d WHERE d.venta_id = v.id)::int AS unidades,
               CASE v.estado WHEN 'cancelada' THEN 'cancelada' ELSE 'completada' END AS estado_grupo
          FROM venta v
          LEFT JOIN cliente c ON c.id = v.cliente_id
          LEFT JOIN empleado e ON e.id = v.empleado_id
        UNION ALL
        SELECT p.id, 'en_linea'::text, p.fecha, p.subtotal, p.descuento_puntos, p.total,
               p.puntos_usados, p.puntos_ganados, p.estado, 'tarjeta'::text,
               c.nombre, c.telefono, NULL::varchar,
               (SELECT COALESCE(SUM(d.cantidad), 0) FROM detalle_pedido_linea d WHERE d.pedido_linea_id = p.id)::int,
               CASE p.estado WHEN 'cancelado' THEN 'cancelada' WHEN 'entregado' THEN 'completada' ELSE 'en_proceso' END
          FROM pedido_linea p
          JOIN cliente c ON c.id = p.cliente_id
         WHERE p.estado_pago IN ('pagado', 'reembolsado')
      )`;

    const condiciones: string[] = [];
    const params: unknown[] = [];
    const agregar = (sql: string, valor: unknown) => {
      params.push(valor);
      condiciones.push(sql.replace('?', `$${params.length}`));
    };

    if (desde) agregar('fecha >= ?::date', desde);
    if (hasta) agregar("fecha < (?::date + interval '1 day')", hasta);
    if (canal) agregar('canal = ?', canal);
    if (estado) agregar('estado_grupo = ?', estado);
    if (busqueda?.trim()) {
      params.push(`%${busqueda.trim()}%`);
      const n = `$${params.length}`;
      condiciones.push(`(cliente_nombre ILIKE ${n} OR cliente_telefono ILIKE ${n} OR id::text ILIKE ${n})`);
    }
    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

    const [resumenFila] = await this.dataSource.query(
      `${base}
       SELECT COUNT(*) FILTER (WHERE estado_grupo <> 'cancelada')::int AS ventas,
              COALESCE(SUM(total) FILTER (WHERE estado_grupo <> 'cancelada'), 0) AS monto,
              COUNT(*) FILTER (WHERE estado_grupo = 'cancelada')::int AS canceladas,
              COUNT(*)::int AS filas
         FROM h ${where}`,
      params,
    );

    const filas = await this.dataSource.query(
      `${base}
       SELECT id, canal, fecha, cliente_nombre AS "clienteNombre", cliente_telefono AS "clienteTelefono", empleado,
              medio_pago AS "medioPago", unidades, subtotal, descuento, total, puntos_ganados AS "puntosGanados",
              puntos_usados AS "puntosUsados", estado, estado_grupo AS "estadoGrupo"
         FROM h ${where}
        ORDER BY ${orden} ${direccion}, id
        LIMIT ${Number(limit)} OFFSET ${(Number(page) - 1) * Number(limit)}`,
      params,
    );

    const total = resumenFila.filas as number;
    const ventas = resumenFila.ventas as number;
    const monto = Number(resumenFila.monto);
    return {
      data: filas.map((f: Record<string, unknown>) => ({
        ...f,
        subtotal: Number(f['subtotal']),
        descuento: Number(f['descuento']),
        total: Number(f['total']),
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.max(1, Math.ceil(total / Number(limit))),
      resumen: {
        ventas,
        monto,
        canceladas: resumenFila.canceladas as number,
        ticketPromedio: ventas ? monto / ventas : 0,
      },
    };
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private haceDias(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().slice(0, 10);
  }
}
