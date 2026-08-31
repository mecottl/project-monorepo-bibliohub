import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Cliente } from '../../../database/entities/cliente.entity';
import { QueryClienteDto } from '../dto/query-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import {
  ClienteSinPassword,
  PaginatedClientes,
} from '../interfaces/clientes.interface';

@Injectable()
export class ClientesService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepository: Repository<Cliente>,
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
