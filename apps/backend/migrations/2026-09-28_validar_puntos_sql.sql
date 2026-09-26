-- #71: los puntos se validan también en SQL (saldo suficiente y no mayor al valor de la
-- venta/pedido), para que ninguna vía que llame a estas funciones pueda canjear de más.
-- Los mensajes se propagan como errores 400 desde NestJS.

CREATE OR REPLACE FUNCTION public.confirmar_venta_pos(p_cliente_id uuid, p_empleado_id uuid, p_medio_pago character varying, p_puntos_usados integer, p_items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$

DECLARE
    v_tasa_canje     NUMERIC := 1;

    v_venta_id        UUID;

    v_subtotal        NUMERIC(10,2) := 0;

    v_descuento       NUMERIC(10,2) := 0;

    v_total           NUMERIC(10,2);

    v_puntos_ganados  INT := 0;

    v_tasa_acum       INT;

    v_item            JSONB;

    v_libro_id        UUID;

    v_cantidad        INT;

    v_precio          NUMERIC(10,2);

    v_linea           NUMERIC(10,2);

    v_stock           INT;

    v_saldo           INT;
BEGIN
    v_tasa_canje := COALESCE((SELECT valor::NUMERIC FROM configuracion WHERE clave = 'tasa_puntos_canje'), 1);

    SELECT valor::INT INTO v_tasa_acum

    FROM configuracion WHERE clave = 'tasa_puntos_acumulacion';



    -- Paso 1: validar stock y acumular subtotal

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)

    LOOP

        v_libro_id := (v_item->>'libro_id')::UUID;

        v_cantidad := (v_item->>'cantidad')::INT;

        v_precio   := (v_item->>'precio_unitario')::NUMERIC;



        SELECT stock_actual INTO v_stock

        FROM libro WHERE id = v_libro_id FOR UPDATE;



        IF v_stock < v_cantidad THEN

            RAISE EXCEPTION 'Stock insuficiente para libro %', v_libro_id;

        END IF;



        v_subtotal := v_subtotal + (v_cantidad * v_precio);

    END LOOP;



    -- Validar los puntos: no pueden exceder el saldo ni el valor de la venta (#71).
    IF p_puntos_usados < 0 THEN
        RAISE EXCEPTION 'Los puntos a usar no pueden ser negativos';
    END IF;
    IF p_puntos_usados > 0 AND p_cliente_id IS NOT NULL THEN
        SELECT puntos_saldo INTO v_saldo FROM cliente WHERE id = p_cliente_id FOR UPDATE;
        IF v_saldo IS NULL THEN
            RAISE EXCEPTION 'El cliente % no existe', p_cliente_id;
        END IF;
        IF p_puntos_usados > v_saldo THEN
            RAISE EXCEPTION 'El cliente no tiene suficientes puntos (tiene %, intentas usar %)', v_saldo, p_puntos_usados;
        END IF;
        IF p_puntos_usados * v_tasa_canje > v_subtotal THEN
            RAISE EXCEPTION 'Se están usando más puntos de los necesarios para esta venta';
        END IF;
    END IF;

    -- Paso 2: descuento y totales

    IF p_puntos_usados > 0 AND p_cliente_id IS NOT NULL THEN

        v_descuento := p_puntos_usados * v_tasa_canje;

    END IF;



    v_total          := GREATEST(v_subtotal - v_descuento, 0);

    v_puntos_ganados := FLOOR(v_total / v_tasa_acum);



    -- Paso 3: INSERT venta

    INSERT INTO venta (

        cliente_id, empleado_id, subtotal, descuento_puntos,

        total, medio_pago, puntos_usados, puntos_ganados

    )

    VALUES (

        p_cliente_id, p_empleado_id, v_subtotal, v_descuento,

        v_total, p_medio_pago, p_puntos_usados, v_puntos_ganados

    )

    RETURNING id INTO v_venta_id;



    -- Paso 4: detalles + stock

    FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)

    LOOP

        v_libro_id := (v_item->>'libro_id')::UUID;

        v_cantidad := (v_item->>'cantidad')::INT;

        v_precio   := (v_item->>'precio_unitario')::NUMERIC;

        v_linea    := v_cantidad * v_precio;



        INSERT INTO detalle_venta

            (venta_id, libro_id, cantidad, precio_unitario, subtotal_linea)

        VALUES (v_venta_id, v_libro_id, v_cantidad, v_precio, v_linea);



        UPDATE libro

        SET stock_actual = stock_actual - v_cantidad

        WHERE id = v_libro_id;

    END LOOP;



    -- Paso 5: puntos

    IF p_cliente_id IS NOT NULL THEN

        IF p_puntos_usados > 0 THEN

            INSERT INTO transaccion_puntos

                (cliente_id, tipo, puntos, canal, venta_id, concepto)

            VALUES (p_cliente_id, 'canjeado', p_puntos_usados, 'pos',

                    v_venta_id, 'Canje en venta POS');

        END IF;

        IF v_puntos_ganados > 0 THEN

            INSERT INTO transaccion_puntos

                (cliente_id, tipo, puntos, canal, venta_id, concepto)

            VALUES (p_cliente_id, 'ganado', v_puntos_ganados, 'pos',

                    v_venta_id, 'Compra en tienda física');

        END IF;

    END IF;



    RETURN v_venta_id;

END;

$function$;

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
    v_saldo          INT;
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

    -- Validar los puntos: no pueden exceder el saldo ni el valor del pedido (#71).
    IF p_puntos_usados < 0 THEN
        RAISE EXCEPTION 'Los puntos a usar no pueden ser negativos';
    END IF;
    IF p_puntos_usados > 0 THEN
        SELECT puntos_saldo INTO v_saldo FROM cliente WHERE id = p_cliente_id FOR UPDATE;
        IF v_saldo IS NULL OR p_puntos_usados > v_saldo THEN
            RAISE EXCEPTION 'El cliente no tiene suficientes puntos (tiene %, intentas usar %)', COALESCE(v_saldo, 0), p_puntos_usados;
        END IF;
        IF v_t.descuento_puntos > v_t.subtotal THEN
            RAISE EXCEPTION 'Se están usando más puntos de los necesarios para este pedido';
        END IF;
    END IF;

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
