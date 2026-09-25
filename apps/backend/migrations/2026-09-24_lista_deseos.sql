-- El proyecto no usa migraciones formales de TypeORM (synchronize: false);
-- este archivo documenta un cambio de esquema aplicado a mano y debe correrse
-- en cualquier otro entorno.
--
-- Motivo: lista de deseos del cliente (/lista-deseos). Un libro aparece una
-- sola vez por cliente; si se borra el cliente o el libro, la fila se va.

CREATE TABLE lista_deseos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    libro_id uuid NOT NULL REFERENCES libro(id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    UNIQUE (cliente_id, libro_id)
);
CREATE INDEX idx_lista_deseos_cliente ON lista_deseos (cliente_id);
