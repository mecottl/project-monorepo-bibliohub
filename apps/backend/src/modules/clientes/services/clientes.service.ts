import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DataSource } from 'typeorm';
import { Cliente } from '../../../database/entities/cliente.entity';
import { TransaccionPuntos } from '../../../database/entities/transaccion-puntos.entity';
import { QueryClienteDto } from '../dto/query-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { AjustePuntosClienteDto } from '../dto/ajuste-puntos-cliente.dto';
import {
  ClienteSinPassword,
  PaginatedClientes,
} from '../interfaces/clientes.interface';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query: QueryClienteDto): Promise<PaginatedClientes> {
    const { busqueda, cuentaActiva, page = 1, limit = 10 } = query;

    const qb: SelectQueryBuilder<Cliente> = this.clienteRepository
      .createQueryBuilder('cliente')
      .orderBy('cliente.fechaRegistro', 'DESC');

    if (busqueda) {
      qb.andWhere(
        '(cliente.nombre ILIKE :busqueda OR cliente.telefono ILIKE :busqueda OR cliente.email ILIKE :busqueda)',
        { busqueda: `%${busqueda}%` },
      );
    }

    if (cuentaActiva !== undefined) {
      qb.andWhere('cliente.cuentaActiva = :cuentaActiva', { cuentaActiva });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((cliente) => this.mapCliente(cliente)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async crear(dto: CreateClienteDto): Promise<ClienteSinPassword> {
    const existente = await this.clienteRepository.findOne({
      where: { telefono: dto.telefono },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe un cliente con el teléfono ${dto.telefono}`,
      );
    }

    const cliente = this.clienteRepository.create({
      telefono: dto.telefono,
      nombre: null,
      email: null,
      passwordHash: null,
      cuentaActiva: false,
      puntosSaldo: 0,
    });

    const guardado = await this.clienteRepository.save(cliente);
    return this.mapCliente(guardado);
  }

  // Preparación para el futuro módulo de ventas (POS): busca un cliente por
  // teléfono y, si no existe, lo crea como "solo teléfono" (sin nombre, sin
  // password, cuenta inactiva) para que la venta pueda acumularle puntos de
  // inmediato. No expuesto en un endpoint todavía.
  async buscarOCrearPorTelefono(telefono: string): Promise<ClienteSinPassword> {
    const existente = await this.clienteRepository.findOne({ where: { telefono } });

    if (existente) {
      return this.mapCliente(existente);
    }

    const cliente = this.clienteRepository.create({
      telefono,
      nombre: null,
      email: null,
      passwordHash: null,
      cuentaActiva: false,
      puntosSaldo: 0,
    });

    const guardado = await this.clienteRepository.save(cliente);
    return this.mapCliente(guardado);
  }

  async findOne(id: string): Promise<ClienteSinPassword> {
    const cliente = await this.buscarClienteSimple(id);
    return this.mapCliente(cliente);
  }

  async update(id: string, dto: UpdateClienteDto): Promise<ClienteSinPassword> {
    await this.buscarClienteSimple(id);

    await this.clienteRepository.update(id, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.findOne(id);
  }

  async ajustarPuntos(
    id: string,
    dto: AjustePuntosClienteDto,
  ): Promise<ClienteSinPassword> {
    return this.dataSource.transaction(async (manager) => {
      const cliente = await manager.findOne(Cliente, { where: { id } });

      if (!cliente) {
        throw new NotFoundException(`Cliente con id ${id} no encontrado`);
      }

      const delta = dto.tipo === 'ganado' ? dto.puntos : -dto.puntos;
      const saldoNuevo = cliente.puntosSaldo + delta;

      if (saldoNuevo < 0) {
        throw new BadRequestException(
          `El ajuste dejaría el saldo en ${saldoNuevo}. Saldo actual: ${cliente.puntosSaldo}, ajuste solicitado: ${delta}.`,
        );
      }

      await manager.update(Cliente, id, {
        puntosSaldo: saldoNuevo,
        updatedAt: new Date(),
      });

      const transaccion = manager.create(TransaccionPuntos, {
        clienteId: id,
        tipo: dto.tipo,
        puntos: dto.puntos,
        // Ajuste hecho a mano desde el panel de administración (web).
        canal: 'online',
        concepto: dto.concepto ?? 'Ajuste manual (admin)',
      });
      await manager.save(TransaccionPuntos, transaccion);

      return this.mapCliente({ ...cliente, puntosSaldo: saldoNuevo });
    });
  }

  private async buscarClienteSimple(id: string): Promise<Cliente> {
    const cliente = await this.clienteRepository.findOne({ where: { id } });

    if (!cliente) {
      throw new NotFoundException(`Cliente con id ${id} no encontrado`);
    }

    return cliente;
  }

  private mapCliente(cliente: Cliente): ClienteSinPassword {
    const { passwordHash: _passwordHash, ...resto } = cliente;
    return resto;
  }
}
