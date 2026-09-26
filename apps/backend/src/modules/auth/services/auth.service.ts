import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';
import { LogAcceso, EventoAcceso } from '../entities/log-acceso.entity';
import { LoginDto } from '../dto/login.dto';
import { RegistroClienteDto } from '../dto/registro-cliente.dto';
import { JwtPayload } from '@common/auth/jwt-payload.interface';
import { Sesion } from '../entities/sesion.entity';
import * as crypto from 'crypto';
import { EMAIL_SERVICE } from '@infra/email/email.interface';
import type { EmailService } from '@infra/email/email.interface';

const TELEFONO_REGEX = /^[0-9]{10}$/;

// Bloqueo temporal por cuenta (además del rate limit por IP): MAX_INTENTOS fallos seguidos en la ventana.
export const MAX_INTENTOS_FALLIDOS = 5;
export const VENTANA_BLOQUEO_MIN = 15;

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
    @Inject(EMAIL_SERVICE) private readonly email: EmailService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResult> {
    const esTelefono = TELEFONO_REGEX.test(dto.identificador.trim());

    return esTelefono
      ? this.loginCliente(dto.identificador.trim(), dto.password, ip, userAgent)
      : this.loginEmpleado(dto.identificador.trim(), dto.password, ip, userAgent);
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

    await this.exigirNoBloqueado({ clienteId: cliente.id });
    const passwordValido = await bcrypt.compare(password, cliente.passwordHash);
    if (!passwordValido) {
      await this.registrarLogFallido(cliente.id, ip, userAgent);
      await this.avisarSiSeBloqueo({ clienteId: cliente.id }, cliente.email);
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

    await this.exigirNoBloqueado({ empleadoId: empleado.id });
    const passwordValido = await bcrypt.compare(password, empleado.passwordHash);
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
        throw new BadRequestException('El nombre es requerido para clientes nuevos');
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

  // Fallos desde el último acceso correcto, dentro de la ventana de bloqueo.
  private async intentosFallidosRecientes(cuenta: {
    clienteId?: string;
    empleadoId?: string;
  }): Promise<number> {
    const desde = new Date(Date.now() - VENTANA_BLOQUEO_MIN * 60_000);
    const ultimoOk = await this.logAccesoRepo.findOne({
      where: { ...cuenta, evento: 'login_ok' },
      order: { fecha: 'DESC' },
    });
    const limite = ultimoOk && ultimoOk.fecha > desde ? ultimoOk.fecha : desde;
    return this.logAccesoRepo.count({
      where: { ...cuenta, evento: 'login_fallido', fecha: MoreThan(limite) },
    });
  }

  private async exigirNoBloqueado(cuenta: {
    clienteId?: string;
    empleadoId?: string;
  }): Promise<void> {
    if ((await this.intentosFallidosRecientes(cuenta)) >= MAX_INTENTOS_FALLIDOS) {
      throw new HttpException(
        `Demasiados intentos fallidos. Intenta de nuevo en ${VENTANA_BLOQUEO_MIN} minutos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  // Al llegar al límite avisa al cliente por correo (si tiene uno); un fallo de envío no afecta al login.
  private async avisarSiSeBloqueo(
    cuenta: { clienteId: string },
    correo: string | null,
  ): Promise<void> {
    if (!correo || (await this.intentosFallidosRecientes(cuenta)) !== MAX_INTENTOS_FALLIDOS) return;
    try {
      await this.email.enviar({
        para: correo,
        asunto: 'Bloqueo temporal de tu cuenta de BiblioHub',
        texto:
          `Detectamos ${MAX_INTENTOS_FALLIDOS} intentos fallidos de inicio de sesión en tu cuenta. ` +
          `Por seguridad, quedó bloqueada durante ${VENTANA_BLOQUEO_MIN} minutos. ` +
          'Si no fuiste tú, cambia tu contraseña cuando puedas entrar de nuevo.',
      });
    } catch (error) {
      this.logger.warn(`No se pudo enviar el aviso de bloqueo: ${(error as Error).message}`);
    }
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

  // Cierra todas las sesiones de la cuenta (incluida la actual) en todos los dispositivos.
  async cerrarTodasLasSesiones(
    user: { id: string; tipo: 'cliente' | 'empleado' },
    ip?: string,
    userAgent?: string,
  ): Promise<{ cerradas: number }> {
    const { affected } = await this.sesionRepo.delete(
      user.tipo === 'cliente' ? { clienteId: user.id } : { empleadoId: user.id },
    );
    await this.logAccesoRepo.save(
      this.logAccesoRepo.create({
        clienteId: user.tipo === 'cliente' ? user.id : null,
        empleadoId: user.tipo === 'empleado' ? user.id : null,
        evento: 'logout' as EventoAcceso,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      }),
    );
    return { cerradas: affected ?? 0 };
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
