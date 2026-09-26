import { describe, expect, it } from 'vitest';
import type { PedidoLinea } from '@domain/pedidos/pedido.model';
import { claseEstado, esActivo, etiquetaEstado, numeroOrden, pasosRastreo } from './pedido-estado';

const pedido = (extra: Partial<PedidoLinea>) =>
  ({ id: 'abcdef12-0000', origen: 'linea', estado: 'recibido', ...extra }) as PedidoLinea;

describe('pedido-estado', () => {
  it('recoger en tienda no pasa por "enviado"', () => {
    expect(pasosRastreo('recoger_en_tienda')).not.toContain('enviado');
    expect(pasosRastreo('envio_a_domicilio')).toContain('enviado');
  });

  it('clasifica el estado para el color', () => {
    expect(claseEstado('entregado')).toBe('entregado');
    expect(claseEstado('cancelado')).toBe('cancelado');
    expect(claseEstado('en_preparacion')).toBe('en-curso');
  });

  it('un pedido está activo solo si es en línea y no terminó', () => {
    expect(esActivo(pedido({ estado: 'listo' }))).toBe(true);
    expect(esActivo(pedido({ estado: 'entregado' }))).toBe(false);
    expect(esActivo(pedido({ origen: 'tienda', estado: 'entregado' }))).toBe(false);
  });

  it('etiqueta las compras de tienda distinto a los pedidos en línea', () => {
    expect(etiquetaEstado(pedido({ origen: 'tienda', estado: 'entregado' }))).toBe('Compra en tienda');
    expect(etiquetaEstado(pedido({ origen: 'tienda', estado: 'cancelado' }))).toBe('Cancelada');
    expect(etiquetaEstado(pedido({ estado: 'en_preparacion' }))).toBe('En preparación');
  });

  it('el número de orden son los 8 primeros caracteres en mayúsculas', () => {
    expect(numeroOrden(pedido({}))).toBe('ABCDEF12');
  });
});
