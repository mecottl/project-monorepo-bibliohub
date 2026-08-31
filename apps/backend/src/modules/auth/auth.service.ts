import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cliente } from '../../database/entities/cliente.entity';
import { Empleado } from '../../database/entities/empleado.entity';
import {
  LogAcceso,
  EventoAcceso,
} from '../../database/entities/log-acceso.entity';
import { LoginDto } from './dto/login.dto';
import { RegistroClienteDto } from './dto/registro-cliente.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Sesion } from '../../database/entities/sesion.entity';
import * as crypto from 'crypto';

const TELEFONO_REGEX = /^[0-9]{10}$/;

export interface LoginResult {
  accessToken: string;
  tipo: 'cliente' | 'empleado';
  perfil: {
    id: string;
    nombre: string;
    rol: string;
    telefono?: string;
    puntosSaldo?: number;
  };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    @InjectRepository(LogAcceso)
    private readonly logAccesoRepo: Repository<LogAcceso>,
    @InjectRepository(Sesion)
    private readonly sesionRepo: Repository<Sesion>,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    dto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const esTelefono = TELEFONO_REGEX.test(dto.identificador.trim());

    return esTelefono
      ? this.loginCliente(dto.identificador.trim(), dto.password, ip, userAgent)
      : this.loginEmpleado(
          dto.identificador.trim(),
          dto.password,
          ip,
          userAgent,
        );
  }

  private async loginCliente(
    telefono: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const cliente = await this.clienteRepo.findOne({ where: { telefono } });

    if (!cliente || !cliente.cuentaActiva || !cliente.passwordHash) {
      await this.registrarLogFallido(null, ip, userAgent);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(password, cliente.passwordHash);
    if (!passwordValido) {
      await this.registrarLogFallido(cliente.id, ip, userAgent);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.registrarLogExitoso({ clienteId: cliente.id }, ip, userAgent);

    const payload: JwtPayload = {
      sub: cliente.id,
      tipo: 'cliente',
      rol: 'cliente',
      nombre: cliente.nombre ?? cliente.telefono,
    };

    const accessToken = this.jwtService.sign(payload);
    await this.guardarSesion(accessToken, { clienteId: cliente.id });

    return {
      accessToken,
      tipo: 'cliente',
      perfil: {
        id: cliente.id,
        nombre: cliente.nombre ?? cliente.telefono,
        rol: 'cliente',
        telefono: cliente.telefono,
        puntosSaldo: cliente.puntosSaldo,
      },
    };
  }

  private async loginEmpleado(
    usuario: string,
    password: string,
    ip?: string,
    userAgent?: string,
  ): Promise<LoginResult> {
    const empleado = await this.empleadoRepo.findOne({ where: { usuario } });

    if (!empleado || !empleado.activo) {
      await this.registrarLogFallido(null, ip, userAgent);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(
      password,
      empleado.passwordHash,
    );
    if (!passwordValido) {
      await this.registrarLogFallido(null, ip, userAgent, empleado.id);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.registrarLogExitoso({ empleadoId: empleado.id }, ip, userAgent);

    const payload: JwtPayload = {
      sub: empleado.id,
      tipo: 'empleado',
      rol: empleado.rol,
      nombre: empleado.nombre,
    };
    const accessToken = this.jwtService.sign(payload);
    await this.guardarSesion(accessToken, { empleadoId: empleado.id });
    return {
      accessToken,
      tipo: 'empleado',
      perfil: {
        id: empleado.id,
        nombre: empleado.nombre,
        rol: empleado.rol,
      },
    };
  }

  async registrarCliente(dto: RegistroClienteDto): Promise<LoginResult> {
    let cliente = await this.clienteRepo.findOne({
      where: { telefono: dto.telefono },
    });

    if (cliente) {
      if (cliente.cuentaActiva) {
        throw new ConflictException('Este teléfono ya tiene una cuenta activa');
      }
      cliente.passwordHash = await bcrypt.hash(dto.password, 10);
      cliente.cuentaActiva = true;
      if (dto.email) cliente.email = dto.email;
      if (dto.nombre) cliente.nombre = dto.nombre;
    } else {
      if (!dto.nombre) {
        throw new BadRequestException(
          'El nombre es requerido para clientes nuevos',
        );
      }
      cliente = this.clienteRepo.create({
        telefono: dto.telefono,
        nombre: dto.nombre,
        email: dto.email ?? null,
        passwordHash: await bcrypt.hash(dto.password, 10),
        cuentaActiva: true,
        puntosSaldo: 0,
      });
    }

    cliente = await this.clienteRepo.save(cliente);

    const payload: JwtPayload = {
      sub: cliente.id,
      tipo: 'cliente',
      rol: 'cliente',
      nombre: cliente.nombre ?? cliente.telefono,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      tipo: 'cliente',
      perfil: {
        id: cliente.id,
        nombre: cliente.nombre ?? cliente.telefono,
        rol: 'cliente',
        telefono: cliente.telefono,
        puntosSaldo: cliente.puntosSaldo,
      },
    };
  }

  private async registrarLogExitoso(
    quien: { clienteId?: string; empleadoId?: string },
    ip?: string,
    userAgent?: string,
  ) {
    await this.logAccesoRepo.save(
      this.logAccesoRepo.create({
        clienteId: quien.clienteId ?? null,
        empleadoId: quien.empleadoId ?? null,
        evento: 'login_ok' as EventoAcceso,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );
  }

  private async registrarLogFallido(
    clienteId: string | null,
    ip?: string,
    userAgent?: string,
    empleadoId?: string,
  ) {
    await this.logAccesoRepo.save(
      this.logAccesoRepo.create({
        clienteId,
        empleadoId: empleadoId ?? null,
        evento: 'login_fallido' as EventoAcceso,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );
  }

  async logout(
    token: string,
    user: { id: string; tipo: 'cliente' | 'empleado' },
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.sesionRepo.delete({ tokenHash });
    await this.logAccesoRepo.save(
      this.logAccesoRepo.create({
        clienteId: user.tipo === 'cliente' ? user.id : null,
        empleadoId: user.tipo === 'empleado' ? user.id : null,
        evento: 'logout' as EventoAcceso,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );
  }

  private async guardarSesion(
    token: string,
    quien: { clienteId?: string; empleadoId?: string },
  ): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const expiraEn = new Date();
    expiraEn.setHours(expiraEn.getHours() + 24);
    await this.sesionRepo.save(
      this.sesionRepo.create({
        clienteId: quien.clienteId ?? null,
        empleadoId: quien.empleadoId ?? null,
        tokenHash,
        expiraEn,
      }),
    );
  }
}
