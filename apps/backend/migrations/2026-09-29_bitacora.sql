-- #50: bitácora de acciones sensibles (solo se escribe desde el backend; el admin la consulta en modo lectura).
-- empleado_nombre es una copia del nombre al momento de la acción: la bitácora sigue siendo legible
-- aunque el empleado se elimine o cambie de nombre.

CREATE TABLE IF NOT EXISTS bitacora (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id      uuid REFERENCES empleado(id) ON DELETE SET NULL,
    empleado_nombre  varchar(120),
    accion           varchar(60)  NOT NULL,
    entidad          varchar(40)  NOT NULL,
    entidad_id       varchar(80),
    antes            jsonb,
    despues          jsonb,
    ip               varchar(45),
    fecha            timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_accion ON bitacora (accion);
CREATE INDEX IF NOT EXISTS idx_bitacora_empleado ON bitacora (empleado_id);
