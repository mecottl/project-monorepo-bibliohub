import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Libro } from '../../../database/entities/libro.entity';
import { MovimientoInventario } from '../../../database/entities/movimiento-inventario.entity';
import { CreateMovimientoInventarioDto } from '../dto/create-movimiento-inventario.dto';
import { QueryMovimientoDto } from '../dto/query-movimiento.dto';
import { PaginatedMovimientos } from '../interfaces/inventario.interface';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
    @InjectRepository(MovimientoInventario)
    private readonly movimientoRepository: Repository<MovimientoInventario>,
    private readonly dataSource: DataSource,
  ) {}

  async registrarMovimiento(
    dto: CreateMovimientoInventarioDto,
    empleadoId: string,
  ): Promise<MovimientoInventario> {
    this.validarSignoPorTipo(dto.tipo, dto.cantidad);

    return this.dataSource.transaction(async (manager) => {
      const libro = await manager.findOne(Libro, {
        where: { id: dto.libroId },
      });

      if (!libro) {
        throw new NotFoundException('Libro no encontrado');
      }

      const stockAnterior = libro.stockActual;
      const stockNuevo = stockAnterior + dto.cantidad;

      if (stockNuevo < 0) {
        throw new BadRequestException(
          `El movimiento dejaría el stock en ${stockNuevo}. Stock actual: ${stockAnterior}, delta solicitado: ${dto.cantidad}.`,
        );
      }

      await manager.update(Libro, dto.libroId, { stockActual: stockNuevo });

      const movimiento = manager.create(MovimientoInventario, {
        libroId: dto.libroId,
        empleadoId,
        tipo: dto.tipo,
        cantidad: dto.cantidad,
        stockAnterior,
        stockNuevo,
        motivo: dto.motivo,
      });

      return manager.save(movimiento);
    });
  }

  async findAll(query: QueryMovimientoDto): Promise<PaginatedMovimientos> {
    const {
      libroId,
      tipo,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
    } = query;

    const qb: SelectQueryBuilder<MovimientoInventario> =
      this.movimientoRepository
        .createQueryBuilder('movimiento')
        .leftJoinAndSelect('movimiento.libro', 'libro')
        .leftJoinAndSelect('movimiento.empleado', 'empleado')
        .orderBy('movimiento.createdAt', 'DESC');

    if (libroId) {
      qb.andWhere('movimiento.libroId = :libroId', { libroId });
    }

    if (tipo) {
      qb.andWhere('movimiento.tipo = :tipo', { tipo });
    }

    if (fechaDesde) {
      qb.andWhere('movimiento.createdAt >= :fechaDesde', { fechaDesde });
    }

    if (fechaHasta) {
      qb.andWhere('movimiento.createdAt <= :fechaHasta', { fechaHasta });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private validarSignoPorTipo(
    tipo: 'entrada' | 'salida' | 'ajuste',
    cantidad: number,
  ): void {
    if (tipo === 'entrada' && cantidad <= 0) {
      throw new BadRequestException(
        'Un movimiento de tipo "entrada" debe tener cantidad positiva.',
      );
    }

    if (tipo === 'salida' && cantidad >= 0) {
      throw new BadRequestException(
        'Un movimiento de tipo "salida" debe tener cantidad negativa.',
      );
    }
  }
}
