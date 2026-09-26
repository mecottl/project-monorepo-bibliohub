-- Parámetros por defecto de la tienda (idempotente: no pisa lo que un admin ya editó).
INSERT INTO configuracion (clave, valor, tipo_dato, descripcion) VALUES
  ('costo_envio_default', '80', 'numeric', 'Costo de envío a domicilio en MXN'),
  ('envio_gratis_desde', '500', 'numeric', 'Monto mínimo para envío gratis'),
  ('nombre_tienda', 'Librería', 'text', 'Nombre visible de la tienda'),
  ('stock_minimo_default', '5', 'integer', 'Stock mínimo por defecto para libros nuevos'),
  ('tasa_puntos_acumulacion', '10', 'integer', 'Cada cuántos pesos MXN se gana 1 punto'),
  ('tasa_puntos_canje', '1', 'integer', 'Cuántos pesos descuenta 1 punto canjeado')
ON CONFLICT (clave) DO NOTHING;
