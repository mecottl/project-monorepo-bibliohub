# Despliegue y operación

BiblioHub son dos procesos más una base de datos: el backend (NestJS, `node dist/main`), el frontend (archivos estáticos de `pnpm --filter frontend build`, carpeta `apps/frontend/dist/frontend/browser`) y PostgreSQL 15 o superior. El hosting concreto se decide fuera del repo; nada aquí depende de un proveedor.

## Backend

```bash
pnpm install --frozen-lockfile
pnpm --filter backend build
NODE_ENV=production node apps/backend/dist/main   # con las variables de abajo
```

Variables (ver `apps/backend/.env.example`):

| Variable | Notas |
| --- | --- |
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | Base de datos. |
| `JWT_SECRET` | Mínimo 32 caracteres (`openssl rand -hex 32`). En producción el backend no arranca si es más corto. |
| `PORT` | Por defecto 3000 (en desarrollo, 2077). |
| `CORS_ORIGINS` | Orígenes del frontend, separados por coma. |
| `TRUST_PROXY=true` | Si va detrás de un proxy/balanceador (para el límite por IP). |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Modo test mientras no se cobre dinero real. |
| `EMAIL_DRIVER` (+ `SMTP_*`, `EMAIL_FROM`, `FRONTEND_URL`) | `console` imprime los correos en el log; `smtp` los envía. |
| `LOG_FORMAT=json` | Logs JSON (en producción ya lo son). |

## Base de datos

- Base nueva: cargar `db/bibliohub_estructura.sql`, insertar los parámetros con `apps/backend/seed/configuracion.sql` y correr `pnpm --filter backend migrar:baseline`.
- Base existente: `pnpm --filter backend migrar` aplica las migraciones pendientes (cada una en su transacción; una migración ya aplicada no se edita). `migrar:estado` las lista.
- Primer administrador: `ADMIN_USUARIO=admin ADMIN_PASSWORD='una-contraseña-larga' node apps/backend/scripts/crear-admin.mjs` (lee las variables `DB_*`).
- Tras cambiar el esquema, regenerar el volcado: `pnpm --filter backend db:dump` (necesita `pg_dump`).

## Frontend

`NG_APP_API_BASE_URL` y `NG_APP_STRIPE_PUBLISHABLE_KEY` se resuelven **en tiempo de build** (`apps/frontend/.env.production`). Cualquier servidor de estáticos sirve el resultado, con fallback a `index.html` para las rutas de Angular.

Se recomienda servirlo desde el mismo origen que la API (proxy de `/api` y `/uploads` al backend) para no depender de CORS, y con HTTPS terminado en el proxy.

### CSP recomendada

El build no inyecta CSS crítico inline ni scripts inline, así que una CSP estricta funciona. Configúrala en el servidor de estáticos:

```
default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://api.stripe.com https://m.stripe.network; frame-src https://js.stripe.com https://hooks.stripe.com https://m.stripe.network; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
```

La API ya responde con `default-src 'none'` (salvo Swagger, `/api/docs`). Si añades un tercero (analítica, mapas…), agrégalo a la política.

## Salud y logs

- `GET /api/health` → 200 `{status, db, stripe, uptimeSegundos}` o 503 si la base no responde. Úsalo en el balanceador/hosting.
- Logs: una línea JSON por evento (`ts`, `nivel`, `contexto`, `requestId`, `mensaje`). Cada petición lleva un `x-request-id` (se respeta el entrante) que aparece en todos sus logs. No se registran cuerpos, cabeceras ni query strings.
- Los errores no controlados del backend (5xx) se registran con stack. Los del frontend se envían a `POST /api/telemetria/errores` (tope de 10 por minuto por IP) y quedan en el mismo log con contexto `ErrorFrontend`. Para un servicio tipo Sentry basta con inicializarlo en `main.ts` y en `GlobalErrorHandler`; hoy no se depende de ninguno.

## Respaldos

`ops/respaldo.sh` hace `pg_dump` en formato custom, lo verifica con `pg_restore --list` y borra los que superen `RETENCION_DIAS` (14 por defecto). `ops/probar-restauracion.sh` restaura el último en una base temporal y comprueba tablas y funciones SQL críticas. Ambos usan las variables estándar de libpq (`PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) y `RESPALDO_DIR`. Prográmalos con cron o el planificador del hosting (respaldo diario, prueba semanal):

```bash
RESPALDO_DIR=/var/respaldos sh ops/respaldo.sh
RESPALDO_DIR=/var/respaldos sh ops/probar-restauracion.sh
```

Para restaurar: `dropdb`/`createdb` y `pg_restore --no-owner -d bibliohubv1 ARCHIVO.dump` con el backend detenido.

**Importante:** un respaldo en el mismo servidor no protege de perderlo. Copia los respaldos a otro sitio. Las portadas subidas viven en `apps/backend/uploads/` y también hay que respaldarlas.

## Seguridad de sesión y contraseñas

- **Contraseñas** (registro, cambio y restablecimiento; clientes y empleados): 8–72 caracteres, sin lista de contraseñas comunes, repeticiones ni secuencias simples. La regla vive en `apps/backend/src/common/validation/contrasena-segura.ts` y se replica en `apps/frontend/src/app/shared/utils/contrasena.ts`; si cambias una, cambia la otra. Las cuentas existentes con contraseñas cortas siguen entrando; la política aplica al establecer una nueva.
- **Bloqueo por cuenta**: 5 intentos fallidos desde el último acceso correcto bloquean la cuenta 15 minutos (HTTP 429), además del límite por IP. Al llegar al 5.º fallo el cliente recibe un correo si tiene uno registrado. Se calcula sobre `log_acceso`.

## Stripe en producción

Configura el webhook de Stripe apuntando a `https://TU-DOMINIO/api/pedidos/webhook` y copia su secreto a `STRIPE_WEBHOOK_SECRET`. Mientras se use el modo test no se cobra dinero real.
