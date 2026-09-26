// Crea (o reactiva) un administrador. Uso:
//   ADMIN_USUARIO=admin ADMIN_PASSWORD='una-contraseña-larga' ADMIN_NOMBRE='Administrador' \
//     node scripts/crear-admin.mjs
// En Docker: docker compose exec -e ADMIN_USUARIO=... -e ADMIN_PASSWORD=... backend node scripts/crear-admin.mjs

import bcrypt from 'bcrypt';
import pg from 'pg';

const { ADMIN_USUARIO: usuario, ADMIN_PASSWORD: password, ADMIN_NOMBRE: nombre = 'Administrador' } = process.env;
if (!usuario || !password || password.length < 8) {
  console.error('Define ADMIN_USUARIO y ADMIN_PASSWORD (mínimo 8 caracteres).');
  process.exit(1);
}

const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bibliohubv1',
});
await client.connect();
try {
  const hash = await bcrypt.hash(password, 10);
  await client.query(
    `INSERT INTO empleado (nombre, rol, usuario, password_hash) VALUES ($1, 'admin', $2, $3)
     ON CONFLICT (usuario) DO UPDATE SET password_hash = EXCLUDED.password_hash, rol = 'admin', activo = true`,
    [nombre, usuario, hash],
  );
  console.log(`Administrador "${usuario}" listo.`);
} finally {
  await client.end();
}
