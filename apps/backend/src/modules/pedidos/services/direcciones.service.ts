import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { asignarDefinidos } from '@common/asignar-definidos';
import { DireccionEntrega } from '../entities/direccion-entrega.entity';
import { CreateDireccionDto } from '../dto/create-direccion.dto';
import { UpdateDireccionDto } from '../dto/update-direccion.dto';

@Injectable()
export class DireccionesService {
  constructor(
    @InjectRepository(DireccionEntrega)
    private readonly direccionRepository: Repository<DireccionEntrega>,
    private readonly dataSource: DataSource,
  ) {}

  async listarDirecciones(clienteId: string): Promise<DireccionEntrega[]> {
    return this.direccionRepository.find({
      where: { clienteId, activo: true },
      order: { esPrincipal: 'DESC', createdAt: 'DESC' },
    });
  }

  // Solo una dirección principal por cliente: se garantiza en una transacción. La primera dirección que
  // se guarda es principal; al eliminar la principal, la más reciente pasa a serlo.
  async crearDireccion(clienteId: string, dto: CreateDireccionDto): Promise<DireccionEntrega> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      const existentes = await repo.count({ where: { clienteId, activo: true } });
      const esPrincipal = dto.esPrincipal === true || existentes === 0;
      if (esPrincipal) await repo.update({ clienteId }, { esPrincipal: false });

      return repo.save(
        repo.create({ ...dto, clienteId, alias: dto.alias ?? 'Casa', activo: true, esPrincipal }),
      );
    });
  }

  async actualizarDireccion(
    clienteId: string,
    id: string,
    dto: UpdateDireccionDto,
  ): Promise<DireccionEntrega> {
    const direccion = await this.buscarDireccionPropia(clienteId, id);
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      if (dto.esPrincipal === true) await repo.update({ clienteId }, { esPrincipal: false });
      asignarDefinidos(direccion, dto);
      return repo.save(direccion);
    });
  }

  async eliminarDireccion(clienteId: string, id: string): Promise<{ message: string }> {
    const direccion = await this.buscarDireccionPropia(clienteId, id);
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(DireccionEntrega);
      const eraPrincipal = direccion.esPrincipal;
      direccion.activo = false;
      direccion.esPrincipal = false;
      await repo.save(direccion);

      if (eraPrincipal) {
        const siguiente = await repo.findOne({
          where: { clienteId, activo: true },
          order: { createdAt: 'DESC' },
        });
        if (siguiente) await repo.update(siguiente.id, { esPrincipal: true });
      }
    });
    return { message: 'Dirección eliminada.' };
  }

  async buscarDireccionPropia(clienteId: string, id: string): Promise<DireccionEntrega> {
    const direccion = await this.direccionRepository.findOne({ where: { id, clienteId } });
    if (!direccion) {
      throw new NotFoundException('Dirección no encontrada');
    }
    return direccion;
  }
}
