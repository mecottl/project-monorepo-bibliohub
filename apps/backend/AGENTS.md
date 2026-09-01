# BiblioHub Backend — Convenciones para agentes de código

NestJS + TypeORM + PostgreSQL. Sigue estas convenciones en cualquier código nuevo.

## Estructura de módulos

Cada módulo de negocio vive en `src/modules/<nombre>/`, con subcarpetas según lo que
necesite (no todos los módulos tienen las 5):

- `controllers/` — un controller por módulo, decorado con `@ApiTags`
- `services/` — lógica de negocio, inyectado con `@InjectRepository`
- `dto/` — un DTO por operación (`create-x.dto.ts`, `update-x.dto.ts`, `query-x.dto.ts`),
  usando `class-validator` y `@ApiProperty`/`@ApiPropertyOptional` de Swagger
- `interfaces/` — tipos TypeScript propios del módulo (respuestas paginadas, tipos
  derivados de entidades)
- `decorators/`, `guards/`, `strategies/` — solo en `auth/`, no dupliques ahí si otro
  módulo necesita algo similar; extiende lo existente
- `storage/` — patrón de abstracción de infraestructura (ver `catalogo/storage/`,
  interfaz + implementación intercambiable vía variable de entorno). Sigue este mismo
  patrón para cualquier otra pieza de infraestructura externa (email, colas, etc.)

Las entidades TypeORM viven centralizadas en `src/database/entities/`, no dentro de cada
módulo.

## Roles y permisos

- `@Roles('admin')`, `@Roles('admin', 'cajero')` sobre el método del controller.
- Sin decorador `@Roles`, el endpoint es accesible para cualquier usuario autenticado
  (`RolesGuard` es permisivo por defecto — revisa `AGENTS.md` raíz para la asimetría con
  frontend).
- `RolesGuard` y `JwtAuthGuard` ya están registrados globalmente vía `APP_GUARD` en
  `app.module.ts` — no los agregues por módulo.

## DTOs y validación

- `class-validator` para validación (`@IsString`, `@IsOptional`, `@IsIn`, etc.), nunca
  validación manual en el service.
- `@IsOptional()` antes de otros validadores permite que el campo llegue como `null` o
  `undefined` sin fallar — úsalo para campos que puedan "borrarse" explícitamente
  (ver `UpdateClienteDto.nombre` como referencia).
- Un DTO nunca debe exponer un campo derivado/calculado como editable (ejemplo real:
  `puntosSaldo` se quitó de `UpdateClienteDto` a propósito — ver reglas de negocio en
  `AGENTS.md` raíz).

## Transacciones

Cuando una operación toca más de una tabla y ambas escrituras deben ser atómicas (ej.
actualizar un saldo Y registrar el movimiento que lo explica), usa
`this.dataSource.transaction(async (manager) => { ... })` — ver
`ClientesService.ajustarPuntos()` como referencia de patrón.

Para lógica ya escrita como función de PostgreSQL (ver `docs/bibliohub_estructura.sql`),
prefiere llamarla vía SQL crudo (`dataSource.query('SELECT nombre_funcion(...)', [params])`)
en vez de reimplementarla en TypeORM — ya está escrita, probada, y evita duplicar lógica de
negocio en dos lugares.

## Manejo de errores

- `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException` de
  `@nestjs/common` — nunca lanzar errores genéricos ni devolver `null` silenciosamente.
- Si una operación puede violar un `CHECK` constraint de Postgres (ej. saldo no negativo),
  valida la condición en el service ANTES del `UPDATE`/`INSERT`, para devolver un
  `BadRequestException` con mensaje claro en vez de dejar que el error crudo de Postgres
  llegue como 500.

## TypeScript

- El ESLint del proyecto tiene `@typescript-eslint/no-explicit-any` desactivado — el linter
  NO te va a marcar el uso de `any`. Aun así, evítalo: usa las interfaces de `interfaces/`
  o los tipos de las entidades. Esto es una convención del equipo, no una regla del linter.

## Antes de dar por buena una regla de negocio

Revisa `docs/bibliohub_estructura.sql` (funciones, triggers, constraints) y el resumen de
reglas de negocio en el `AGENTS.md` raíz. Si necesitas el detalle completo de una regla que
solo está resumida ahí, pregúntalo explícitamente — la versión extendida vive en un
documento fuera de este repo (Google Drive del proyecto), a la que Claude Code no tiene
acceso directo.