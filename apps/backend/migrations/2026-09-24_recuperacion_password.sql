-- El proyecto no usa migraciones formales de TypeORM (synchronize: false);
-- este archivo documenta un cambio de esquema aplicado a mano.
--
-- Motivo: recuperación de contraseña de clientes. Solo se guarda el hash
-- (sha256) del token — el token en claro únicamente viaja en el correo.
-- Un uso por token; expira_en limita su vida (1 hora desde el backend).

CREATE TABLE recuperacion_password (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id uuid NOT NULL REFERENCES cliente(id) ON DELETE CASCADE,
    token_hash varchar(64) NOT NULL UNIQUE,
    expira_en timestamp without time zone NOT NULL,
    usado boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
CREATE INDEX idx_recuperacion_password_cliente ON recuperacion_password (cliente_id);
