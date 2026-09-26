// Regenera db/bibliohub_estructura.sql con pg_dump (solo esquema). Requiere pg_dump en el PATH
// (o PG_DUMP con la ruta completa). Uso: pnpm --filter backend db:dump
//
// Conserva el encabezado del archivo y el token de \restrict/\unrestrict que pg_dump cambia en
// cada ejecución, para que el diff solo muestre cambios reales de esquema.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const destino = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'db', 'bibliohub_estructura.sql');
const env = {
  ...process.env,
  PGPASSWORD: process.env.DB_PASSWORD || 'postgres',
  PGCLIENTENCODING: 'UTF8',
};
const r = spawnSync(
  process.env.PG_DUMP || 'pg_dump',
  [
    '-h', process.env.DB_HOST || 'localhost',
    '-p', process.env.DB_PORT || '5432',
    '-U', process.env.DB_USERNAME || 'postgres',
    '-d', process.env.DB_NAME || 'bibliohubv1',
    '-s', '-O', '-x',
  ],
  { env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
if (r.status !== 0) {
  console.error(r.stderr || 'pg_dump falló (¿está en el PATH? usa PG_DUMP=ruta).');
  process.exit(1);
}

const patron = /(\\(?:un)?restrict )(\S+)/g;
let previo = '';
try {
  previo = readFileSync(destino, 'utf8');
} catch { /* empty */ }

const token = /\\restrict (\S+)/.exec(previo)?.[1];
let nuevo = r.stdout.replace(/\r\n/g, '\n');
if (token) nuevo = nuevo.replace(patron, (_, p) => p + token);
const cabecera = previo.startsWith('-- Libreria\n') ? '-- Libreria\n\n' : '';
writeFileSync(destino, cabecera + nuevo);
console.log(`Esquema volcado en ${destino}`);
