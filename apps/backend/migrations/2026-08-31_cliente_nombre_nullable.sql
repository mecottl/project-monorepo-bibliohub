-- El proyecto no usa migraciones formales de TypeORM (synchronize: false,
-- sin carpeta de migrations); este archivo documenta un cambio de esquema
-- aplicado a mano y debe correrse en cualquier otro entorno (staging/prod).
--
-- Motivo: permitir clientes "solo teléfono" — creados desde el mostrador
-- (venta/POS) con teléfono y puntos, sin nombre ni contraseña todavía.
-- El cliente reclama esa cuenta más tarde registrándose con el mismo
-- teléfono (ver AuthService.registrarCliente, que ya soportaba este caso
-- a nivel de DTO/lógica — solo bloqueaba el NOT NULL de la columna).

ALTER TABLE cliente ALTER COLUMN nombre DROP NOT NULL;
