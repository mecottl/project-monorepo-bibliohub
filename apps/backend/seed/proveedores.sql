-- Datos de ejemplo (solo desarrollo): proveedores y órdenes de compra en distintos estados.
-- Idempotente: los proveedores se crean por nombre y las órdenes solo si no existe ninguna "Ejemplo:...".
-- Las órdenes ya recibidas se insertan con cantidad_recibida completa (INSERT no dispara el trigger de
-- recepción), así que NO modifican el stock actual: se asume que ya está reflejado.
--
--   PGCLIENTENCODING=UTF8 psql -h localhost -U <usuario> -d <base> -f apps/backend/seed/proveedores.sql

INSERT INTO proveedor (nombre, contacto_nombre, email, telefono, condiciones_comerciales)
SELECT v.nombre, v.contacto, v.email, v.telefono, v.condiciones
FROM (VALUES
  ('Distribuidora Letras del Sur',   'Marcela Ortiz',     'ventas@letrasdelsur.example.com',    '9999123456', 'Crédito a 30 días. Envío gratis en pedidos mayores a $5,000.'),
  ('Grupo Editorial Ágora',          'Rodrigo Salas',     'pedidos@agora-editorial.example.com', '5551234567', 'Descuento del 35% sobre precio de portada. Pago a 15 días.'),
  ('Libros Mayoristas del Centro',   'Patricia Velázquez','contacto@mayoristascentro.example.com','3312345678','Mínimo de compra de 20 piezas. Devoluciones hasta 60 días.'),
  ('Editorial Bibliófilos MX',       'Andrés Cetina',     'andres@bibliofilos.example.com',      '9991112233', 'Ediciones de colección; pago de contado con 5% de descuento.'),
  ('Importadora Cervantes',          'Lucía Fernández',   'importaciones@cervantes.example.com', '5559876543', 'Títulos importados. Tiempo de entrega de 3 a 4 semanas.'),
  ('Casa del Libro Mayorista',       'Héctor Ramírez',    'hector@casadellibro.example.com',     '8187654321', 'Crédito a 45 días para clientes recurrentes.'),
  ('Ediciones Horizonte',            'Valeria Montes',    'valeria@ed-horizonte.example.com',    '9993334455', 'Novedades mensuales; pedidos por adelantado con 10% de descuento.'),
  ('Papelería y Libros Yucatán',     'Iván Canché',       'ventas@plyucatan.example.com',        '9995556677', 'Entrega local en 48 horas. Pago contra entrega.')
) AS v(nombre, contacto, email, telefono, condiciones)
WHERE NOT EXISTS (SELECT 1 FROM proveedor p WHERE p.nombre = v.nombre);

DO $$
DECLARE
  v_emp    uuid;
  v_libros uuid[];
  v_n      int;
  v_ped    uuid;
  v_total  numeric;
  r        record;
  it       record;
BEGIN
  IF EXISTS (SELECT 1 FROM pedido_compra WHERE notas LIKE 'Ejemplo:%') THEN
    RAISE NOTICE 'Las órdenes de ejemplo ya estaban cargadas.';
    RETURN;
  END IF;

  SELECT id INTO v_emp FROM empleado WHERE rol = 'admin' AND activo ORDER BY fecha_alta LIMIT 1;
  SELECT array_agg(id ORDER BY titulo) INTO v_libros FROM libro WHERE activo;
  v_n := COALESCE(array_length(v_libros, 1), 0);

  IF v_emp IS NULL OR v_n < 6 THEN
    RAISE NOTICE 'Se necesita al menos un administrador y 6 libros activos; no se crearon órdenes.';
    RETURN;
  END IF;

  -- items: [[posición del libro (ordenado por título), solicitada, recibida], ...]
  FOR r IN SELECT * FROM (VALUES
    ('Distribuidora Letras del Sur',  'recibido',         58, 'Ejemplo: reposición de temporada',          '[[1,20,20],[4,15,15],[7,10,10]]'::jsonb),
    ('Grupo Editorial Ágora',         'recibido',         41, 'Ejemplo: novedades del mes',                '[[2,12,12],[5,12,12],[9,8,8]]'::jsonb),
    ('Libros Mayoristas del Centro',  'recibido_parcial', 20, 'Ejemplo: entrega pendiente de 2 títulos',   '[[3,25,25],[6,20,10],[8,10,0]]'::jsonb),
    ('Importadora Cervantes',         'enviado',          9,  'Ejemplo: importación en tránsito',          '[[10,15,0],[11,10,0]]'::jsonb),
    ('Ediciones Horizonte',           'pendiente',        3,  'Ejemplo: pedido por adelantado',            '[[12,18,0],[2,10,0],[6,6,0]]'::jsonb),
    ('Editorial Bibliófilos MX',      'pendiente',        1,  'Ejemplo: ediciones de colección',           '[[13,5,0]]'::jsonb),
    ('Casa del Libro Mayorista',      'cancelado',        30, 'Ejemplo: cancelada por retraso del proveedor','[[14,30,0],[1,10,0]]'::jsonb)
  ) AS o(proveedor, estado, dias, notas, items)
  LOOP
    INSERT INTO pedido_compra (proveedor_id, empleado_id, fecha, estado, total, notas, updated_at)
    VALUES ((SELECT id FROM proveedor WHERE nombre = r.proveedor), v_emp,
            now() - make_interval(days => r.dias), r.estado, 0, r.notas, now())
    RETURNING id INTO v_ped;

    v_total := 0;
    FOR it IN
      SELECT (e->>0)::int AS pos, (e->>1)::int AS solicitada, (e->>2)::int AS recibida
      FROM jsonb_array_elements(r.items) AS e
    LOOP
      INSERT INTO detalle_pedido_compra (pedido_compra_id, libro_id, cantidad_solicitada, cantidad_recibida, precio_costo, subtotal_linea)
      SELECT v_ped, l.id, it.solicitada, it.recibida, l.precio_costo, it.solicitada * l.precio_costo
      FROM libro l
      WHERE l.id = v_libros[((it.pos - 1) % v_n) + 1];

      v_total := v_total + it.solicitada * (SELECT precio_costo FROM libro WHERE id = v_libros[((it.pos - 1) % v_n) + 1]);
    END LOOP;

    UPDATE pedido_compra SET total = v_total WHERE id = v_ped;
  END LOOP;
END $$;
