-- El proyecto no usa migraciones formales de TypeORM (synchronize: false,
-- sin carpeta de migrations); este archivo documenta un cambio de esquema
-- aplicado a mano y debe correrse en cualquier otro entorno (staging/prod).
--
-- Motivo: agregar sinopsis a libro para el viewer público de detalle
-- (catálogo → /libro/:id). Nullable porque los libros existentes no tienen
-- este dato todavía; se llena desde el formulario de edición en Inventario.

ALTER TABLE libro ADD COLUMN sinopsis text NULL;
