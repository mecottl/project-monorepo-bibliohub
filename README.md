# BiblioHub

Librería en línea y punto de venta. Monorepo con un frontend en **Angular 21** (zoneless, signals) y un backend en **NestJS** sobre **PostgreSQL**, administrado con **pnpm**.

- **Tienda:** catálogo, lista de deseos, carrito, pago con Stripe (modo de prueba), puntos de lealtad, "Mi cuenta" (perfil, direcciones, tarjetas, compras y rastreo).
- **Punto de venta y administración:** ventas en tienda, pedidos en línea, inventario, clientes, proveedores y órdenes de compra, reportes, dashboard y empleados.
- **Todo el flujo de pagos es simulado** con las llaves de prueba de Stripe: no se cobra dinero real.

## Estructura

```
apps/
  backend/    NestJS + TypeORM (API en http://localhost:2077/api, Swagger en /api/docs)
  frontend/   Angular (http://localhost:4200)
db/           bibliohub_estructura.sql: esquema completo (tablas, funciones, triggers y vistas)
apps/backend/migrations/   cambios de esquema posteriores, en orden por fecha
apps/backend/seed/         parámetros iniciales de la tienda
```

El esquema real vive en `db/bibliohub_estructura.sql`; las reglas de negocio críticas (puntos, ventas, pedidos) están en sus funciones y triggers. Ver también [`AGENTS.md`](AGENTS.md).

## Requisitos

- Node.js 20 o superior y [pnpm](https://pnpm.io) 10
- PostgreSQL 15 o superior
- (Opcional) [Stripe CLI](https://stripe.com/docs/stripe-cli) para probar webhooks en local

## Puesta en marcha

### 1. Dependencias

```bash
pnpm install
```

### 2. Base de datos

Crea la base y carga el esquema. Como `db/bibliohub_estructura.sql` ya incluye todos los cambios, **no** hace falta aplicar las migraciones sobre una base nueva:

```bash
createdb bibliohub
psql -d bibliohub -f db/bibliohub_estructura.sql
```

Si actualizas una base existente, aplica en orden los archivos de `apps/backend/migrations/` que aún no tengas.

Necesitas al menos un administrador para entrar. Genera el hash de la contraseña e insértalo:

```bash
cd apps/backend
node -e "console.log(require('bcrypt').hashSync('TuContraseñaSegura', 10))"
```

```sql
INSERT INTO empleado (nombre, rol, usuario, password_hash)
VALUES ('Administrador', 'admin', 'admin', '<hash generado>');
```

Parámetros iniciales de la tienda (tasas de puntos, envío):

```bash
PGCLIENTENCODING=UTF8 psql -d bibliohub -f apps/backend/seed/configuracion.sql
```

### 3. Variables de entorno

Copia los ejemplos y complétalos:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

| Variable | Dónde | Para qué |
|---|---|---|
| `DB_*` | backend | Conexión a PostgreSQL |
| `JWT_SECRET` | backend | Firma de sesiones. En producción, mínimo 32 caracteres (`openssl rand -hex 32`); el backend no arranca con uno más corto |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | backend | Llaves de **modo de prueba** de Stripe |
| `NG_APP_STRIPE_PUBLISHABLE_KEY` | frontend | Llave publicable de prueba |
| `NG_APP_API_BASE_URL` | frontend | URL de la API (por defecto `http://localhost:2077/api`) |
| `EMAIL_DRIVER`, `SMTP_*`, `FRONTEND_URL` | backend | Correo de recuperación de contraseña (`console` imprime el enlace en la terminal) |
| `CORS_ORIGINS`, `TRUST_PROXY` | backend | Seguridad detrás de un proxy |

> Los archivos `.env` están en `.gitignore`. Nunca subas llaves de Stripe ni el `JWT_SECRET`.

### 4. Ejecutar

```bash
pnpm dev            # backend y frontend a la vez
# o por separado:
pnpm dev:back       # API en http://localhost:2077/api
pnpm dev:front      # web en http://localhost:4200
```

## Pagos con Stripe (modo de prueba)

1. Crea una cuenta de Stripe y copia las llaves de **prueba** en los `.env`.
2. Tarjeta de prueba: `4242 4242 4242 4242`, cualquier fecha futura y CVC.
3. Al terminar el pago, el frontend llama a `POST /api/pedidos/confirmar-pago` y el backend verifica el pago directamente con Stripe, así que **el webhook no es obligatorio** para desarrollo. Si quieres probarlo, ejecuta `stripe listen --forward-to localhost:2077/api/pedidos/webhook` y usa el `whsec_...` que imprime como `STRIPE_WEBHOOK_SECRET`.

## Roles

| Rol | Acceso |
|---|---|
| Cliente | Tienda, lista de deseos, carrito y "Mi cuenta" |
| Cajero | Ventas (POS), pedidos en línea, inventario, clientes y su propia configuración |
| Administrador | Todo lo anterior más dashboard, reportes, proveedores y empleados |

## Comandos útiles

```bash
pnpm build                      # compila todo (Nx, con caché)
pnpm format:check               # verifica el formato (Prettier)
pnpm test                       # pruebas unitarias
pnpm test:e2e                   # integración/e2e del backend (requiere PostgreSQL)
pnpm --filter backend migrar    # aplica las migraciones SQL pendientes
```

## Despliegue

Variables, migraciones, salud, logs, respaldos y CSP en [`docs/despliegue.md`](docs/despliegue.md).

## Licencia y créditos

[GNU AGPL-3.0](LICENSE). El avatar del topbar usa [`kodama-id`](https://github.com/chroxify/kodama) (AGPL-3.0) y la animación de la portada está inspirada en el componente Skiper 39 de [Skiper UI](https://skiper-ui.com) vía 21st.dev.
