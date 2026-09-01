# BiblioHub — Guía para agentes de código

Monorepo con `apps/frontend` (Angular 21.2) y `apps/backend` (NestJS), PostgreSQL, pnpm.

## Convenciones por app

- Trabajando en `apps/frontend/`: sigue `apps/frontend/AGENTS.md`.
- Trabajando en `apps/backend/`: sigue `apps/backend/AGENTS.md`.

## Fuente de verdad del esquema de base de datos

El esquema real vive en `db/bibliohub_estructura.sql` — incluye tablas, funciones,
triggers y vistas. Es más confiable que cualquier documento descriptivo aparte, porque no se
desincroniza del código. Antes de asumir una regla de negocio, revisa las funciones y
triggers ahí (especialmente `confirmar_venta_pos`, `cancelar_venta`,
`confirmar_pedido_linea`, `trg_fn_recepcion_compra`).

## Reglas de negocio críticas (resumen — la versión completa vive en Drive, fuera de este repo)

- **Cliente "solo teléfono":** un cliente puede existir y acumular puntos dando solo su
  teléfono, sin nombre (`cliente.nombre` es nullable). El nombre solo es obligatorio cuando
  alguien se registra activamente online por primera vez (`POST /auth/registro` para un
  teléfono que no existía antes).
- **Puntos:** `cliente.puntos_saldo` es un caché de solo lectura. La fuente de verdad es
  `transaccion_puntos` (tipo `ganado`/`canjeado`), siempre recalculable. NUNCA se edita
  `puntos_saldo` fuera de una transacción que también inserte en `transaccion_puntos`. Las
  únicas vías válidas: `confirmar_venta_pos()`, `confirmar_pedido_linea()` (ambas en SQL), o
  `POST /clientes/:id/ajuste-puntos` (NestJS, ya implementado).
- **Ventas/pedidos:** las funciones SQL `confirmar_venta_pos()` y `confirmar_pedido_linea()`
  ya encapsulan toda la lógica transaccional (stock, puntos, subtotales) — cuando se
  construyan los módulos `ventas`/`pedidos`, llamarlas vía SQL crudo desde NestJS en vez de
  reimplementar la lógica en TypeORM.
- **Roles:** a nivel backend, si un endpoint no tiene `@Roles(...)`, cualquier usuario
  autenticado pasa (permisivo por defecto). A nivel frontend, si una ruta no tiene
  `data: { roles: [...] }`, nadie pasa (restrictivo por defecto) — son comportamientos
  inversos, hay que declarar los roles explícitamente en ambos lados.

## Restricción de ejecución

Este repo se trabaja principalmente vía guías `.md` generadas en sesiones de planeación
(Claude, chat) y ejecutadas aquí (Claude Code). Si encuentras un archivo `guia-*.md` o
similar en la raíz o adjunto a la tarea, es la fuente de instrucciones para esa tarea
específica — síguelo tal cual, no lo reinterpretes.