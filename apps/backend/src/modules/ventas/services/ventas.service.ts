import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Venta } from '../../../database/entities/venta.entity';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { QueryVentaDto } from '../dto/query-venta.dto';
import { PaginatedVentas, VentaSegura } from '../interfaces/ventas.interface';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRepository: Repository<Venta>,
    private readonly dataSource: DataSource,
  ) {}

  // La lógica transaccional (validar stock, calcular subtotal/descuento/total,
  // descontar stock, registrar transaccion_puntos) ya vive en confirmar_venta_pos()
  // (ver db/bibliohub_estructura.sql) — se llama vía SQL crudo en vez de
  // reimplementarla en TypeORM, para no duplicar reglas de negocio ya probadas.
  async crear(dto: CreateVentaDto, empleadoId: string): Promise<VentaSegura> {
    if ((dto.puntosUsados ?? 0) > 0 && !dto.clienteId) {
      throw new BadRequestException(
        'No se pueden usar puntos sin especificar un cliente.',
      );
    }

    const items = dto.items.map((item) => ({
      libro_id: item.libroId,
      cantidad: item.cantidad,
      precio_unitario: item.precioUnitario,
    }));

    let ventaId: string;
    try {
      const resultado = await this.dataSource.query(
        'SELECT confirmar_venta_pos($1, $2, $3, $4, $5::jsonb) AS id',
        [
          dto.clienteId ?? null,
          empleadoId,
          dto.medioPago,
          dto.puntosUsados ?? 0,
          JSON.stringify(items),
        ],
      );
      ventaId = resultado[0].id;
    } catch (error) {
      throw new BadRequestException(this.mensajeDesdePostgres(error));
    }

    return this.findOne(ventaId);
  }

  async findAll(query: QueryVentaDto): Promise<PaginatedVentas> {
    const {
      clienteId,
      empleadoId,
      estado,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 10,
    } = query;

    const qb: SelectQueryBuilder<Venta> = this.ventaRepository
      .createQueryBuilder('venta')
      .leftJoinAndSelect('venta.cliente', 'cliente')
      .leftJoinAndSelect('venta.empleado', 'empleado')
      .orderBy('venta.fecha', 'DESC');

    if (clienteId) {
      qb.andWhere('venta.clienteId = :clienteId', { clienteId });
    }

    if (empleadoId) {
      qb.andWhere('venta.empleadoId = :empleadoId', { empleadoId });
    }

    if (estado) {
      qb.andWhere('venta.estado = :estado', { estado });
    }

    if (fechaDesde) {
      qb.andWhere('venta.fecha >= :fechaDesde', { fechaDesde });
    }

    if (fechaHasta) {
      qb.andWhere('venta.fecha <= :fechaHasta', { fechaHasta });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((venta) => this.mapVenta(venta)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<VentaSegura> {
    const venta = await this.ventaRepository.findOne({
      where: { id },
      relations: ['cliente', 'empleado', 'detalles', 'detalles.libro'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con id ${id} no encontrada`);
    }

    return this.mapVenta(venta);
  }

  // cancelar_venta() ya repone el stock, borra las transacciones de puntos de
  // esta venta y recalcula puntos_saldo desde transaccion_puntos — mismo
  // motivo que crear(): reutilizar la función SQL en vez de reimplementarla.
  async cancelar(id: string): Promise<{ message: string }> {
    await this.findOne(id);

    try {
      await this.dataSource.query('SELECT cancelar_venta($1)', [id]);
    } catch (error) {
      throw new BadRequestException(this.mensajeDesdePostgres(error));
    }

    return { message: 'Venta cancelada correctamente.' };
  }

  // Los leftJoinAndSelect de cliente/empleado traen la entidad completa,
  // incluido passwordHash — nunca debe salir de la API (mismo motivo que
  // ClientesService.mapCliente).
  private mapVenta(venta: Venta): VentaSegura {
    const { cliente, empleado, ...resto } = venta;

    let clienteSeguro: VentaSegura['cliente'];
    if (cliente) {
      const { passwordHash: _clientePasswordHash, ...clienteSinPassword } = cliente;
      clienteSeguro = clienteSinPassword;
    } else {
      clienteSeguro = cliente;
    }

    const { passwordHash: _empleadoPasswordHash, ...empleadoSinPassword } = empleado;

    return { ...resto, cliente: clienteSeguro, empleado: empleadoSinPassword };
  }

  private mensajeDesdePostgres(error: unknown): string {
    if (error instanceof Error) {
      // node-postgres antepone "error: " al mensaje de un RAISE EXCEPTION.
      return error.message.replace(/^error:\s*/i, '');
    }
    return 'Error al procesar la venta.';
  }
}
