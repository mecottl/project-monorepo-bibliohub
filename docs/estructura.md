# LibreriaV1 - Arquitectura del Proyecto

## Stack Tecnológico

| Tecnología | Uso |
|------------|-----|
| Node.js | Runtime |
| PNPM | Gestor de paquetes |
| NestJS | Backend |
| Angular | Frontend Administrativo |
| PostgreSQL | Base de Datos |
| MCP | Servidores IA |
| TypeScript | Lenguaje principal |

---

# Estructura General

```
libreriaV1/

apps/
    backend/
    frontend/

mcp/

db/

docs/

node_modules/

package.json
pnpm-workspace.yaml
README.md
```

---

# Configuración inicial

Instalar dependencias

```bash
pnpm install
```

---

Actualizar dependencias

```bash
pnpm update
```

---

Instalar dependencias de todos los proyectos

```bash
pnpm install -r
```

---

# Backend

Entrar

```bash
cd apps/backend
```

Instalar dependencias

```bash
pnpm install
```

Compilar TypeScript

```bash
pnpm build
```

o

```bash
nest build
```

Esto permite:

- detectar errores de TypeScript
- generar la carpeta dist
- validar imports
- validar módulos

Eliminar build

```bash
rm -rf dist
```

Ejecutar en desarrollo

```bash
pnpm run start:dev
```

o

```bash
npm run start:dev
```

Compilar sin ejecutar

```bash
pnpm build
```

Ejecutar el build

```bash
node dist/main.js
```

Revisar ESLint

```bash
pnpm lint
```

Corregir automáticamente

```bash
pnpm lint --fix
```

Formatear

```bash
pnpm format
```

---

# Frontend

Entrar

```bash
cd apps/frontend
```

Instalar dependencias

```bash
pnpm install
```

Compilar Angular

```bash
pnpm build
```

Levantar servidor

```bash
pnpm start
```

Compilar producción

```bash
ng build
```

---

# Scripts de la raíz

Actualmente el proyecto tiene:

```json
{
  "scripts": {
    "dev:front": "pnpm --filter frontend start",
    "dev:back": "pnpm --filter backend dev",
    "dev": "pnpm --parallel --filter frontend --filter backend run dev"
  }
}
```


# Organización del Proyecto

```
apps/
```

Contiene todas las aplicaciones ejecutables.

Actualmente:

- backend
- frontend

En el futuro puede contener:

- mobile
- landing
- admin

---

# Backend

```
apps/backend/src
```

## common

Código reutilizable.

```
decorators/
filters/
guards/
interceptors/
middleware/
pipes/
exceptions/
utils/
```

Responsabilidades

- Decoradores personalizados
- Guards JWT
- Validaciones
- Manejo de excepciones
- Helpers

---

## config

Configuraciones globales.

Ejemplos

- JWT
- Swagger
- Variables de entorno
- PostgreSQL
- CORS

---

## database

Todo lo relacionado con la persistencia.

```
entities/
migrations/
seeds/
subscribers/
```

Responsabilidades

- Entidades
- Migraciones
- Seeds
- Configuración TypeORM

---

## modules

Contiene toda la lógica del negocio.

Cada carpeta representa un dominio del sistema.

Ejemplo

```
auth/
users/
books/
inventory/
sales/
customers/
loyalty/
suppliers/
purchases/
orders/
reports/
dashboard/
uploads/
notifications/
settings/
audit/
```

Cada módulo es independiente.

Debe contener:

```
controllers

services

dto

entities

repositories

interfaces

module.ts
```

---

# Frontend

```
apps/frontend/src/app
```

## core

Servicios únicos de la aplicación.

Ejemplos

- AuthService
- HttpInterceptor
- Guards
- Configuración

---

## shared

Componentes reutilizables.

Ejemplos

- Botones
- Inputs
- Pipes
- Directivas
- Tablas
- Cards

---

## layouts

Diseños principales.

Ejemplo

```
AdminLayout

AuthLayout

PublicLayout
```

---

## features

Cada carpeta representa un módulo del negocio.

Ejemplo

```
books

inventory

sales

customers
```

Cada feature contendrá

```
pages/

components/

services/

models/

routes.ts
```

---

# MCP

```
mcp/
```

Proyecto independiente.

Contendrá

```
servers/

tools/

prompts/

resources/
```

No comparte lógica con NestJS.

Su objetivo es exponer herramientas mediante Model Context Protocol.

---

# db

Contendrá información relacionada con PostgreSQL.

```
scripts/

backup/

docker/

diagramas/
```

No contiene código del backend.

---

# docs

Documentación del proyecto.

```
api/

database/

architecture/

manuales/

diagramas/
```

---

# Flujo recomendado

1. Crear entidades.

2. Crear migraciones.

3. Crear módulos.

4. Crear servicios.

5. Crear controladores.

6. Documentar Swagger.

7. Consumir API desde Angular.

8. Crear herramientas MCP.

---

# Verificación del proyecto

## Backend

```bash
pnpm build
pnpm lint
pnpm test
```

---

## Frontend

```bash
pnpm build
pnpm test
```

---

## Proyecto completo

Desde la raíz

```bash
pnpm build

pnpm lint

pnpm test
```

Si todos los comandos terminan correctamente:

- La estructura del monorepo es válida.
- TypeScript no presenta errores.
- Angular compila correctamente.
- NestJS genera el directorio `dist`.
- La arquitectura está lista para comenzar el desarrollo.