-- El proyecto no usa migraciones formales de TypeORM (synchronize: false,
-- sin carpeta de migrations); este archivo documenta un cambio de esquema
-- aplicado a mano y debe correrse en cualquier otro entorno (staging/prod).
--
-- Motivo: integración de pagos con Stripe para el checkout online
-- (carrito -> confirmar_pedido_linea). confirmar_pedido_linea() no recibe
-- ni gestiona el pago — se sigue llamando tal cual, y justo después de que
-- el webhook de Stripe confirma el cobro, se completan estas dos columnas
-- sobre la fila de pedido_linea recién creada.

ALTER TABLE pedido_linea ADD COLUMN stripe_payment_intent_id varchar(255) NULL UNIQUE;
ALTER TABLE pedido_linea ADD COLUMN estado_pago varchar(20) NOT NULL DEFAULT 'pendiente'
  CONSTRAINT pedido_linea_estado_pago_check CHECK (estado_pago IN ('pendiente', 'pagado', 'fallido', 'reembolsado'));
