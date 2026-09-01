-- Libreria

--
-- PostgreSQL database dump
--

\restrict Ue4lMleVJEXhtjbttpfb0euTvvRgQObUl2HUCQgcEEcNw6cAHv72PdlbQH6rDM5

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cancelar_venta(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cancelar_venta(p_venta_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_venta       venta%ROWTYPE;
    v_libro_id    UUID;
    v_cantidad    INT;
BEGIN
    SELECT * INTO v_venta FROM venta WHERE id = p_venta_id FOR UPDATE;

    IF v_venta.id IS NULL THEN
        RAISE EXCEPTION 'Venta % no existe', p_venta_id;
    END IF;
    IF v_venta.estado = 'cancelada' THEN
        RAISE EXCEPTION 'La venta % ya está cancelada', p_venta_id;
    END IF;

    -- Bucle corregido: solo las columnas necesarias
    FOR v_libro_id, v_cantidad IN
        SELECT libro_id, cantidad FROM detalle_venta WHERE venta_id = p_venta_id
    LOOP
        UPDATE libro
        SET stock_actual = stock_actual + v_cantidad
        WHERE id = v_libro_id;
    END LOOP;

    IF v_venta.cliente_id IS NOT NULL THEN
        DELETE FROM transaccion_puntos WHERE venta_id = p_venta_id;
        UPDATE cliente
        SET puntos_saldo = (
            SELECT COALESCE(
                SUM(CASE WHEN tipo = 'ganado' THEN puntos ELSE -puntos END), 0
            )
            FROM transaccion_puntos
            WHERE cliente_id = v_venta.cliente_id
        )
        WHERE id = v_venta.cliente_id;
    END IF;

    UPDATE venta SET estado = 'cancelada' WHERE id = p_venta_id;
END;
$$;


ALTER FUNCTION public.cancelar_venta(p_venta_id uuid) OWNER TO postgres;

--
-- Name: confirmar_pedido_linea(uuid, uuid, character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.confirmar_pedido_linea(p_cliente_id uuid, p_direccion_id uuid, p_tipo_entrega character varying, p_puntos_usados integer) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
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

    UPDATE cliente
    SET puntos_saldo = puntos_saldo - p_puntos_usados + v_puntos_ganados
    WHERE id = p_cliente_id;

    RETURN v_pedido_id;
END;
$$;


ALTER FUNCTION public.confirmar_pedido_linea(p_cliente_id uuid, p_direccion_id uuid, p_tipo_entrega character varying, p_puntos_usados integer) OWNER TO postgres;

--
-- Name: confirmar_venta_pos(uuid, uuid, character varying, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.confirmar_venta_pos(p_cliente_id uuid, p_empleado_id uuid, p_medio_pago character varying, p_puntos_usados integer, p_items jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
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
BEGIN
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

    -- Paso 2: descuento y totales
    IF p_puntos_usados > 0 AND p_cliente_id IS NOT NULL THEN
        v_descuento := p_puntos_usados * 1.0;
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
$$;


ALTER FUNCTION public.confirmar_venta_pos(p_cliente_id uuid, p_empleado_id uuid, p_medio_pago character varying, p_puntos_usados integer, p_items jsonb) OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: sync_puntos_saldo(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_puntos_saldo() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_cliente_id UUID;
BEGIN
    -- Determina el cliente afectado según la operación
    v_cliente_id := COALESCE(NEW.cliente_id, OLD.cliente_id);

    UPDATE cliente
    SET puntos_saldo = (
        SELECT COALESCE(
            SUM(CASE WHEN tipo = 'ganado' THEN puntos ELSE -puntos END),
            0
        )
        FROM transaccion_puntos
        WHERE cliente_id = v_cliente_id
    )
    WHERE id = v_cliente_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.sync_puntos_saldo() OWNER TO postgres;

--
-- Name: trg_fn_carrito_touch(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_fn_carrito_touch() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE carrito SET actualizado_en = NOW()
    WHERE id = COALESCE(NEW.carrito_id, OLD.carrito_id);
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.trg_fn_carrito_touch() OWNER TO postgres;

--
-- Name: trg_fn_recepcion_compra(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trg_fn_recepcion_compra() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_incremento INT;
BEGIN
    -- Solo actúa cuando se recibe unidades nuevas
    IF NEW.cantidad_recibida > OLD.cantidad_recibida THEN
        v_incremento := NEW.cantidad_recibida - OLD.cantidad_recibida;
        UPDATE libro
        SET stock_actual = stock_actual + v_incremento
        WHERE id = NEW.libro_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trg_fn_recepcion_compra() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: editorial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.editorial (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    pais character varying(80),
    sitio_web character varying(200),
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.editorial OWNER TO postgres;

--
-- Name: TABLE editorial; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.editorial IS 'Catálogo de editoriales de los libros';


--
-- Name: libro; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.libro (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    isbn character varying(20) NOT NULL,
    titulo character varying(255) NOT NULL,
    editorial_id uuid,
    categoria_id uuid,
    precio_venta numeric(10,2) NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    stock_actual integer DEFAULT 0 NOT NULL,
    stock_minimo integer DEFAULT 5 NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    imagen_key character varying(500),
    CONSTRAINT libro_precio_costo_check CHECK ((precio_costo >= (0)::numeric)),
    CONSTRAINT libro_precio_venta_check CHECK ((precio_venta >= (0)::numeric)),
    CONSTRAINT libro_stock_actual_check CHECK ((stock_actual >= 0))
);


ALTER TABLE public.libro OWNER TO postgres;

--
-- Name: TABLE libro; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.libro IS 'Catálogo central de productos — referenciado por todos los módulos';


--
-- Name: COLUMN libro.stock_minimo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.libro.stock_minimo IS 'Umbral de alerta. Aparece en la vista alerta_stock_bajo cuando stock_actual lo alcanza';


--
-- Name: COLUMN libro.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.libro.updated_at IS 'Actualizado automáticamente por trg_libro_updated_at';


--
-- Name: COLUMN libro.imagen_key; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.libro.imagen_key IS 'Ruta relativa del archivo de portada (ej. portadas/uuid.jpg). NULL si el libro no tiene portada.';


--
-- Name: alerta_stock_bajo; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.alerta_stock_bajo AS
 SELECT l.id,
    l.isbn,
    l.titulo,
    e.nombre AS editorial,
    l.stock_actual,
    l.stock_minimo,
    (l.stock_minimo - l.stock_actual) AS unidades_faltantes
   FROM (public.libro l
     LEFT JOIN public.editorial e ON ((e.id = l.editorial_id)))
  WHERE ((l.stock_actual <= l.stock_minimo) AND (l.activo = true))
  ORDER BY (l.stock_minimo - l.stock_actual) DESC;


ALTER VIEW public.alerta_stock_bajo OWNER TO postgres;

--
-- Name: autor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.autor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    nacionalidad character varying(80),
    biografia text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.autor OWNER TO postgres;

--
-- Name: TABLE autor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.autor IS 'Catálogo de autores';


--
-- Name: carrito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.carrito OWNER TO postgres;

--
-- Name: TABLE carrito; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.carrito IS 'Estado temporal del carrito antes de confirmar. Un cliente, un carrito activo';


--
-- Name: categoria; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true NOT NULL
);


ALTER TABLE public.categoria OWNER TO postgres;

--
-- Name: TABLE categoria; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.categoria IS 'Clasificación por género o tema de los libros';


--
-- Name: cliente; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cliente (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    telefono character varying(20) NOT NULL,
    nombre character varying(120),
    email character varying(150),
    password_hash character varying(255),
    cuenta_activa boolean DEFAULT false NOT NULL,
    puntos_saldo integer DEFAULT 0 NOT NULL,
    fecha_registro timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT cliente_puntos_saldo_check CHECK ((puntos_saldo >= 0))
);


ALTER TABLE public.cliente OWNER TO postgres;

--
-- Name: TABLE cliente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cliente IS 'Clientes del sistema. Teléfono es el identificador universal en tienda y online';


--
-- Name: COLUMN cliente.telefono; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cliente.telefono IS 'Identificador universal único. Se usa en tienda física y como login online';


--
-- Name: COLUMN cliente.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cliente.password_hash IS 'NULL si el cliente solo compra en tienda. Se llena al activar cuenta online';


--
-- Name: COLUMN cliente.cuenta_activa; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cliente.cuenta_activa IS 'TRUE cuando el cliente activó acceso a la plataforma online';


--
-- Name: COLUMN cliente.puntos_saldo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cliente.puntos_saldo IS 'Saldo rápido de puntos. Sincronizado automáticamente por trg_transaccion_puntos_sync';


--
-- Name: configuracion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion (
    clave character varying(80) NOT NULL,
    valor text NOT NULL,
    descripcion character varying(255),
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tipo_dato character varying(20) DEFAULT 'text'::character varying NOT NULL,
    CONSTRAINT configuracion_tipo_dato_check CHECK (((tipo_dato)::text = ANY ((ARRAY['integer'::character varying, 'numeric'::character varying, 'text'::character varying, 'boolean'::character varying])::text[])))
);


ALTER TABLE public.configuracion OWNER TO postgres;

--
-- Name: TABLE configuracion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.configuracion IS 'Parámetros del sistema editables sin tocar código. Las funciones POS y pedidos los leen en tiempo de ejecución';


--
-- Name: COLUMN configuracion.tipo_dato; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.configuracion.tipo_dato IS 'Tipo esperado del valor: integer, numeric, text, boolean';


--
-- Name: detalle_pedido_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedido_compra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_compra_id uuid NOT NULL,
    libro_id uuid NOT NULL,
    cantidad_solicitada integer NOT NULL,
    cantidad_recibida integer DEFAULT 0 NOT NULL,
    precio_costo numeric(10,2) NOT NULL,
    subtotal_linea numeric(10,2) NOT NULL,
    CONSTRAINT detalle_pedido_compra_cantidad_recibida_check CHECK ((cantidad_recibida >= 0)),
    CONSTRAINT detalle_pedido_compra_cantidad_solicitada_check CHECK ((cantidad_solicitada > 0)),
    CONSTRAINT detalle_pedido_compra_precio_costo_check CHECK ((precio_costo >= (0)::numeric)),
    CONSTRAINT detalle_pedido_compra_subtotal_linea_check CHECK ((subtotal_linea >= (0)::numeric))
);


ALTER TABLE public.detalle_pedido_compra OWNER TO postgres;

--
-- Name: TABLE detalle_pedido_compra; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_pedido_compra IS 'Líneas de cada orden. cantidad_recibida actualiza stock vía trg_recepcion_compra';


--
-- Name: COLUMN detalle_pedido_compra.cantidad_recibida; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.detalle_pedido_compra.cantidad_recibida IS 'Soporta entregas parciales. Cada incremento dispara trg_recepcion_compra y suma al stock';


--
-- Name: detalle_pedido_linea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_pedido_linea (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pedido_linea_id uuid NOT NULL,
    libro_id uuid NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal_linea numeric(10,2) NOT NULL,
    CONSTRAINT detalle_pedido_linea_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT detalle_pedido_linea_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric)),
    CONSTRAINT detalle_pedido_linea_subtotal_linea_check CHECK ((subtotal_linea >= (0)::numeric))
);


ALTER TABLE public.detalle_pedido_linea OWNER TO postgres;

--
-- Name: TABLE detalle_pedido_linea; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_pedido_linea IS 'Líneas de cada pedido online. Inmutable por auditoría — ON DELETE RESTRICT';


--
-- Name: detalle_venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.detalle_venta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    venta_id uuid NOT NULL,
    libro_id uuid NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal_linea numeric(10,2) NOT NULL,
    CONSTRAINT detalle_venta_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT detalle_venta_precio_unitario_check CHECK ((precio_unitario >= (0)::numeric)),
    CONSTRAINT detalle_venta_subtotal_linea_check CHECK ((subtotal_linea >= (0)::numeric))
);


ALTER TABLE public.detalle_venta OWNER TO postgres;

--
-- Name: TABLE detalle_venta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.detalle_venta IS 'Líneas de cada venta. Inmutable por auditoría — ON DELETE RESTRICT';


--
-- Name: COLUMN detalle_venta.precio_unitario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.detalle_venta.precio_unitario IS 'Snapshot del precio al momento de la venta. No cambia si el libro se actualiza después';


--
-- Name: direccion_entrega; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.direccion_entrega (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    alias character varying(60) DEFAULT 'Casa'::character varying NOT NULL,
    calle character varying(200) NOT NULL,
    colonia character varying(120),
    ciudad character varying(100) NOT NULL,
    estado character varying(100) NOT NULL,
    codigo_postal character varying(10) NOT NULL,
    referencias text,
    es_principal boolean DEFAULT false NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.direccion_entrega OWNER TO postgres;

--
-- Name: TABLE direccion_entrega; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.direccion_entrega IS 'Direcciones guardadas por clientes para envíos de pedidos online';


--
-- Name: empleado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empleado (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(120) NOT NULL,
    rol character varying(30) NOT NULL,
    usuario character varying(60) NOT NULL,
    password_hash character varying(255) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    fecha_alta timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT empleado_rol_check CHECK (((rol)::text = ANY ((ARRAY['cajero'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.empleado OWNER TO postgres;

--
-- Name: TABLE empleado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.empleado IS 'Usuarios internos del sistema: cajeros y administradores';


--
-- Name: item_carrito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_carrito (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    carrito_id uuid NOT NULL,
    libro_id uuid NOT NULL,
    cantidad integer NOT NULL,
    CONSTRAINT item_carrito_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.item_carrito OWNER TO postgres;

--
-- Name: TABLE item_carrito; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.item_carrito IS 'Libros en el carrito. UNIQUE(carrito_id, libro_id) — se actualiza la cantidad si se repite';


--
-- Name: libro_autor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.libro_autor (
    libro_id uuid NOT NULL,
    autor_id uuid NOT NULL,
    rol character varying(50) DEFAULT 'autor'::character varying NOT NULL,
    CONSTRAINT libro_autor_rol_check CHECK (((rol)::text = ANY ((ARRAY['autor'::character varying, 'coautor'::character varying, 'editor'::character varying, 'traductor'::character varying, 'ilustrador'::character varying])::text[])))
);


ALTER TABLE public.libro_autor OWNER TO postgres;

--
-- Name: TABLE libro_autor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.libro_autor IS 'Relación muchos-a-muchos entre libros y autores con rol';


--
-- Name: venta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.venta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid,
    empleado_id uuid NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento_puntos numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    medio_pago character varying(20) NOT NULL,
    puntos_usados integer DEFAULT 0 NOT NULL,
    puntos_ganados integer DEFAULT 0 NOT NULL,
    estado character varying(20) DEFAULT 'completada'::character varying NOT NULL,
    CONSTRAINT venta_descuento_puntos_check CHECK ((descuento_puntos >= (0)::numeric)),
    CONSTRAINT venta_estado_check CHECK (((estado)::text = ANY ((ARRAY['completada'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT venta_medio_pago_check CHECK (((medio_pago)::text = ANY ((ARRAY['efectivo'::character varying, 'tarjeta'::character varying])::text[]))),
    CONSTRAINT venta_puntos_ganados_check CHECK ((puntos_ganados >= 0)),
    CONSTRAINT venta_puntos_usados_check CHECK ((puntos_usados >= 0)),
    CONSTRAINT venta_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT venta_total_check CHECK ((total >= (0)::numeric))
);


ALTER TABLE public.venta OWNER TO postgres;

--
-- Name: TABLE venta; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.venta IS 'Transacciones realizadas en el punto de venta físico';


--
-- Name: COLUMN venta.cliente_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.venta.cliente_id IS 'NULL si la venta es anónima — cliente no identificado';


--
-- Name: COLUMN venta.descuento_puntos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.venta.descuento_puntos IS 'Monto en MXN descontado por canje de puntos de lealtad';


--
-- Name: libros_mas_vendidos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.libros_mas_vendidos AS
 SELECT l.id,
    l.isbn,
    l.titulo,
    sum(dv.cantidad) AS unidades_vendidas,
    sum(dv.subtotal_linea) AS ingresos_generados,
    count(DISTINCT dv.venta_id) AS aparece_en_ventas
   FROM ((public.detalle_venta dv
     JOIN public.libro l ON ((l.id = dv.libro_id)))
     JOIN public.venta v ON (((v.id = dv.venta_id) AND ((v.estado)::text = 'completada'::text))))
  GROUP BY l.id, l.isbn, l.titulo
  ORDER BY (sum(dv.cantidad)) DESC;


ALTER VIEW public.libros_mas_vendidos OWNER TO postgres;

--
-- Name: log_acceso; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.log_acceso (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid,
    empleado_id uuid,
    evento character varying(40) NOT NULL,
    ip character varying(45),
    user_agent text,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT log_acceso_evento_check CHECK (((evento)::text = ANY ((ARRAY['login_ok'::character varying, 'login_fallido'::character varying, 'logout'::character varying, 'cambio_password'::character varying])::text[])))
);


ALTER TABLE public.log_acceso OWNER TO postgres;

--
-- Name: TABLE log_acceso; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.log_acceso IS 'Auditoría de todos los accesos: login_ok, login_fallido, logout, cambio_password';


--
-- Name: movimiento_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimiento_inventario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    libro_id uuid NOT NULL,
    empleado_id uuid NOT NULL,
    tipo character varying(20) NOT NULL,
    cantidad integer NOT NULL,
    stock_anterior integer NOT NULL,
    stock_nuevo integer NOT NULL,
    motivo character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT movimiento_inventario_cantidad_check CHECK ((cantidad <> 0)),
    CONSTRAINT movimiento_inventario_stock_check CHECK ((stock_nuevo = (stock_anterior + cantidad))),
    CONSTRAINT movimiento_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying, 'ajuste'::character varying])::text[])))
);


ALTER TABLE public.movimiento_inventario OWNER TO postgres;

--
-- Name: TABLE movimiento_inventario; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.movimiento_inventario IS 'Historial de ajustes manuales de stock (entradas, salidas, correcciones) realizados por un empleado';


--
-- Name: COLUMN movimiento_inventario.tipo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimiento_inventario.tipo IS 'entrada: suma stock | salida: resta stock | ajuste: correccion manual tras conteo fisico';


--
-- Name: COLUMN movimiento_inventario.cantidad; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimiento_inventario.cantidad IS 'Delta con signo aplicado a libro.stock_actual: positivo en entrada/ajuste hacia arriba, negativo en salida/ajuste hacia abajo';


--
-- Name: COLUMN movimiento_inventario.stock_anterior; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimiento_inventario.stock_anterior IS 'Snapshot de libro.stock_actual antes del movimiento';


--
-- Name: COLUMN movimiento_inventario.stock_nuevo; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.movimiento_inventario.stock_nuevo IS 'Snapshot de libro.stock_actual despues del movimiento';


--
-- Name: pedido_compra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido_compra (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    proveedor_id uuid NOT NULL,
    empleado_id uuid NOT NULL,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    total numeric(10,2) DEFAULT 0 NOT NULL,
    notas text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pedido_compra_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'enviado'::character varying, 'recibido_parcial'::character varying, 'recibido'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedido_compra_total_check CHECK ((total >= (0)::numeric))
);


ALTER TABLE public.pedido_compra OWNER TO postgres;

--
-- Name: TABLE pedido_compra; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pedido_compra IS 'Órdenes de compra enviadas a proveedores';


--
-- Name: pedido_linea; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedido_linea (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    direccion_id uuid,
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    estado character varying(30) DEFAULT 'recibido'::character varying NOT NULL,
    tipo_entrega character varying(20) DEFAULT 'recoger_en_tienda'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    descuento_puntos numeric(10,2) DEFAULT 0 NOT NULL,
    costo_envio numeric(10,2) DEFAULT 0 NOT NULL,
    total numeric(10,2) NOT NULL,
    puntos_usados integer DEFAULT 0 NOT NULL,
    puntos_ganados integer DEFAULT 0 NOT NULL,
    notas text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT pedido_linea_costo_envio_check CHECK ((costo_envio >= (0)::numeric)),
    CONSTRAINT pedido_linea_descuento_puntos_check CHECK ((descuento_puntos >= (0)::numeric)),
    CONSTRAINT pedido_linea_estado_check CHECK (((estado)::text = ANY ((ARRAY['recibido'::character varying, 'en_preparacion'::character varying, 'listo'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedido_linea_puntos_ganados_check CHECK ((puntos_ganados >= 0)),
    CONSTRAINT pedido_linea_puntos_usados_check CHECK ((puntos_usados >= 0)),
    CONSTRAINT pedido_linea_subtotal_check CHECK ((subtotal >= (0)::numeric)),
    CONSTRAINT pedido_linea_tipo_entrega_check CHECK (((tipo_entrega)::text = ANY ((ARRAY['recoger_en_tienda'::character varying, 'envio_a_domicilio'::character varying])::text[]))),
    CONSTRAINT pedido_linea_total_check CHECK ((total >= (0)::numeric))
);


ALTER TABLE public.pedido_linea OWNER TO postgres;

--
-- Name: TABLE pedido_linea; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pedido_linea IS 'Pedidos confirmados desde la plataforma online. Equivalente de venta para ese canal';


--
-- Name: COLUMN pedido_linea.estado; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pedido_linea.estado IS 'Flujo: recibido → en_preparacion → listo → enviado → entregado / cancelado';


--
-- Name: COLUMN pedido_linea.costo_envio; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pedido_linea.costo_envio IS '0 si es recoger_en_tienda o si el subtotal supera envio_gratis_desde en configuracion';


--
-- Name: proveedor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(150) NOT NULL,
    contacto_nombre character varying(120),
    email character varying(150),
    telefono character varying(20),
    condiciones_comerciales text,
    activo boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.proveedor OWNER TO postgres;

--
-- Name: TABLE proveedor; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.proveedor IS 'Catálogo de proveedores de libros';


--
-- Name: rendimiento_empleados; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.rendimiento_empleados AS
 SELECT e.id,
    e.nombre,
    e.rol,
    count(v.id) AS total_ventas,
    sum(v.total) AS monto_total,
    min(v.fecha) AS primera_venta,
    max(v.fecha) AS ultima_venta
   FROM (public.empleado e
     LEFT JOIN public.venta v ON (((v.empleado_id = e.id) AND ((v.estado)::text = 'completada'::text))))
  GROUP BY e.id, e.nombre, e.rol
  ORDER BY (sum(v.total)) DESC NULLS LAST;


ALTER VIEW public.rendimiento_empleados OWNER TO postgres;

--
-- Name: sesion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesion (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid,
    empleado_id uuid,
    token_hash character varying(255) NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT sesion_check CHECK ((((cliente_id IS NOT NULL) AND (empleado_id IS NULL)) OR ((cliente_id IS NULL) AND (empleado_id IS NOT NULL))))
);


ALTER TABLE public.sesion OWNER TO postgres;

--
-- Name: TABLE sesion; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sesion IS 'Tokens activos. Al hacer logout se borra la fila — invalidación real del JWT';


--
-- Name: COLUMN sesion.token_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sesion.token_hash IS 'SHA-256 del JWT. Nunca se guarda el token completo en BD';


--
-- Name: transaccion_puntos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transaccion_puntos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cliente_id uuid NOT NULL,
    tipo character varying(10) NOT NULL,
    puntos integer NOT NULL,
    canal character varying(10) NOT NULL,
    venta_id uuid,
    pedido_linea_id uuid,
    concepto character varying(200),
    fecha timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT transaccion_puntos_canal_check CHECK (((canal)::text = ANY ((ARRAY['pos'::character varying, 'online'::character varying])::text[]))),
    CONSTRAINT transaccion_puntos_puntos_check CHECK ((puntos > 0)),
    CONSTRAINT transaccion_puntos_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['ganado'::character varying, 'canjeado'::character varying])::text[])))
);


ALTER TABLE public.transaccion_puntos OWNER TO postgres;

--
-- Name: TABLE transaccion_puntos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.transaccion_puntos IS 'Historial inmutable de puntos. Fuente de verdad — ON DELETE RESTRICT. Sincroniza puntos_saldo vía trg_transaccion_puntos_sync';


--
-- Name: COLUMN transaccion_puntos.canal; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.transaccion_puntos.canal IS 'pos = venta en tienda física, online = pedido desde la plataforma web';


--
-- Name: ventas_por_dia; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ventas_por_dia AS
 SELECT date(fecha) AS dia,
    count(id) AS total_ventas,
    sum(total) AS ingresos,
    sum(descuento_puntos) AS descuentos_puntos,
    count(
        CASE
            WHEN (cliente_id IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS ventas_con_cliente,
    count(
        CASE
            WHEN ((medio_pago)::text = 'efectivo'::text) THEN 1
            ELSE NULL::integer
        END) AS pagos_efectivo,
    count(
        CASE
            WHEN ((medio_pago)::text = 'tarjeta'::text) THEN 1
            ELSE NULL::integer
        END) AS pagos_tarjeta
   FROM public.venta v
  WHERE ((estado)::text = 'completada'::text)
  GROUP BY (date(fecha))
  ORDER BY (date(fecha)) DESC;


ALTER VIEW public.ventas_por_dia OWNER TO postgres;

--
-- Name: autor autor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.autor
    ADD CONSTRAINT autor_pkey PRIMARY KEY (id);


--
-- Name: carrito carrito_cliente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT carrito_cliente_id_key UNIQUE (cliente_id);


--
-- Name: carrito carrito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT carrito_pkey PRIMARY KEY (id);


--
-- Name: categoria categoria_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_nombre_key UNIQUE (nombre);


--
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id);


--
-- Name: cliente cliente_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_email_key UNIQUE (email);


--
-- Name: cliente cliente_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_pkey PRIMARY KEY (id);


--
-- Name: cliente cliente_telefono_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cliente
    ADD CONSTRAINT cliente_telefono_key UNIQUE (telefono);


--
-- Name: configuracion configuracion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion
    ADD CONSTRAINT configuracion_pkey PRIMARY KEY (clave);


--
-- Name: detalle_pedido_compra detalle_pedido_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_compra
    ADD CONSTRAINT detalle_pedido_compra_pkey PRIMARY KEY (id);


--
-- Name: detalle_pedido_linea detalle_pedido_linea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_linea
    ADD CONSTRAINT detalle_pedido_linea_pkey PRIMARY KEY (id);


--
-- Name: detalle_venta detalle_venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_pkey PRIMARY KEY (id);


--
-- Name: direccion_entrega direccion_entrega_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion_entrega
    ADD CONSTRAINT direccion_entrega_pkey PRIMARY KEY (id);


--
-- Name: editorial editorial_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.editorial
    ADD CONSTRAINT editorial_nombre_key UNIQUE (nombre);


--
-- Name: editorial editorial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.editorial
    ADD CONSTRAINT editorial_pkey PRIMARY KEY (id);


--
-- Name: empleado empleado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT empleado_pkey PRIMARY KEY (id);


--
-- Name: empleado empleado_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empleado
    ADD CONSTRAINT empleado_usuario_key UNIQUE (usuario);


--
-- Name: item_carrito item_carrito_carrito_id_libro_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_carrito
    ADD CONSTRAINT item_carrito_carrito_id_libro_id_key UNIQUE (carrito_id, libro_id);


--
-- Name: item_carrito item_carrito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_carrito
    ADD CONSTRAINT item_carrito_pkey PRIMARY KEY (id);


--
-- Name: libro_autor libro_autor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro_autor
    ADD CONSTRAINT libro_autor_pkey PRIMARY KEY (libro_id, autor_id);


--
-- Name: libro libro_isbn_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_isbn_key UNIQUE (isbn);


--
-- Name: libro libro_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_pkey PRIMARY KEY (id);


--
-- Name: log_acceso log_acceso_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acceso
    ADD CONSTRAINT log_acceso_pkey PRIMARY KEY (id);


--
-- Name: movimiento_inventario movimiento_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_pkey PRIMARY KEY (id);


--
-- Name: pedido_compra pedido_compra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_compra
    ADD CONSTRAINT pedido_compra_pkey PRIMARY KEY (id);


--
-- Name: pedido_linea pedido_linea_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_linea
    ADD CONSTRAINT pedido_linea_pkey PRIMARY KEY (id);


--
-- Name: proveedor proveedor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedor
    ADD CONSTRAINT proveedor_pkey PRIMARY KEY (id);


--
-- Name: sesion sesion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_pkey PRIMARY KEY (id);


--
-- Name: sesion sesion_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_token_hash_key UNIQUE (token_hash);


--
-- Name: transaccion_puntos transaccion_puntos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaccion_puntos
    ADD CONSTRAINT transaccion_puntos_pkey PRIMARY KEY (id);


--
-- Name: venta venta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_pkey PRIMARY KEY (id);


--
-- Name: idx_autor_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_autor_nombre ON public.autor USING btree (nombre);


--
-- Name: idx_cliente_telefono; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cliente_telefono ON public.cliente USING btree (telefono);


--
-- Name: idx_det_compra_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_det_compra_libro ON public.detalle_pedido_compra USING btree (libro_id);


--
-- Name: idx_det_compra_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_det_compra_pedido ON public.detalle_pedido_compra USING btree (pedido_compra_id);


--
-- Name: idx_detalle_pedido_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_pedido_libro ON public.detalle_pedido_linea USING btree (libro_id);


--
-- Name: idx_detalle_pedido_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_pedido_pedido ON public.detalle_pedido_linea USING btree (pedido_linea_id);


--
-- Name: idx_detalle_venta_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_venta_libro ON public.detalle_venta USING btree (libro_id);


--
-- Name: idx_detalle_venta_venta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_detalle_venta_venta ON public.detalle_venta USING btree (venta_id);


--
-- Name: idx_dir_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dir_cliente ON public.direccion_entrega USING btree (cliente_id);


--
-- Name: idx_item_carrito_carrito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_item_carrito_carrito ON public.item_carrito USING btree (carrito_id);


--
-- Name: idx_item_carrito_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_item_carrito_libro ON public.item_carrito USING btree (libro_id);


--
-- Name: idx_libro_categoria; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_categoria ON public.libro USING btree (categoria_id);


--
-- Name: idx_libro_editorial; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_editorial ON public.libro USING btree (editorial_id);


--
-- Name: idx_libro_isbn; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_isbn ON public.libro USING btree (isbn);


--
-- Name: idx_libro_titulo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_libro_titulo ON public.libro USING btree (titulo);


--
-- Name: idx_log_acceso_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_acceso_cliente ON public.log_acceso USING btree (cliente_id) WHERE (cliente_id IS NOT NULL);


--
-- Name: idx_log_acceso_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_acceso_empleado ON public.log_acceso USING btree (empleado_id) WHERE (empleado_id IS NOT NULL);


--
-- Name: idx_log_acceso_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_log_acceso_fecha ON public.log_acceso USING btree (fecha);


--
-- Name: idx_movimiento_inventario_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimiento_inventario_fecha ON public.movimiento_inventario USING btree (created_at);


--
-- Name: idx_movimiento_inventario_libro; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_movimiento_inventario_libro ON public.movimiento_inventario USING btree (libro_id);


--
-- Name: idx_pedido_compra_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_compra_empleado ON public.pedido_compra USING btree (empleado_id);


--
-- Name: idx_pedido_compra_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_compra_estado ON public.pedido_compra USING btree (estado);


--
-- Name: idx_pedido_compra_proveedor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_compra_proveedor ON public.pedido_compra USING btree (proveedor_id);


--
-- Name: idx_pedido_linea_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_linea_cliente ON public.pedido_linea USING btree (cliente_id);


--
-- Name: idx_pedido_linea_direccion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_linea_direccion ON public.pedido_linea USING btree (direccion_id) WHERE (direccion_id IS NOT NULL);


--
-- Name: idx_pedido_linea_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_linea_estado ON public.pedido_linea USING btree (estado);


--
-- Name: idx_pedido_linea_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pedido_linea_fecha ON public.pedido_linea USING btree (fecha);


--
-- Name: idx_sesion_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_cliente ON public.sesion USING btree (cliente_id) WHERE (cliente_id IS NOT NULL);


--
-- Name: idx_sesion_empleado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_empleado ON public.sesion USING btree (empleado_id) WHERE (empleado_id IS NOT NULL);


--
-- Name: idx_sesion_expira; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_expira ON public.sesion USING btree (expira_en);


--
-- Name: idx_sesion_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_token ON public.sesion USING btree (token_hash);


--
-- Name: idx_txn_puntos_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_puntos_cliente ON public.transaccion_puntos USING btree (cliente_id);


--
-- Name: idx_txn_puntos_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_puntos_fecha ON public.transaccion_puntos USING btree (fecha);


--
-- Name: idx_txn_puntos_pedido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_puntos_pedido ON public.transaccion_puntos USING btree (pedido_linea_id) WHERE (pedido_linea_id IS NOT NULL);


--
-- Name: idx_txn_puntos_venta; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_txn_puntos_venta ON public.transaccion_puntos USING btree (venta_id) WHERE (venta_id IS NOT NULL);


--
-- Name: idx_venta_cliente_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venta_cliente_id ON public.venta USING btree (cliente_id) WHERE (cliente_id IS NOT NULL);


--
-- Name: idx_venta_empleado_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venta_empleado_id ON public.venta USING btree (empleado_id);


--
-- Name: idx_venta_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venta_estado ON public.venta USING btree (estado);


--
-- Name: idx_venta_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_venta_fecha ON public.venta USING btree (fecha);


--
-- Name: cliente trg_cliente_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_cliente_updated_at BEFORE UPDATE ON public.cliente FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: configuracion trg_configuracion_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_configuracion_updated_at BEFORE UPDATE ON public.configuracion FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: empleado trg_empleado_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_empleado_updated_at BEFORE UPDATE ON public.empleado FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: item_carrito trg_item_carrito_touch; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_item_carrito_touch AFTER INSERT OR DELETE OR UPDATE ON public.item_carrito FOR EACH ROW EXECUTE FUNCTION public.trg_fn_carrito_touch();


--
-- Name: libro trg_libro_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_libro_updated_at BEFORE UPDATE ON public.libro FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pedido_compra trg_pedido_compra_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pedido_compra_updated_at BEFORE UPDATE ON public.pedido_compra FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: pedido_linea trg_pedido_linea_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_pedido_linea_updated_at BEFORE UPDATE ON public.pedido_linea FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: detalle_pedido_compra trg_recepcion_compra; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recepcion_compra AFTER UPDATE OF cantidad_recibida ON public.detalle_pedido_compra FOR EACH ROW EXECUTE FUNCTION public.trg_fn_recepcion_compra();


--
-- Name: transaccion_puntos trg_transaccion_puntos_sync; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_transaccion_puntos_sync AFTER INSERT OR DELETE ON public.transaccion_puntos FOR EACH ROW EXECUTE FUNCTION public.sync_puntos_saldo();


--
-- Name: carrito carrito_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT carrito_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE;


--
-- Name: detalle_pedido_compra detalle_pedido_compra_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_compra
    ADD CONSTRAINT detalle_pedido_compra_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE RESTRICT;


--
-- Name: detalle_pedido_compra detalle_pedido_compra_pedido_compra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_compra
    ADD CONSTRAINT detalle_pedido_compra_pedido_compra_id_fkey FOREIGN KEY (pedido_compra_id) REFERENCES public.pedido_compra(id) ON DELETE CASCADE;


--
-- Name: detalle_pedido_linea detalle_pedido_linea_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_linea
    ADD CONSTRAINT detalle_pedido_linea_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE RESTRICT;


--
-- Name: detalle_pedido_linea detalle_pedido_linea_pedido_linea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_pedido_linea
    ADD CONSTRAINT detalle_pedido_linea_pedido_linea_id_fkey FOREIGN KEY (pedido_linea_id) REFERENCES public.pedido_linea(id) ON DELETE CASCADE;


--
-- Name: detalle_venta detalle_venta_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE RESTRICT;


--
-- Name: detalle_venta detalle_venta_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.detalle_venta
    ADD CONSTRAINT detalle_venta_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id) ON DELETE RESTRICT;


--
-- Name: direccion_entrega direccion_entrega_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direccion_entrega
    ADD CONSTRAINT direccion_entrega_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE;


--
-- Name: item_carrito item_carrito_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_carrito
    ADD CONSTRAINT item_carrito_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carrito(id) ON DELETE CASCADE;


--
-- Name: item_carrito item_carrito_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_carrito
    ADD CONSTRAINT item_carrito_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE RESTRICT;


--
-- Name: libro_autor libro_autor_autor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro_autor
    ADD CONSTRAINT libro_autor_autor_id_fkey FOREIGN KEY (autor_id) REFERENCES public.autor(id) ON DELETE CASCADE;


--
-- Name: libro_autor libro_autor_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro_autor
    ADD CONSTRAINT libro_autor_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE CASCADE;


--
-- Name: libro libro_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES public.categoria(id) ON DELETE SET NULL;


--
-- Name: libro libro_editorial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.libro
    ADD CONSTRAINT libro_editorial_id_fkey FOREIGN KEY (editorial_id) REFERENCES public.editorial(id) ON DELETE SET NULL;


--
-- Name: log_acceso log_acceso_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acceso
    ADD CONSTRAINT log_acceso_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE SET NULL;


--
-- Name: log_acceso log_acceso_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.log_acceso
    ADD CONSTRAINT log_acceso_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(id) ON DELETE SET NULL;


--
-- Name: movimiento_inventario movimiento_inventario_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(id) ON DELETE RESTRICT;


--
-- Name: movimiento_inventario movimiento_inventario_libro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimiento_inventario
    ADD CONSTRAINT movimiento_inventario_libro_id_fkey FOREIGN KEY (libro_id) REFERENCES public.libro(id) ON DELETE RESTRICT;


--
-- Name: pedido_compra pedido_compra_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_compra
    ADD CONSTRAINT pedido_compra_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(id) ON DELETE RESTRICT;


--
-- Name: pedido_compra pedido_compra_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_compra
    ADD CONSTRAINT pedido_compra_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedor(id) ON DELETE RESTRICT;


--
-- Name: pedido_linea pedido_linea_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_linea
    ADD CONSTRAINT pedido_linea_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE RESTRICT;


--
-- Name: pedido_linea pedido_linea_direccion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedido_linea
    ADD CONSTRAINT pedido_linea_direccion_id_fkey FOREIGN KEY (direccion_id) REFERENCES public.direccion_entrega(id) ON DELETE SET NULL;


--
-- Name: sesion sesion_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE CASCADE;


--
-- Name: sesion sesion_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(id) ON DELETE CASCADE;


--
-- Name: transaccion_puntos transaccion_puntos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaccion_puntos
    ADD CONSTRAINT transaccion_puntos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE RESTRICT;


--
-- Name: transaccion_puntos transaccion_puntos_pedido_linea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaccion_puntos
    ADD CONSTRAINT transaccion_puntos_pedido_linea_id_fkey FOREIGN KEY (pedido_linea_id) REFERENCES public.pedido_linea(id) ON DELETE SET NULL;


--
-- Name: transaccion_puntos transaccion_puntos_venta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transaccion_puntos
    ADD CONSTRAINT transaccion_puntos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.venta(id) ON DELETE SET NULL;


--
-- Name: venta venta_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.cliente(id) ON DELETE SET NULL;


--
-- Name: venta venta_empleado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.venta
    ADD CONSTRAINT venta_empleado_id_fkey FOREIGN KEY (empleado_id) REFERENCES public.empleado(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Ue4lMleVJEXhtjbttpfb0euTvvRgQObUl2HUCQgcEEcNw6cAHv72PdlbQH6rDM5

