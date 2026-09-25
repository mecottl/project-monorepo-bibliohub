import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import Stripe from 'stripe';
import { Cliente } from '../../../database/entities/cliente.entity';
import { TransaccionPuntos } from '../../../database/entities/transaccion-puntos.entity';
import { Configuracion } from '../../../database/entities/configuracion.entity';
import { asignarDefinidos } from '../../../common/asignar-definidos';
import { CambiarPasswordClienteDto, UpdatePerfilDto } from '../dto/cuenta.dto';

export interface Perfil {
  id: string;
  nombre: string | null;
  telefono: string;
  email: string | null;
  puntosSaldo: number;
  fechaRegistro: Date;
}

export interface TarjetaGuardada {
  id: string;
  marca: string;
  ultimos4: string;
  expMes: number;
  expAnio: number;
}

@Injectable()
export class CuentaService {
  private stripeClient: Stripe | null = null;

  constructor(
    @InjectRepository(Cliente) private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(TransaccionPuntos)
    private readonly puntosRepo: Repository<TransaccionPuntos>,
    @InjectRepository(Configuracion)
    private readonly configuracionRepo: Repository<Configuracion>,
  ) {}

  // --- Perfil ---

  async obtenerPerfil(clienteId: string): Promise<Perfil> {
    return this.mapPerfil(await this.buscar(clienteId));
  }

  async actualizarPerfil(clienteId: string, dto: UpdatePerfilDto): Promise<Perfil> {
    const cliente = await this.buscar(clienteId);

    if (dto.email && dto.email !== cliente.email) {
      const enUso = await this.clienteRepo.findOne({ where: { email: dto.email } });
      if (enUso) {
        throw new ConflictException('Ese correo ya está registrado en otra cuenta');
      }
    }

    asignarDefinidos(cliente, dto);
    return this.mapPerfil(await this.clienteRepo.save(cliente));
  }

  async cambiarPassword(
    clienteId: string,
    dto: CambiarPasswordClienteDto,
  ): Promise<{ message: string }> {
    const cliente = await this.buscar(clienteId);

    if (!cliente.passwordHash || !(await bcrypt.compare(dto.passwordActual, cliente.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    await this.clienteRepo.update(clienteId, {
      passwordHash: await bcrypt.hash(dto.passwordNueva, 10),
    });
    return { message: 'Contraseña actualizada.' };
  }

  // --- Puntos ---

  // El saldo es un caché; la fuente de verdad es transaccion_puntos (ver
  // AGENTS.md raíz). Se devuelven ambos para mostrar saldo + historial.
  async obtenerPuntos(clienteId: string) {
    const cliente = await this.buscar(clienteId);
    const movimientos = await this.puntosRepo.find({
      where: { clienteId },
      order: { fecha: 'DESC' },
      take: 50,
    });
    const tasaAcumulacion = await this.leerConfiguracion('tasa_puntos_acumulacion');
    const tasaCanje = await this.leerConfiguracion('tasa_puntos_canje');

    return {
      saldo: cliente.puntosSaldo,
      pesosPorPunto: tasaAcumulacion,
      pesosPorPuntoCanjeado: tasaCanje,
      movimientos: movimientos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        puntos: m.puntos,
        canal: m.canal,
        concepto: m.concepto ?? null,
        fecha: m.fecha,
      })),
    };
  }

  // --- Tarjetas guardadas (Stripe) ---

  async iniciarGuardadoTarjeta(clienteId: string): Promise<{ clientSecret: string }> {
    const customerId = await this.obtenerOCrearCustomer(clienteId);
    const setupIntent = await this.stripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });
    if (!setupIntent.client_secret) {
      throw new BadRequestException('Stripe no devolvió un client_secret');
    }
    return { clientSecret: setupIntent.client_secret };
  }

  async listarTarjetas(clienteId: string): Promise<TarjetaGuardada[]> {
    const { stripeCustomerId } = await this.buscar(clienteId);
    if (!stripeCustomerId) return [];

    const metodos = await this.stripe().paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });
    return metodos.data.map((metodo) => ({
      id: metodo.id,
      marca: metodo.card?.brand ?? 'card',
      ultimos4: metodo.card?.last4 ?? '••••',
      expMes: metodo.card?.exp_month ?? 0,
      expAnio: metodo.card?.exp_year ?? 0,
    }));
  }

  async eliminarTarjeta(clienteId: string, metodoId: string): Promise<{ message: string }> {
    const { stripeCustomerId } = await this.buscar(clienteId);
    const metodo = await this.stripe().paymentMethods.retrieve(metodoId);

    // Solo se puede quitar una tarjeta que cuelgue del Customer de este cliente.
    if (!stripeCustomerId || metodo.customer !== stripeCustomerId) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    await this.stripe().paymentMethods.detach(metodoId);
    return { message: 'Tarjeta eliminada.' };
  }

  private async obtenerOCrearCustomer(clienteId: string): Promise<string> {
    const cliente = await this.buscar(clienteId);
    if (cliente.stripeCustomerId) return cliente.stripeCustomerId;

    const customer = await this.stripe().customers.create({
      name: cliente.nombre ?? undefined,
      email: cliente.email ?? undefined,
      phone: cliente.telefono,
      metadata: { clienteId },
    });
    await this.clienteRepo.update(clienteId, { stripeCustomerId: customer.id });
    return customer.id;
  }

  private async buscar(clienteId: string): Promise<Cliente> {
    const cliente = await this.clienteRepo.findOne({ where: { id: clienteId } });
    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    return cliente;
  }

  private async leerConfiguracion(clave: string): Promise<number> {
    const parametro = await this.configuracionRepo.findOne({ where: { clave } });
    return parametro ? Number(parametro.valor) : 0;
  }

  private mapPerfil(cliente: Cliente): Perfil {
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      puntosSaldo: cliente.puntosSaldo,
      fechaRegistro: cliente.fechaRegistro,
    };
  }

  private stripe(): Stripe {
    if (!this.stripeClient) {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      if (!apiKey) {
        throw new BadRequestException('Stripe no está configurado todavía (falta STRIPE_SECRET_KEY)');
      }
      this.stripeClient = new Stripe(apiKey);
    }
    return this.stripeClient;
  }
}
