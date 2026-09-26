# Despliegue y operación

BiblioHub se despliega como tres contenedores (`docker-compose.yml`): PostgreSQL, backend (NestJS) y frontend (nginx sirviendo el build de Angular y haciendo proxy de `/api` y `/uploads` al backend, así que todo vive en un mismo origen y no hace falta CORS). Un cuarto servicio, `respaldo`, saca copias de la base.

Esto corre igual en un VPS (recomendado para empezar: una máquina con Docker), en una máquina local o en cualquier plataforma que ejecute `docker compose`. La elección del hosting concreto se decide fuera del repo; nada aquí depende de un proveedor.

## Primer arranque

```bash
cp .env.docker.example .env      # edita los secretos
docker compose up -d --build
```

Variables obligatorias en `.env`:

| Variable | Notas |
| --- | --- |
| `POSTGRES_PASSWORD` | Contraseña de la base (no la de desarrollo). |
| `JWT_SECRET` | Mínimo 32 caracteres (`openssl rand -hex 32`). El backend no arranca si es más corto. |
| `FRONTEND_URL` | URL pública de la tienda (CORS y enlaces de correo). |
| `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Modo test mientras no se cobre dinero real. La publicable se incrusta en el build del frontend. |
| `EMAIL_DRIVER` (+ `SMTP_*`) | `console` imprime los correos en el log; `smtp` los envía. |

En el primer arranque (volumen vacío) PostgreSQL carga `db/bibliohub_estructura.sql` y `apps/backend/seed/configuracion.sql` (tasas y envío por defecto). El backend, al iniciar, ejecuta `scripts/migrar.mjs iniciar`: marca la línea base si la base viene del volcado, o aplica las migraciones pendientes si ya existía.

Crear el primer administrador:

```bash
docker compose exec -e ADMIN_USUARIO=admin -e ADMIN_PASSWORD='una-contraseña-larga' backend node scripts/crear-admin.mjs
```

La tienda queda en `http://localhost:8080` (o `WEB_PORT`).

## HTTPS

El frontend expone HTTP en el puerto 80 del contenedor. En producción pon delante un proxy con TLS (Caddy, Traefik, el balanceador del hosting…) que termine HTTPS y reenvíe a `frontend`. El backend ya tiene `TRUST_PROXY=true` y HSTS activo vía helmet. Configura `FRONTEND_URL` con la URL `https://` real.

## Actualizar

```bash
git pull
docker compose up -d --build      # el backend aplica las migraciones nuevas al arrancar
```

## Salud y logs

- `GET /api/health` → 200 `{status, db, stripe, uptimeSegundos}` o 503 si la base no responde. Lo usan el `healthcheck` del contenedor y sirve para el balanceador.
- En producción el backend escribe **una línea JSON por evento** (`ts`, `nivel`, `contexto`, `requestId`, `mensaje`). Cada petición lleva un `x-request-id` (se respeta el entrante) que aparece en todos sus logs. No se registran cuerpos, cabeceras ni query strings.
- Los errores no controlados del backend (5xx) se registran con stack. Los del frontend se envían a `POST /api/telemetria/errores` (tope de 10 por minuto por IP) y quedan en el mismo log con contexto `ErrorFrontend`.
- `docker compose logs -f backend` los muestra; cualquier agregador (Loki, CloudWatch, Datadog…) ingiere JSON por línea sin configuración extra. Para un servicio de errores tipo Sentry basta con inicializarlo en `main.ts` y en `GlobalErrorHandler`; hoy no se depende de ninguno.

## Respaldos

El servicio `respaldo` ejecuta `ops/respaldo.sh` cada 24 h: `pg_dump` en formato custom, verificación con `pg_restore --list` y borrado de los que superen `RETENCION_DIAS` (14 por defecto). Se guardan en el volumen `respaldos`.

Cada 7 respaldos corre `ops/probar-restauracion.sh`: restaura el último en una base temporal y comprueba tablas y funciones SQL críticas; si falla, queda `PRUEBA DE RESTAURACION FALLIDA` en el log del servicio (`docker compose logs respaldo`).

Comandos manuales:

```bash
docker compose exec respaldo sh /ops/respaldo.sh
docker compose exec respaldo sh /ops/probar-restauracion.sh
# copiar un respaldo fuera del servidor
docker compose cp respaldo:/backups/. ./respaldos-locales
```

**Importante:** un respaldo en el mismo servidor no protege de perder el servidor. Copia periódicamente el volumen `respaldos` a otro sitio (otro servidor, almacenamiento de objetos). Las portadas subidas viven en el volumen `uploads`, que también conviene respaldar.

### Restaurar

```bash
docker compose stop backend
docker compose exec respaldo sh -c 'dropdb -h db -U postgres bibliohubv1 && createdb -h db -U postgres bibliohubv1 && pg_restore --no-owner -h db -U postgres -d bibliohubv1 /backups/ARCHIVO.dump'
docker compose start backend
```

## Stripe en producción

Configura el webhook de Stripe apuntando a `https://TU-DOMINIO/api/pedidos/webhook` y copia su secreto a `STRIPE_WEBHOOK_SECRET`. Mientras se use el modo test no se cobra dinero real.
