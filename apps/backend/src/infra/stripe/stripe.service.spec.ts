import { BadRequestException } from '@nestjs/common';
import { StripeService } from './stripe.service';

describe('StripeService', () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
  });

  it('sin STRIPE_SECRET_KEY falla con un mensaje claro', () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => new StripeService().api).toThrow(BadRequestException);
  });

  it('reutiliza el mismo cliente', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    const servicio = new StripeService();
    expect(servicio.api).toBe(servicio.api);
  });

  it('el webhook exige STRIPE_WEBHOOK_SECRET y firma válida', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const servicio = new StripeService();
    expect(() => servicio.construirEvento(Buffer.from('{}'), 'x')).toThrow(/WEBHOOK_SECRET/);
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
    expect(() => servicio.construirEvento(Buffer.from('{}'), 'firma-mala')).toThrow(/Firma de webhook inválida/);
  });
});
