import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Empleado } from '../../../database/entities/empleado.entity';
import { asignarDefinidos } from '../../../common/asignar-definidos';
import { CreateEmpleadoDto } from '../dto/create-empleado.dto';
import { UpdateEmpleadoDto } from '../dto/update-empleado.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { EmpleadoSeguro } from '../interfaces/empleados.interface';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepository: Repository<Empleado>,
  ) {}

  async findAll(): Promise<EmpleadoSeguro[]> {
    const empleados = await this.empleadoRepository.find({ order: { nombre: 'ASC' } });
    return empleados.map((empleado) => this.mapEmpleado(empleado));
  }

  async create(dto: CreateEmpleadoDto): Promise<EmpleadoSeguro> {
    const existente = await this.empleadoRepository.findOne({ where: { usuario: dto.usuario } });
    if (existente) {
      throw new ConflictException(`Ya existe un empleado con el usuario "${dto.usuario}"`);
    }

    const empleado = this.empleadoRepository.create({
      nombre: dto.nombre,
      usuario: dto.usuario,
      rol: dto.rol,
      passwordHash: await bcrypt.hash(dto.password, 10),
      activo: true,
    });

    const guardado = await this.empleadoRepository.save(empleado);
    return this.mapEmpleado(guardado);
  }

  async update(id: string, dto: UpdateEmpleadoDto): Promise<EmpleadoSeguro> {
    const empleado = await this.buscar(id);
    asignarDefinidos(empleado, dto);
    const guardado = await this.empleadoRepository.save(empleado);
    return this.mapEmpleado(guardado);
  }

  // El empleado autenticado cambia su propia contraseña — nunca la de otro
  // (no recibe id por parámetro, solo el id que viene del JWT).
  async cambiarPassword(empleadoId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const empleado = await this.empleadoRepository.findOne({ where: { id: empleadoId } });
    if (!empleado) {
      throw new ForbiddenException('Empleado no encontrado');
    }

    const passwordValida = await bcrypt.compare(dto.passwordActual, empleado.passwordHash);
    if (!passwordValida) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    empleado.passwordHash = await bcrypt.hash(dto.passwordNueva, 10);
    await this.empleadoRepository.save(empleado);

    return { message: 'Contraseña actualizada.' };
  }

  private async buscar(id: string): Promise<Empleado> {
    const empleado = await this.empleadoRepository.findOne({ where: { id } });
    if (!empleado) {
      throw new NotFoundException(`Empleado con id ${id} no encontrado`);
    }
    return empleado;
  }

  private mapEmpleado(empleado: Empleado): EmpleadoSeguro {
    const { passwordHash: _passwordHash, ...resto } = empleado;
    return resto;
  }
}
