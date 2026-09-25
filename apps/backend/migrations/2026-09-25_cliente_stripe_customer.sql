-- El proyecto no usa migraciones formales de TypeORM (synchronize: false);
-- este archivo documenta un cambio de esquema aplicado a mano.
--
-- Motivo: tarjetas guardadas en "Mi cuenta". Stripe guarda las tarjetas
-- colgadas de un Customer; aquí solo se conserva su id (nunca datos de tarjeta).
-- Nullable: el Customer se crea la primera vez que el cliente guarda una tarjeta.

ALTER TABLE cliente ADD COLUMN stripe_customer_id varchar(255) NULL UNIQUE;
