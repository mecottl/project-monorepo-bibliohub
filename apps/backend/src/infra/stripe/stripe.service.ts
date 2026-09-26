import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';

// Único punto de acceso a Stripe: los módulos inyectan este servicio (y en pruebas se
// sustituye por un doble) en lugar de crear su propio cliente.
@Injectable()
export class StripeService {
  private cliente: Stripe | null = null;

  get api(): Stripe {
    if (!this.cliente) {
      const apiKey = process.env.STRIPE_SECRET_KEY;
      if (!apiKey) {
        throw new BadRequestException('Stripe no está configurado todavía (falta STRIPE_SECRET_KEY)');
      }
      this.cliente = new Stripe(apiKey);
    }
    return this.cliente;
  }

  // Verifica la firma del webhook y devuelve el evento.
  construirEvento(rawBody: Buffer, firma: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET no está configurado');
    }
    try {
      return this.api.webhooks.constructEvent(rawBody, firma, webhookSecret);
    } catch (error) {
      throw new BadRequestException(
        `Firma de webhook inválida: ${error instanceof Error ? error.message : 'error desconocido'}`,
      );
    }
  }
}
