import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  RendimientoEmpleado,
  LibroMasVendido,
  VentasPorDia,
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

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private haceDias(dias: number): string {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return fecha.toISOString().slice(0, 10);
  }
}
