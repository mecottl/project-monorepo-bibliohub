import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, DataSource, SelectQueryBuilder } from 'typeorm';
import { Proveedor } from '../entities/proveedor.entity';
import { PedidoCompra } from '../entities/pedido-compra.entity';
import { DetallePedidoCompra } from '../entities/detalle-pedido-compra.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { asignarDefinidos } from '@common/asignar-definidos';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { CreatePedidoCompraDto } from '../dto/create-pedido-compra.dto';
import { RecibirPedidoCompraDto } from '../dto/recibir-pedido-compra.dto';
import { QueryPedidoCompraDto } from '../dto/query-pedido-compra.dto';
import { PaginatedPedidosCompra, PedidoCompraSeguro } from '../interfaces/proveedores.interface';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(PedidoCompra)
    private readonly pedidoCompraRepository: Repository<PedidoCompra>,
    @InjectRepository(DetallePedidoCompra)
    private readonly detalleRepository: Repository<DetallePedidoCompra>,
    @InjectRepository(Libro)
    private readonly libroRepository: Repository<Libro>,
    private readonly dataSource: DataSource,
  ) {}

  // --- Proveedores ---

  async findAllProveedores(): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOneProveedor(id: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({ where: { id } });
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con id ${id} no encontrado`);
    }
    return proveedor;
  }

  async createProveedor(dto: CreateProveedorDto): Promise<Proveedor> {
    const proveedor = this.proveedorRepository.create({ ...dto, activo: true });
    return this.proveedorRepository.save(proveedor);
  }

  async updateProveedor(id: string, dto: UpdateProveedorDto): Promise<Proveedor> {
    const proveedor = await this.findOneProveedor(id);
    asignarDefinidos(proveedor, dto);
    return this.proveedorRepository.save(proveedor);
  }

  // Baja lógica: un proveedor puede tener pedido_compra asociados (ON DELETE
  // RESTRICT implícito por FK NOT NULL) — nunca se borra físicamente.
  async removeProveedor(id: string): Promise<{ message: string }> {
    const proveedor = await this.findOneProveedor(id);
    proveedor.activo = false;
    await this.proveedorRepository.save(proveedor);
    return { message: 'Proveedor desactivado.' };
  }

  // --- Pedidos de compra ---

  async findAllPedidos(query: QueryPedidoCompraDto): Promise<PaginatedPedidosCompra> {
    const { proveedorId, estado, page = 1, limit = 10 } = query;

    const qb: SelectQueryBuilder<PedidoCompra> = this.pedidoCompraRepository
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.proveedor', 'proveedor')
      .leftJoinAndSelect('pedido.empleado', 'empleado')
      .orderBy('pedido.fecha', 'DESC');

    if (proveedorId) {
      qb.andWhere('pedido.proveedorId = :proveedorId', { proveedorId });
    }

    if (estado) {
      qb.andWhere('pedido.estado = :estado', { estado });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((pedido) => this.mapPedido(pedido)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOnePedido(id: string): Promise<PedidoCompraSeguro> {
    const pedido = await this.pedidoCompraRepository.findOne({
      where: { id },
      relations: ['proveedor', 'empleado', 'detalles', 'detalles.libro'],
    });

    if (!pedido) {
      throw new NotFoundException(`Pedido de compra con id ${id} no encontrado`);
    }

    return this.mapPedido(pedido);
  }

  async crearPedido(dto: CreatePedidoCompraDto, empleadoId: string): Promise<PedidoCompraSeguro> {
    await this.findOneProveedor(dto.proveedorId);

    const libroIds = dto.items.map((item) => item.libroId);
    const libros = await this.libroRepository.find({ where: { id: In(libroIds) } });
    if (libros.length !== new Set(libroIds).size) {
      throw new BadRequestException('Uno o más libros del pedido no existen');
    }

    return this.dataSource.transaction(async (manager) => {
      const total = dto.items.reduce(
        (acumulado, item) => acumulado + item.cantidadSolicitada * item.precioCosto,
        0,
      );

      const pedido = manager.create(PedidoCompra, {
        proveedorId: dto.proveedorId,
        empleadoId,
        estado: 'pendiente',
        total,
        notas: dto.notas ?? null,
        updatedAt: new Date(),
      });
      const pedidoGuardado = await manager.save(PedidoCompra, pedido);

      const detalles = dto.items.map((item) =>
        manager.create(DetallePedidoCompra, {
          pedidoCompraId: pedidoGuardado.id,
          libroId: item.libroId,
          cantidadSolicitada: item.cantidadSolicitada,
          cantidadRecibida: 0,
          precioCosto: item.precioCosto,
          subtotalLinea: item.cantidadSolicitada * item.precioCosto,
        }),
      );
      await manager.save(DetallePedidoCompra, detalles);

      const pedidoCompleto = await manager.findOne(PedidoCompra, {
        where: { id: pedidoGuardado.id },
        relations: ['proveedor', 'empleado', 'detalles', 'detalles.libro'],
      });

      if (!pedidoCompleto) {
        throw new NotFoundException('Error al recuperar el pedido de compra recién creado');
      }

      return this.mapPedido(pedidoCompleto);
    });
  }

  // La actualización de stock ante una recepción NO se reimplementa aquí: un
  // UPDATE normal sobre detalle_pedido_compra.cantidad_recibida ya dispara
  // trg_fn_recepcion_compra, que suma el incremento a libro.stock_actual
  // (ver db/bibliohub_estructura.sql) — mismo criterio que confirmar_venta_pos.
  async recibirPedido(id: string, dto: RecibirPedidoCompraDto): Promise<PedidoCompraSeguro> {
    const pedido = await this.findOnePedido(id);

    if (pedido.estado === 'recibido' || pedido.estado === 'cancelado') {
      throw new BadRequestException(
        `No se puede registrar recepción sobre un pedido en estado "${pedido.estado}"`,
      );
    }

    const detallesPorId = new Map((pedido.detalles ?? []).map((d) => [d.id, d]));

    for (const item of dto.items) {
      const detalle = detallesPorId.get(item.detalleId);
      if (!detalle) {
        throw new BadRequestException(
          `La línea ${item.detalleId} no pertenece a este pedido de compra`,
        );
      }
      if (item.cantidadRecibida > detalle.cantidadSolicitada) {
        throw new BadRequestException(
          `La cantidad recibida (${item.cantidadRecibida}) no puede superar la solicitada (${detalle.cantidadSolicitada}) para el libro "${detalle.libro?.titulo ?? detalle.libroId}"`,
        );
      }
      if (item.cantidadRecibida < detalle.cantidadRecibida) {
        throw new BadRequestException(
          'La cantidad recibida no puede disminuir respecto a lo ya registrado',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.items) {
        await manager.update(DetallePedidoCompra, item.detalleId, {
          cantidadRecibida: item.cantidadRecibida,
        });
      }

      const detallesActualizados = await manager.find(DetallePedidoCompra, {
        where: { pedidoCompraId: id },
      });

      const totalmenteRecibido = detallesActualizados.every(
        (d) => d.cantidadRecibida >= d.cantidadSolicitada,
      );
      const algoRecibido = detallesActualizados.some((d) => d.cantidadRecibida > 0);

      await manager.update(PedidoCompra, id, {
        estado: totalmenteRecibido ? 'recibido' : algoRecibido ? 'recibido_parcial' : 'pendiente',
        updatedAt: new Date(),
      });
    });

    return this.findOnePedido(id);
  }

  async cancelarPedido(id: string): Promise<PedidoCompraSeguro> {
    const pedido = await this.findOnePedido(id);

    if (pedido.estado === 'recibido') {
      throw new BadRequestException('No se puede cancelar un pedido ya recibido por completo');
    }

    await this.pedidoCompraRepository.update(id, {
      estado: 'cancelado',
      updatedAt: new Date(),
    });

    return this.findOnePedido(id);
  }

  // El empleado relacionado nunca debe traer passwordHash hacia afuera de la
  // API (mismo criterio que VentasService.mapVenta).
  private mapPedido(pedido: PedidoCompra): PedidoCompraSeguro {
    const { empleado, ...resto } = pedido;
    const { passwordHash: _passwordHash, ...empleadoSeguro } = empleado;
    return { ...resto, empleado: empleadoSeguro };
  }
}
