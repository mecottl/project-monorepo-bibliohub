import { BadRequestException } from '@nestjs/common';
import { CheckoutService } from './checkout.service';

const metadata = {
  clienteId: 'cli-1',
  direccionId: '',
  tipoEntrega: 'recoger_en_tienda',
  puntosUsados: '20',
};
const intent = { id: 'pi_1', metadata, status: 'succeeded' };

function crear(opciones: { existente?: { id: string } | null; eventoTipo?: string } = {}) {
  const pedidoRepo = {
    findOne: jest.fn().mockResolvedValue(opciones.existente ?? null),
    update: jest.fn().mockResolvedValue(undefined),
  };
  const dataSource = { query: jest.fn().mockResolvedValue([{ id: 'pedido-1' }]) };
  const stripe = {
    construirEvento: jest.fn().mockReturnValue({
      type: opciones.eventoTipo ?? 'payment_intent.succeeded',
      data: { object: intent },
    }),
    api: { paymentIntents: { retrieve: jest.fn().mockResolvedValue(intent) } },
  };
  const servicio = new CheckoutService(
    {} as never,
    {} as never,
    {} as never,
    pedidoRepo as never,
    {} as never,
    stripe as never,
    dataSource as never,
  );
  return { servicio, pedidoRepo, dataSource, stripe };
}

describe('CheckoutService (pago)', () => {
  it('un evento que no es payment_intent.succeeded se ignora', async () => {
    const { servicio, dataSource } = crear({ eventoTipo: 'charge.refunded' });
    await servicio.manejarWebhook(Buffer.from('{}'), 'firma');
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('el webhook crea el pedido con la función SQL y marca el pago', async () => {
    const { servicio, dataSource, pedidoRepo } = crear();
    await servicio.manejarWebhook(Buffer.from('{}'), 'firma');
    expect(dataSource.query).toHaveBeenCalledWith(
      'SELECT confirmar_pedido_linea($1, $2, $3, $4) AS id',
      ['cli-1', null, 'recoger_en_tienda', 20],
    );
    expect(pedidoRepo.update).toHaveBeenCalledWith(
      'pedido-1',
      expect.objectContaining({ stripePaymentIntentId: 'pi_1', estadoPago: 'pagado' }),
    );
  });

  it('es idempotente: si el pago ya se procesó no vuelve a crear el pedido', async () => {
    const { servicio, dataSource } = crear({ existente: { id: 'pedido-previo' } });
    expect(await servicio.confirmarPago('cli-1', 'pi_1')).toEqual({ pedidoId: 'pedido-previo' });
    expect(dataSource.query).not.toHaveBeenCalled();
  });

  it('confirmarPago rechaza un pago de otro cliente o no confirmado', async () => {
    const { servicio, stripe } = crear();
    await expect(servicio.confirmarPago('otro', 'pi_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    stripe.api.paymentIntents.retrieve.mockResolvedValue({
      ...intent,
      status: 'requires_payment_method',
    });
    await expect(servicio.confirmarPago('cli-1', 'pi_1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
