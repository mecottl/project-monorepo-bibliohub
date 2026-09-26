import { StripeService } from '@infra/stripe/stripe.service';
import { ConfiguracionService } from '@modules/configuracion/services/configuracion.service';
import { CONFIG } from '@modules/configuracion/config-claves';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { TransaccionPuntos } from '@modules/clientes/entities/transaccion-puntos.entity';
import { Sesion } from '@modules/auth/entities/sesion.entity';
import { cerrarOtrasSesiones } from '@common/sesiones';
import { Venta } from '@modules/ventas/entities/venta.entity';
import { asignarDefinidos } from '@common/asignar-definidos';
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
  constructor(
    @InjectRepository(Cliente) private readonly clienteRepo: Repository<Cliente>,
    @InjectRepository(TransaccionPuntos)
    private readonly puntosRepo: Repository<TransaccionPuntos>,
    private readonly configuracion: ConfiguracionService,
    private readonly stripe: StripeService,
    @InjectRepository(Venta) private readonly ventaRepo: Repository<Venta>,
    @InjectRepository(Sesion) private readonly sesionRepo: Repository<Sesion>,
  ) {}

  // --- Compras en tienda (ventas POS ligadas al cliente) ---

  async listarComprasTienda(clienteId: string, baseUrl: string) {
    const ventas = await this.ventaRepo.find({
      where: { clienteId },
      relations: ['detalles', 'detalles.libro'],
      order: { fecha: 'DESC' },
    });
    return ventas.map((venta) => this.mapVenta(venta, baseUrl));
  }

  async obtenerCompraTienda(clienteId: string, id: string, baseUrl: string) {
    const venta = await this.ventaRepo.findOne({
      where: { id, clienteId },
      relations: ['detalles', 'detalles.libro'],
    });
    if (!venta) {
      throw new NotFoundException('Compra no encontrada');
    }
    return this.mapVenta(venta, baseUrl);
  }

  // Misma forma que un pedido en línea para que el frontend liste ambos juntos.
  private mapVenta(venta: Venta, baseUrl: string) {
    return {
      id: venta.id,
      origen: 'tienda' as const,
      fecha: venta.fecha,
      estado: venta.estado === 'cancelada' ? 'cancelado' : 'entregado',
      tipoEntrega: 'recoger_en_tienda' as const,
      subtotal: Number(venta.subtotal),
      descuentoPuntos: Number(venta.descuentoPuntos),
      costoEnvio: 0,
      total: Number(venta.total),
      puntosGanados: venta.puntosGanados,
      estadoPago: 'pagado' as const,
      medioPago: venta.medioPago,
      direccion: null,
      detalles: (venta.detalles ?? []).map((detalle) => ({
        id: detalle.id,
        libroId: detalle.libroId,
        cantidad: detalle.cantidad,
        precioUnitario: Number(detalle.precioUnitario),
        subtotalLinea: Number(detalle.subtotalLinea),
        libro: {
          id: detalle.libro.id,
          titulo: detalle.libro.titulo,
          imagenUrl: detalle.libro.imagenKey
            ? `${baseUrl}/uploads/portadas/${detalle.libro.imagenKey}`
            : null,
        },
      })),
    };
  }

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
    hashSesionActual?: string,
  ): Promise<{ message: string }> {
    const cliente = await this.buscar(clienteId);

    if (!cliente.passwordHash || !(await bcrypt.compare(dto.passwordActual, cliente.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    await this.clienteRepo.update(clienteId, {
      passwordHash: await bcrypt.hash(dto.passwordNueva, 10),
    });
    await cerrarOtrasSesiones(this.sesionRepo, { clienteId }, hashSesionActual);
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
    const tasaAcumulacion = await this.configuracion.valorNumerico(CONFIG.tasaPuntosAcumulacion, 0);
    const tasaCanje = await this.configuracion.valorNumerico(CONFIG.tasaPuntosCanje, 0);

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
    const setupIntent = await this.stripe.api.setupIntents.create({
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

    const metodos = await this.stripe.api.paymentMethods.list({
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
    const metodo = await this.stripe.api.paymentMethods.retrieve(metodoId);

    // Solo se puede quitar una tarjeta que cuelgue del Customer de este cliente.
    if (!stripeCustomerId || metodo.customer !== stripeCustomerId) {
      throw new NotFoundException('Tarjeta no encontrada');
    }

    await this.stripe.api.paymentMethods.detach(metodoId);
    return { message: 'Tarjeta eliminada.' };
  }

  private async obtenerOCrearCustomer(clienteId: string): Promise<string> {
    const cliente = await this.buscar(clienteId);
    if (cliente.stripeCustomerId) return cliente.stripeCustomerId;

    const customer = await this.stripe.api.customers.create({
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
}
