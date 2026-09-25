import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Cliente } from '../../database/entities/cliente.entity';
import { Sesion } from '../../database/entities/sesion.entity';
import { RecuperacionPassword } from '../../database/entities/recuperacion-password.entity';
import { EMAIL_SERVICE } from './email/email.interface';
import type { EmailService } from './email/email.interface';

const VIDA_TOKEN_MS = 60 * 60 * 1000;
const sha256 = (valor: string) => crypto.createHash('sha256').update(valor).digest('hex');

// Solo clientes: la tabla empleado no tiene email, así que un empleado que
// olvide su contraseña la restablece con un admin (PATCH /empleados/:id).
@Injectable()
export class RecuperacionService {
  private readonly logger = new Logger(RecuperacionService.name);

  constructor(
    @InjectRepository(Cliente) private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(Sesion) private readonly sesionRepo: Repository<Sesion>,
    @InjectRepository(RecuperacionPassword)
    private readonly recuperacionRepo: Repository<RecuperacionPassword>,
    @Inject(EMAIL_SERVICE) private readonly email: EmailService,
  ) {}

  // Siempre responde igual, exista o no la cuenta — no revela qué correos o
  // teléfonos están registrados.
  async solicitar(identificador: string): Promise<{ message: string }> {
    const valor = identificador.trim();
    const cliente = await this.clienteRepo.findOne({
      where: valor.includes('@') ? { email: valor } : { telefono: valor },
    });

    if (cliente?.cuentaActiva && cliente.email) {
      const token = crypto.randomBytes(32).toString('hex');
      await this.recuperacionRepo.save(
        this.recuperacionRepo.create({
          clienteId: cliente.id,
          tokenHash: sha256(token),
          expiraEn: new Date(Date.now() + VIDA_TOKEN_MS),
        }),
      );

      const base = process.env.FRONTEND_URL ?? 'http://localhost:4200';
      try {
        await this.email.enviar({
          para: cliente.email,
          asunto: 'Recupera tu contraseña — BiblioHub',
          texto:
            `Hola${cliente.nombre ? ` ${cliente.nombre}` : ''},\n\n` +
            `Para crear una contraseña nueva entra a este enlace (vence en 1 hora):\n` +
            `${base}/login/reset-password?token=${token}\n\n` +
            `Si no lo pediste tú, ignora este correo.`,
        });
      } catch (error) {
        this.logger.error(`No se pudo enviar el correo de recuperación: ${String(error)}`);
      }
    }

    return {
      message: 'Si la cuenta existe y tiene correo, te enviamos un enlace para recuperarla.',
    };
  }

  async restablecer(token: string, password: string): Promise<{ message: string }> {
    const registro = await this.recuperacionRepo.findOne({ where: { tokenHash: sha256(token) } });

    if (!registro || registro.usado || registro.expiraEn < new Date()) {
      throw new BadRequestException('El enlace es inválido o ya expiró. Solicita uno nuevo.');
    }

    await this.clienteRepo.update(registro.clienteId, {
      passwordHash: await bcrypt.hash(password, 10),
    });
    await this.recuperacionRepo.update(registro.id, { usado: true });
    // Cierra las sesiones abiertas: quien tuviera la contraseña vieja pierde acceso.
    await this.sesionRepo.delete({ clienteId: registro.clienteId });

    return { message: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
  }
}
