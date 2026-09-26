// Ejecutor de migraciones SQL con tabla de control (schema_migrations).
//
//   pnpm --filter backend migrar             aplica las migraciones pendientes, en orden
//   pnpm --filter backend migrar:estado      lista aplicadas y pendientes
//   node scripts/migrar.mjs iniciar         (contenedor) igual que "aplicar", pero si la base se acaba de
//                                            cargar desde db/bibliohub_estructura.sql (schema_migrations
//                                            existe y está vacía, y ya hay tablas) hace baseline primero
//   pnpm --filter backend migrar:baseline    marca todas las migraciones actuales como aplicadas
//                                            (para una base creada desde db/bibliohub_estructura.sql
//                                            o una base existente donde ya se aplicaron a mano)
//
// Cada archivo de apps/backend/migrations/*.sql corre en su propia transacción. Si un archivo ya
// aplicado cambió (checksum distinto) el script falla: las migraciones aplicadas no se editan,
// se agrega una nueva. Lee DB_* del entorno (node --env-file=.env).

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const modo = process.argv[2] ?? 'aplicar';

const client = new pg.Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bibliohubv1',
});

const checksum = (texto) => createHash('sha256').update(texto.replace(/\r\n/g, '\n')).digest('hex');

const archivos = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((nombre) => {
    const sql = readFileSync(join(DIR, nombre), 'utf8');
    return { nombre, sql, checksum: checksum(sql) };
  });

await client.connect();
try {
  const {
    rows: [{ existia, hay_esquema }],
  } = await client.query(
    "SELECT to_regclass('public.schema_migrations') IS NOT NULL AS existia, to_regclass('public.libro') IS NOT NULL AS hay_esquema",
  );
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      nombre      text PRIMARY KEY,
      checksum    text NOT NULL,
      aplicada_en timestamp NOT NULL DEFAULT now()
    )`);
  const { rows } = await client.query('SELECT nombre, checksum FROM schema_migrations');
  const aplicadas = new Map(rows.map((r) => [r.nombre, r.checksum]));

  for (const a of archivos) {
    const previo = aplicadas.get(a.nombre);
    if (previo && previo !== a.checksum) {
      throw new Error(`La migración ya aplicada "${a.nombre}" fue modificada. Agrega una migración nueva.`);
    }
  }
  let pendientes = archivos.filter((a) => !aplicadas.has(a.nombre));
  let modoEfectivo = modo;
  if (modo === 'iniciar') {
    // Esquema recién cargado desde el volcado (ya incluye todas las migraciones): línea base.
    modoEfectivo = existia && hay_esquema && aplicadas.size === 0 ? 'baseline' : 'aplicar';
    if (modoEfectivo === 'baseline') console.log('Base recién creada desde el volcado: se marca la línea base.');
  }

  if (modoEfectivo === 'estado') {
    for (const a of archivos) console.log(`${aplicadas.has(a.nombre) ? '[x]' : '[ ]'} ${a.nombre}`);
    console.log(`\n${pendientes.length} pendiente(s).`);
  } else if (modoEfectivo === 'baseline') {
    for (const a of pendientes) {
      await client.query('INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)', [a.nombre, a.checksum]);
      console.log(`baseline: ${a.nombre}`);
    }
    console.log(`${pendientes.length} migración(es) marcadas como aplicadas.`);
  } else if (modoEfectivo === 'aplicar') {
    for (const a of pendientes) {
      await client.query('BEGIN');
      try {
        await client.query(a.sql);
        await client.query('INSERT INTO schema_migrations (nombre, checksum) VALUES ($1, $2)', [a.nombre, a.checksum]);
        await client.query('COMMIT');
        console.log(`aplicada: ${a.nombre}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Falló ${a.nombre}: ${error.message}`);
      }
    }
    console.log(pendientes.length ? `${pendientes.length} migración(es) aplicadas.` : 'Nada pendiente.');
  } else {
    throw new Error(`Modo desconocido "${modo}" (aplicar | estado | baseline | iniciar)`);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
