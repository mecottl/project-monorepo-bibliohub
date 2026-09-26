import { Test } from '@nestjs/testing';
import { DataSource, QueryRunner } from 'typeorm';
import { AppModule } from '../src/app.module';

// #71: reglas de dinero y puntos en SQL (calcular_totales_pedido, confirmar_pedido_linea,
// confirmar_venta_pos, cancelar_venta). Cada prueba corre dentro de una transacción que se
// revierte, así que no deja datos en la base.
describe('Reglas de dinero y puntos (SQL)', () => {
  let ds: DataSource;
  let qr: QueryRunner;
  let clienteId: string;
  let carritoId: string;
  let libroA: string;
  let libroB: string;
  let empleadoId: string;

  const sufijo = () => `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const q = async (sql: string, params: unknown[] = []): Promise<any[]> => qr.query(sql, params);

  const config = (clave: string, valor: string) =>
    q('UPDATE configuracion SET valor = $2 WHERE clave = $1', [clave, valor]);

  const totales = async (tipo: string, puntos: number) => {
    const [t] = await q('SELECT * FROM calcular_totales_pedido($1, $2, $3)', [clienteId, tipo, puntos]);
    return {
      subtotal: Number(t.subtotal),
      descuento: Number(t.descuento_puntos),
      envio: Number(t.costo_envio),
      total: Number(t.total),
      ganados: Number(t.puntos_ganados),
    };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    ds = moduleRef.get(DataSource);
  });

  afterAll(async () => {
    await ds?.destroy();
  });

  beforeEach(async () => {
    qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    const s = sufijo();
    // Parámetros fijos para los escenarios (se revierten con la transacción).
    await config('tasa_puntos_canje', '2');
    await config('tasa_puntos_acumulacion', '10');
    await config('costo_envio_default', '50');
    await config('envio_gratis_desde', '500');

    [{ id: libroA }] = await q(
      `INSERT INTO libro (isbn, titulo, precio_venta, precio_costo, stock_actual)
       VALUES ($1, 'Libro A', 100, 40, 10) RETURNING id`,
      [`A${s}`.slice(0, 20)],
    );
    [{ id: libroB }] = await q(
      `INSERT INTO libro (isbn, titulo, precio_venta, precio_costo, stock_actual)
       VALUES ($1, 'Libro B', 33.33, 10, 10) RETURNING id`,
      [`B${s}`.slice(0, 20)],
    );
    [{ id: clienteId }] = await q(`INSERT INTO cliente (telefono) VALUES ($1) RETURNING id`, [
      `9${s}`.slice(0, 15),
    ]);
    [{ id: empleadoId }] = await q(
      `INSERT INTO empleado (nombre, rol, usuario, password_hash)
       VALUES ('Test', 'cajero', $1, 'x') RETURNING id`,
      [`t${s}`.slice(0, 40)],
    );
    [{ id: carritoId }] = await q('INSERT INTO carrito (cliente_id) VALUES ($1) RETURNING id', [clienteId]);
    // Saldo inicial de 50 puntos (el trigger sincroniza cliente.puntos_saldo).
    await q(
      `INSERT INTO transaccion_puntos (cliente_id, tipo, puntos, canal, concepto)
       VALUES ($1, 'ganado', 50, 'online', 'inicial')`,
      [clienteId],
    );
  });

  afterEach(async () => {
    await qr.rollbackTransaction();
    await qr.release();
  });

  const agregar = (libroId: string, cantidad: number) =>
    q('INSERT INTO item_carrito (carrito_id, libro_id, cantidad) VALUES ($1, $2, $3)', [
      carritoId,
      libroId,
      cantidad,
    ]);

  describe('calcular_totales_pedido', () => {
    it('sin puntos y recoger en tienda: total = subtotal', async () => {
      await agregar(libroA, 2);
      await agregar(libroB, 1); // 200 + 33.33
      expect(await totales('recoger_en_tienda', 0)).toEqual({
        subtotal: 233.33,
        descuento: 0,
        envio: 0,
        total: 233.33,
        ganados: 23, // floor(233.33 / 10)
      });
    });

    it('con puntos: descuento = puntos x tasa de canje y los puntos ganados salen del neto', async () => {
      await agregar(libroA, 3); // 300
      expect(await totales('recoger_en_tienda', 20)).toEqual({
        subtotal: 300,
        descuento: 40,
        envio: 0,
        total: 260,
        ganados: 26,
      });
    });

    it('envio a domicilio: cobra el costo bajo el umbral y es gratis desde el umbral', async () => {
      await agregar(libroA, 4); // 400 < 500
      const pago = await totales('envio_a_domicilio', 0);
      expect(pago.envio).toBe(50);
      expect(pago.total).toBe(450);
      await agregar(libroB, 0 + 1); // 433.33
      await q('UPDATE item_carrito SET cantidad = 5 WHERE carrito_id = $1 AND libro_id = $2', [carritoId, libroA]);
      const gratis = await totales('envio_a_domicilio', 0); // 500 + 33.33
      expect(gratis.envio).toBe(0);
      expect(gratis.total).toBe(533.33);
    });

    it('el envio se evalua sobre el subtotal, no sobre el neto con puntos', async () => {
      await agregar(libroA, 5); // 500 -> envio gratis aunque los puntos bajen el neto
      const t = await totales('envio_a_domicilio', 30); // -60
      expect(t.envio).toBe(0);
      expect(t.total).toBe(440);
    });

    it('un carrito inexistente falla', async () => {
      await q('DELETE FROM carrito WHERE id = $1', [carritoId]);
      await expect(totales('recoger_en_tienda', 0)).rejects.toThrow(/no tiene carrito activo/);
    });
  });

  describe('confirmar_pedido_linea', () => {
    it('crea el pedido con los mismos totales de la vista previa, descuenta stock y ajusta el saldo', async () => {
      await agregar(libroA, 3);
      const previa = await totales('envio_a_domicilio', 20);
      const [{ id: direccionId }] = await q(
        `INSERT INTO direccion_entrega (cliente_id, alias, calle, colonia, ciudad, estado, codigo_postal, activo, es_principal)
         VALUES ($1, 'Casa', 'Calle 1', 'Centro', 'Ciudad', 'Estado', '00000', true, true) RETURNING id`,
        [clienteId],
      );
      const [{ id }] = await q('SELECT confirmar_pedido_linea($1, $2, $3, $4) AS id', [
        clienteId,
        direccionId,
        'envio_a_domicilio',
        20,
      ]);
      const [pedido] = await q('SELECT * FROM pedido_linea WHERE id = $1', [id]);
      expect(Number(pedido.subtotal)).toBe(previa.subtotal);
      expect(Number(pedido.descuento_puntos)).toBe(previa.descuento);
      expect(Number(pedido.costo_envio)).toBe(previa.envio);
      expect(Number(pedido.total)).toBe(previa.total);
      expect(Number(pedido.puntos_ganados)).toBe(previa.ganados);

      const [libro] = await q('SELECT stock_actual FROM libro WHERE id = $1', [libroA]);
      expect(libro.stock_actual).toBe(7);
      const [cliente] = await q('SELECT puntos_saldo FROM cliente WHERE id = $1', [clienteId]);
      expect(cliente.puntos_saldo).toBe(50 - 20 + previa.ganados);
      expect(await q('SELECT 1 FROM item_carrito WHERE carrito_id = $1', [carritoId])).toHaveLength(0);
    });

    it('con stock insuficiente falla', async () => {
      await agregar(libroA, 11);
      await expect(
        q('SELECT confirmar_pedido_linea($1, NULL, $2, 0)', [clienteId, 'recoger_en_tienda']),
      ).rejects.toThrow(/Stock insuficiente/);
    });
  });

  describe('confirmar_venta_pos y cancelar_venta', () => {
    const items = (cantidad: number) => JSON.stringify([{ libro_id: libroA, cantidad, precio_unitario: 100 }]);

    it('aplica el descuento por puntos, registra ganados/canjeados y cancelar_venta lo revierte', async () => {
      const [{ id }] = await q('SELECT confirmar_venta_pos($1, $2, $3, $4, $5::jsonb) AS id', [
        clienteId,
        empleadoId,
        'efectivo',
        20,
        items(3),
      ]);
      const [venta] = await q('SELECT * FROM venta WHERE id = $1', [id]);
      expect(Number(venta.subtotal)).toBe(300);
      expect(Number(venta.descuento_puntos)).toBe(40);
      expect(Number(venta.total)).toBe(260);
      expect(venta.puntos_ganados).toBe(26);
      expect((await q('SELECT puntos_saldo FROM cliente WHERE id = $1', [clienteId]))[0].puntos_saldo).toBe(56);
      expect((await q('SELECT stock_actual FROM libro WHERE id = $1', [libroA]))[0].stock_actual).toBe(7);

      await q('SELECT cancelar_venta($1)', [id]);
      expect((await q('SELECT puntos_saldo FROM cliente WHERE id = $1', [clienteId]))[0].puntos_saldo).toBe(50);
      expect((await q('SELECT stock_actual FROM libro WHERE id = $1', [libroA]))[0].stock_actual).toBe(10);
      expect((await q('SELECT estado FROM venta WHERE id = $1', [id]))[0].estado).toBe('cancelada');
      await expect(q('SELECT cancelar_venta($1)', [id])).rejects.toThrow(/ya está cancelada/);
    });

    it('sin cliente no hay descuento ni puntos', async () => {
      const [{ id }] = await q('SELECT confirmar_venta_pos(NULL, $1, $2, 0, $3::jsonb) AS id', [
        empleadoId,
        'efectivo',
        items(1),
      ]);
      const [venta] = await q('SELECT * FROM venta WHERE id = $1', [id]);
      expect(Number(venta.descuento_puntos)).toBe(0);
      expect(Number(venta.total)).toBe(100);
    });
  });
});
