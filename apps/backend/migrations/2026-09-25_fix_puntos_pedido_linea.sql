-- Corrige el doble conteo de puntos en pedidos online: el trigger sobre
-- transaccion_puntos ya recalcula puntos_saldo, el UPDATE manual lo sumaba otra vez.

CREATE OR REPLACE FUNCTION public.confirmar_pedido_linea(p_cliente_id uuid, p_direccion_id uuid, p_tipo_entrega character varying, p_puntos_usados integer)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_pedido_id      UUID;
    v_carrito_id     UUID;
    v_subtotal       NUMERIC(10,2) := 0;
    v_descuento      NUMERIC(10,2) := 0;
    v_costo_envio    NUMERIC(10,2) := 0;
    v_total          NUMERIC(10,2);
    v_puntos_ganados INT := 0;
    v_tasa_acum      INT;
    v_envio_default  NUMERIC(10,2);
    v_envio_gratis   NUMERIC(10,2);
    v_item           RECORD;
    v_stock          INT;
BEGIN
    SELECT valor::INT      INTO v_tasa_acum     FROM configuracion WHERE clave = 'tasa_puntos_acumulacion';
    SELECT valor::NUMERIC  INTO v_envio_default  FROM configuracion WHERE clave = 'costo_envio_default';
    SELECT valor::NUMERIC  INTO v_envio_gratis   FROM configuracion WHERE clave = 'envio_gratis_desde';

    -- Obtener carrito
    SELECT id INTO v_carrito_id FROM carrito WHERE cliente_id = p_cliente_id;
    IF v_carrito_id IS NULL THEN
        RAISE EXCEPTION 'El cliente % no tiene carrito activo', p_cliente_id;
    END IF;

    -- Validar stock y calcular subtotal
    FOR v_item IN
        SELECT ic.libro_id, ic.cantidad, l.precio_venta, l.stock_actual
        FROM item_carrito ic
        JOIN libro l ON l.id = ic.libro_id
        WHERE ic.carrito_id = v_carrito_id
        FOR UPDATE OF l
    LOOP
        IF v_item.stock_actual < v_item.cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para libro %', v_item.libro_id;
        END IF;
        v_subtotal := v_subtotal + (v_item.cantidad * v_item.precio_venta);
    END LOOP;

    -- Descuento puntos y costo de envío
    IF p_puntos_usados > 0 THEN
        v_descuento := p_puntos_usados * 1.0;
    END IF;

    IF p_tipo_entrega = 'envio_a_domicilio' THEN
        v_costo_envio := CASE WHEN v_subtotal >= v_envio_gratis THEN 0 ELSE v_envio_default END;
    END IF;

    v_total          := GREATEST(v_subtotal - v_descuento, 0) + v_costo_envio;
    v_puntos_ganados := FLOOR(GREATEST(v_subtotal - v_descuento, 0) / v_tasa_acum);

    -- INSERT pedido_linea
    INSERT INTO pedido_linea (cliente_id, direccion_id, tipo_entrega, subtotal,
                              descuento_puntos, costo_envio, total, puntos_usados, puntos_ganados)
    VALUES (p_cliente_id, p_direccion_id, p_tipo_entrega, v_subtotal,
            v_descuento, v_costo_envio, v_total, p_puntos_usados, v_puntos_ganados)
    RETURNING id INTO v_pedido_id;

    -- INSERT detalles + UPDATE stock + vaciar carrito
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

    -- Vaciar carrito
    DELETE FROM item_carrito WHERE carrito_id = v_carrito_id;

    -- Puntos
    IF p_puntos_usados > 0 THEN
        INSERT INTO transaccion_puntos (cliente_id, tipo, puntos, canal, pedido_linea_id, concepto)
        VALUES (p_cliente_id, 'canjeado', p_puntos_usados, 'online', v_pedido_id, 'Canje en pedido online');
    END IF;
    IF v_puntos_ganados > 0 THEN
        INSERT INTO transaccion_puntos (cliente_id, tipo, puntos, canal, pedido_linea_id, concepto)
        VALUES (p_cliente_id, 'ganado', v_puntos_ganados, 'online', v_pedido_id, 'Compra en línea');
    END IF;

    -- puntos_saldo lo sincroniza el trigger trg_transaccion_puntos_sync (un UPDATE manual lo duplicaba).

    RETURN v_pedido_id;
END;
$function$;
