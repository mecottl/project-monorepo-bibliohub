import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { contextoPeticion } from '@common/logging/contexto';
import { Bitacora } from '../entities/bitacora.entity';
import { QueryBitacoraDto } from '../dto/query-bitacora.dto';

export interface EntradaBitacora {
  accion: string;
  entidad: string;
  entidadId?: string | null;
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
}

@Injectable()
export class BitacoraService {
  private readonly logger = new Logger(BitacoraService.name);

  constructor(@InjectRepository(Bitacora) private readonly repo: Repository<Bitacora>) {}

  // Quién (empleado autenticado) y desde qué IP salen del contexto de la petición. Si registrar falla no
  // se rompe la operación auditada (el error queda en el log): ponytail: si se exige "sin registro no hay
  // acción", registrar dentro de la misma transacción de cada operación.
  async registrar(entrada: EntradaBitacora): Promise<void> {
    const ctx = contextoPeticion.getStore();
    const esEmpleado = ctx?.usuario?.tipo === 'empleado';
    try {
      await this.repo.save(
        this.repo.create({
          empleadoId: esEmpleado ? ctx!.usuario!.id : null,
          empleadoNombre: ctx?.usuario?.nombre ?? null,
          accion: entrada.accion,
          entidad: entrada.entidad,
          entidadId: entrada.entidadId ?? null,
          antes: entrada.antes ?? null,
          despues: entrada.despues ?? null,
          ip: ctx?.ip ?? null,
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo registrar en la bitácora (${entrada.accion})`,
        (error as Error).stack,
      );
    }
  }

  async listar(query: QueryBitacoraDto) {
    const { empleadoId, accion, entidad, fechaDesde, fechaHasta, page = 1, limit = 20 } = query;
    const qb = this.repo.createQueryBuilder('b').orderBy('b.fecha', 'DESC');
    if (empleadoId) qb.andWhere('b.empleadoId = :empleadoId', { empleadoId });
    if (accion) qb.andWhere('b.accion = :accion', { accion });
    if (entidad) qb.andWhere('b.entidad = :entidad', { entidad });
    if (fechaDesde) qb.andWhere('b.fecha >= :fechaDesde', { fechaDesde });
    if (fechaHasta) qb.andWhere("b.fecha < (:fechaHasta::date + interval '1 day')", { fechaHasta });
    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // Valores distintos para poblar los filtros de la vista.
  async acciones(): Promise<string[]> {
    const filas: { accion: string }[] = await this.repo
      .createQueryBuilder('b')
      .select('DISTINCT b.accion', 'accion')
      .orderBy('b.accion')
      .getRawMany();
    return filas.map((f) => f.accion);
  }
}
