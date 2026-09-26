-- #71: una sola fuente de verdad para el cálculo de totales de un pedido en línea.
-- calcular_totales_pedido() es de solo lectura: la usan la vista previa del checkout
-- (NestJS) y confirmar_pedido_linea(), de modo que no puedan divergir.

CREATE OR REPLACE FUNCTION public.calcular_totales_pedido(
    p_cliente_id uuid,
    p_tipo_entrega character varying,
    p_puntos_usados integer
) RETURNS TABLE (
    subtotal numeric,
    descuento_puntos numeric,
    costo_envio numeric,
    total numeric,
    puntos_ganados integer
)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_tasa_canje    NUMERIC;
    v_tasa_acum     INT;
    v_envio_default NUMERIC(10,2);
    v_envio_gratis  NUMERIC(10,2);
    v_carrito_id    UUID;
    v_subtotal      NUMERIC(10,2);
    v_descuento     NUMERIC(10,2) := 0;
    v_costo_envio   NUMERIC(10,2) := 0;
    v_neto          NUMERIC(10,2);
BEGIN
    v_tasa_canje := COALESCE((SELECT valor::NUMERIC FROM configuracion WHERE clave = 'tasa_puntos_canje'), 1);
    SELECT valor::INT     INTO v_tasa_acum     FROM configuracion WHERE clave = 'tasa_puntos_acumulacion';
    SELECT valor::NUMERIC INTO v_envio_default FROM configuracion WHERE clave = 'costo_envio_default';
    SELECT valor::NUMERIC INTO v_envio_gratis  FROM configuracion WHERE clave = 'envio_gratis_desde';

    SELECT id INTO v_carrito_id FROM carrito WHERE cliente_id = p_cliente_id;
    IF v_carrito_id IS NULL THEN
        RAISE EXCEPTION 'El cliente % no tiene carrito activo', p_cliente_id;
    END IF;

    SELECT COALESCE(SUM(ic.cantidad * l.precio_venta), 0) INTO v_subtotal
    FROM item_carrito ic
    JOIN libro l ON l.id = ic.libro_id
    WHERE ic.carrito_id = v_carrito_id;

    IF p_puntos_usados > 0 THEN
        v_descuento := p_puntos_usados * v_tasa_canje;
    END IF;

    IF p_tipo_entrega = 'envio_a_domicilio' THEN
        v_costo_envio := CASE WHEN v_subtotal >= v_envio_gratis THEN 0 ELSE v_envio_default END;
    END IF;

    v_neto := GREATEST(v_subtotal - v_descuento, 0);

    RETURN QUERY SELECT v_subtotal, v_descuento, v_costo_envio,
                        v_neto + v_costo_envio, FLOOR(v_neto / v_tasa_acum)::INT;
END;
$$;

-- confirmar_pedido_linea() delega el cálculo en calcular_totales_pedido().
CREATE OR REPLACE FUNCTION public.confirmar_pedido_linea(
    p_cliente_id uuid,
    p_direccion_id uuid,
    p_tipo_entrega character varying,
    p_puntos_usados integer
) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_pedido_id      UUID;
    v_carrito_id     UUID;
    v_item           RECORD;
    v_t              RECORD;
BEGIN
    SELECT id INTO v_carrito_id FROM carrito WHERE cliente_id = p_cliente_id;
    IF v_carrito_id IS NULL THEN
        RAISE EXCEPTION 'El cliente % no tiene carrito activo', p_cliente_id;
    END IF;

    -- Bloquear los libros y validar stock
    FOR v_item IN
        SELECT ic.libro_id, ic.cantidad, l.stock_actual
        FROM item_carrito ic
        JOIN libro l ON l.id = ic.libro_id
        WHERE ic.carrito_id = v_carrito_id
        FOR UPDATE OF l
    LOOP
        IF v_item.stock_actual < v_item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para libro %', v_item.libro_id;
        END IF;
    END LOOP;

    SELECT * INTO v_t FROM calcular_totales_pedido(p_cliente_id, p_tipo_entrega, p_puntos_usados);

    INSERT INTO pedido_linea (cliente_id, direccion_id, tipo_entrega, subtotal,
                              descuento_puntos, costo_envio, total, puntos_usados, puntos_ganados)
    VALUES (p_cliente_id, p_direccion_id, p_tipo_entrega, v_t.subtotal,
            v_t.descuento_puntos, v_t.costo_envio, v_t.total, p_puntos_usados, v_t.puntos_ganados)
    RETURNING id INTO v_pedido_id;

    -- Detalles + stock + vaciar carrito
    FOR v_item IN
        SELECT ic.libro_id, ic.cantidad, l.precio_venta
        FROM item_carrito ic
        JOIN libro l ON l.id = ic.libro_id
        WHERE ic.carrito_id = v_carrito_id
    LOOP
        INSERT INTO detalle_pedido_linea (pedido_linea_id, libro_id, cantidad, precio_unitario, subtotal_linea)
        VALUES (v_pedido_id, v_item.libro_id, v_item.cantidad,
                v_item.precio_venta, v_item.cantidad * v_item.precio_venta);

        UPDATE libro SET stock_actual = stock_actual - v_item.cantidad WHERE id = v_item.libro_id;
    END LOOP;

    DELETE FROM item_carrito WHERE carrito_id = v_carrito_id;

    IF p_puntos_usados > 0 THEN
        INSERT INTO transaccion_puntos (cliente_id, tipo, puntos, canal, pedido_linea_id, concepto)
        VALUES (p_cliente_id, 'canjeado', p_puntos_usados, 'online', v_pedido_id, 'Canje en pedido online');
    END IF;
    IF v_t.puntos_ganados > 0 THEN
        INSERT INTO transaccion_puntos (cliente_id, tipo, puntos, canal, pedido_linea_id, concepto)
        VALUES (p_cliente_id, 'ganado', v_t.puntos_ganados, 'online', v_pedido_id, 'Compra en línea');
    END IF;

    -- puntos_saldo lo sincroniza el trigger trg_transaccion_puntos_sync.
    RETURN v_pedido_id;
END;
$$;
