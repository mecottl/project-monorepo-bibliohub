
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Alias de importación

Los imports entre carpetas usan alias (definidos en `tsconfig.json`), no rutas relativas profundas:
`@core/*`, `@shared/*`, `@domain/*`, `@layouts/*` y `@features/<feature>/*`. Dentro de la misma feature
se permiten relativos cortos (`./` o `../`, máximo dos niveles). `templateUrl` y `styleUrl` siguen siendo
relativos al componente.

## Estructura de carpetas

- `core/`: transversal (auth, http, config). `shared/ui/`, `shared/utils/`: UI y utilidades sin dominio.
- `domain/<área>/`: modelos y servicios usados por varias features (catálogo, pedidos, clientes, ventas, reportes, empleados, carrito, cuenta).
- `layouts/`: contenedores de página. `features/<f>/{pages,components,...}`: una feature solo importa de `core`, `shared`, `domain` (nunca de otra feature).

## Convenciones de nombres y plantillas

- `*.page.ts` (clase `XPage`): componentes enrutados. `*.component.ts`: el resto.
- Plantilla inline hasta ~30 líneas; a partir de ahí `templateUrl` relativo al `.ts`.
- Estilos compartidos entre componentes/features en `shared/styles/`; en cada feature solo lo específico.

## Rutas y límites entre capas

- Cada feature expone su `<f>.routes.ts` con sus guards y `data.roles`; `app.routes.ts` solo compone con `loadChildren`.
- Convención (sin linter; se revisa en el PR): una feature no importa de otra, y `core/shared/domain` no importan de `features/layouts`.

## Tema (claro/oscuro) y accesibilidad

- Los colores viven como tokens en `src/styles/variables.css`; el modo oscuro solo redefine esos tokens bajo `:root[data-theme='dark']`. En CSS no se usan colores fijos (`white`, hex) para superficies, texto ni estados: usa `var(--color-superficie)`, `--color-*-texto`, `--color-*-fondo`, `--color-acento-texto`, `--color-morado-texto`, etc. Texto de color sobre fondo claro/oscuro → variante `*-texto`; fondos con texto blanco → `--color-cafe-oscuro-fondo`, `--color-cafe-medio`, `--color-morado-dark`.
- `ThemeService` (`core/theme`) decide el tema: elección manual guardada en `localStorage` (`tema`) o, si no hay, la preferencia del sistema; `iniciarTema()` corre en `main.ts` antes de arrancar. `app-theme-toggle` está en la barra superior. Librerías que no leen CSS (Chart.js, Stripe Elements) toman los colores con `token('--color-...')` y se vuelven a dibujar al cambiar el tema.
- Auditoría AXE: se ejecutó axe-core (WCAG 2 A/AA, 2.1 A/AA y buenas prácticas) sobre las rutas de tienda, cuenta, auth y administración en claro y oscuro sin violaciones pendientes. Para repetirla, inyecta `https://cdn.jsdelivr.net/npm/axe-core` en la página del dev server y ejecuta `axe.run()` en cada ruta; hazlo al añadir pantallas nuevas. Reglas que se cumplen: un `h1` por página, landmarks (`main`, `aside`, `region` con nombre), contraste AA en ambos temas, `alt=""` en imágenes decorativas.
