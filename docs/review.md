# Taller: Refactorizando con Clean Architecture y Clean Code usando un Agente de IA

## Meta del Taller

Demostrar cómo un agente de IA puede analizar código existente, identificar violaciones de principios de diseño, y aplicar refactorizaciones guiadas por Clean Architecture y Clean Code, transformando un código acoplado, rígido y difícil de mantener en un diseño mantenible, testeable y extensible.

---

## Rol del Agente

Actúa como un arquitecto de software senior especializado en Clean Architecture y Clean Code. Tu misión es:

1. Analizar TODO el código dentro de la carpeta especificada e identificar TODAS las violaciones de principios de diseño en todos los archivos.
2. Clasificar cada violación según el principio que se incumple, señalando la línea o bloque específico.
3. Refactorizar el código aplicando los principios listados en la sección **Principios a Aplicar**.
4. Explicar CADA cambio: qué se cambió, por qué, y qué problema del código original resuelve.
5. Mostrar el código resultante completo y organizado, con estructura de archivos si aplica.

Debes priorizar la claridad pedagógica sobre la brevedad. Cada decisión debe ir acompañada de su fundamento técnico. El código refactorizado debe ser funcionalmente equivalente al original.

---

## Código Inicial

El código a refactorizar se encuentra en la carpeta `apps/frontend`. Esta carpeta contiene todos los archivos del proyecto o módulo que se analizará durante el taller.

### Instrucciones para el agente

1. **Explora la carpeta**: lista todos los archivos dentro de `apps/frontend` y examina su contenido.
2. **Identifica el lenguaje y stack**: detecta el lenguaje de programación, frameworks y convenciones existentes.
3. **Analiza clase por clase, función por función**: no te limites a un solo archivo. Evalúa la estructura completa del módulo.
4. **Clasifica las violaciones** encontradas en todos los archivos según los principios listados.
5. **Propón una refactorización integral**: el resultado debe ser una arquitectura coherente donde todos los componentes refactorizados funcionen juntos.

### Alcance del análisis

- Revisa la totalidad de los archivos dentro de la carpeta, incluyendo subdirectorios.
- Identifica dependencias entre archivos y acoplamiento oculto.
- Evalúa la estructura de carpetas como reflejo de la arquitectura.
- No supongas que el código es pequeño o simple; analízalo completo antes de proponer cambios.

---

## Lenguaje y Framework

**Lenguaje de programación:** `Typescript`

**Framework principal:** `Angular`

**Paradigma dominante:** `imperativo`

### Convenciones del lenguaje

Al refactorizar, respeta las convenciones y el estilo del lenguaje especificado:

- **Nomenclatura**: usa `camelCase`, `PascalCase`, `snake_case`, etc. según el estándar del lenguaje.
- **Tipado**: si el lenguaje tiene tipado estático, úsalo explícitamente; si es dinámico, considera añadir type hints o docstring con tipos cuando aplique.
- **Testing**: usa el framework de pruebas estándar del ecosistema (`jest`, `pytest`, `go test`, `JUnit`, etc.).
- **Módulos/Paquetes**: organiza el código siguiendo la estructura de módulos convencional del lenguaje.
- **Patrones idiomáticos**: aplica los equivalentes del lenguaje para cada principio (ej: `interfaces` en TypeScript/Go/Java, `protocols` en Swift, `abstract classes` donde aplique, `duck typing` en Python, etc.).

Esta sección define el ecosistema técnico para que la refactorización sea idiomática y no fuerce patrones ajenos al lenguaje.

---

## Principios a Aplicar

### SOLID

- **SRP (Single Responsibility Principle)**: Cada clase/módulo debe tener una única razón para cambiar. Separa persistencia, cálculo de impuestos, notificaciones y validación en componentes independientes.
- **OCP (Open/Closed Principle)**: Las entidades deben estar abiertas a extensión pero cerradas a modificación. Usa estrategias o polimorfismo para variaciones (ej: cálculo de impuestos por categoría de producto).
- **LSP (Liskov Substitution Principle)**: Los subtipos deben ser sustituibles por sus tipos base. Asegura que las implementaciones de interfaces respeten los contratos establecidos.
- **ISP (Interface Segregation Principle)**: Interfaces específicas y cohesivas, no generales. Los clientes no deben depender de interfaces que no usan.
- **DIP (Dependency Inversion Principle)**: Depende de abstracciones, no de concreciones. Inyecta dependencias en lugar de instanciarlas directamente dentro de la clase.

### Diseño y Simplicidad

- **KISS (Keep It Simple, Stupid)**: La solución más simple que funcione. No añadas complejidad innecesaria ni abstracciones que no se necesiten hoy.
- **YAGNI (You Ain't Gonna Need It)**: No añadas funcionalidad, parámetros, o extensiones "por si acaso". Solo lo que el código actual requiere.
- **DRY (Don't Repeat Yourself)**: Cada pieza de conocimiento debe tener una representación única y no ambigua. Extrae lógica repetida a funciones o componentes reutilizables.
- **POLA (Principle of Least Astonishment)**: El código debe comportarse de la manera que el lector espera. Nombres sinceros, sin efectos secundarios ocultos, sin sorpresas.
- **Avoid Over-Engineering**: No crees jerarquías de clases, fábricas, o patrones innecesarios. Cada abstracción debe justificarse por una necesidad actual, no especulativa.

### Flujo y Estructura

- **Linear Code Flow**: El flujo debe ser lineal y fácil de seguir de arriba abajo, sin saltos mentales ni anidamiento profundo.
- **Flattening**: Aplana estructuras condicionales profundas. Cada nivel de anidamiento es un costo cognitivo.
- **Return Early**: Valida condiciones de error o casos borde al inicio de la función y retorna inmediatamente. Reduce el anidamiento del flujo principal.
- **Avoid Arrow Code / Pyramid of Doom**: Elimina la pirámide de condicionales anidados que dificulta la lectura y el mantenimiento.
- **Lookup Tables / Dictionary Mapping over Conditionals**: Reemplaza cadenas de `if/else if` o `switch` con tablas de búsqueda (mapas/diccionarios) cuando la condición seleccione comportamiento o datos.

### Calidad y Legibilidad

- **Meaningful Names / Same Language**: Nombres que revelen intención. Usa un mismo lenguaje ubicuo en todo el código (consistentes con el dominio del negocio).
- **Self-Descriptive Code**: El código debe explicarse por sí mismo. Minimiza la necesidad de comentarios; si necesitas un comentario para explicar qué hace el código, refactoriza.
- **Small Functions**: Funciones pequeñas (idealmente <= 15-20 líneas) que hacen una sola cosa y la hacen bien.
- **Step-Down Rule**: El código debe leerse como un libro: de arriba abajo. Cada función llama a funciones del siguiente nivel de abstracción.
- **Avoid Mental Mapping**: El código debe ser claro sin necesidad de notas mentales. No uses abreviaciones crípticas ni reasignes variables con nuevos significados.
- **Intent-Revealing Names**: El nombre debe revelar la intención, no la implementación. `calcularImpuesto()` / `calculateTax()` en lugar de `aplicarTasa()` / `applyRate()`.
- **Avoid Primitive Obsession**: No uses tipos primitivos (strings, números, diccionarios genéricos) para modelar conceptos de dominio. Envuélvelos en tipos de valor (Value Objects) como `Email`, `Dinero` / `Money`, `OrderId`. Si el lenguaje lo permite, usa tipos dedicados en lugar de tipos básicos.
- **Extract Method**: Extrae bloques de código con una responsabilidad clara a métodos con nombre descriptivo.
- **Avoid Magic Numbers/Strings**: Reemplaza valores literales (`1.16`, `1.08`, `10000`) con constantes con nombre o configuraciones.
- **Expressive Code (Intent-Revealing over Implementation)**: El código debe expresar QUÉ hace, no CÓMO lo hace internamente.
- **Declarative over Imperative**: Prefiere transformaciones declarativas (mapeo, filtrado, reducción) sobre bucles imperativos y mutación manual. Usa el equivalente idiomático del lenguaje (ej: `.map()` / list comprehensions / `Stream.map()`).

### Cohesión y Acoplamiento

- **SOC (Separation of Concerns)**: Separa responsabilidades en capas o módulos distintos: dominio, aplicación, infraestructura, presentación.
- **LoD (Law of Demeter / Principle of Least Knowledge)**: No navegues por cadenas de objetos (`a.b.c.d`). "Solo habla con tus amigos inmediatos."
- **Tell/Don't Ask**: Dile a los objetos qué hacer, no les preguntes por su estado para tomar decisiones externas.
- **Information Hiding / Encapsulation**: Oculta los detalles de implementación. Expón solo lo necesario a través de una interfaz limpia.
- **Explicit Dependencies**: Las dependencias deben ser explícitas y recibidas desde afuera (constructor, parámetros de función, o contenedor DI), no creadas dentro del método ni obtenidas de singletons o variables globales.
- **Value Objects**: Modela conceptos de dominio como objetos de valor inmutables con comportamiento encapsulado.
- **Replace Conditional with Polymorphism**: Cuando el comportamiento varía por tipo, usa polimorfismo en lugar de condicionales.
- **Interface Segregation / No Leaky Abstractions**: Las interfaces deben ser específicas al cliente que las consume. No expongas detalles de infraestructura en capas de dominio.
- **Avoid God Classes / Blob Objects**: Ninguna clase debe concentrar demasiadas responsabilidades. Divide y organiza.

### Flujo y Estado

- **Pure Functions**: Funciones que dependen solo de sus entradas y no producen efectos secundarios. Predecibles, testeables, sin estado mutable.
- **Immutability**: No reasignes variables ni mutes estructuras. Crea nuevas instancias con los cambios aplicados.
- **Avoid Side Effects**: Separa efectos secundarios (IO, persistencia, envío de emails) de la lógica pura de negocio.
- **CQS (Command-Query Separation)**: Los métodos deben ser comandos (cambian estado, no retornan datos útiles) o consultas (retornan datos, no cambian estado), no ambos.
- **Avoid Nulls / Null Object Pattern**: Evita retornar `null`. Usa tipos opcionales (`Maybe`, `Option`) o patrones de objeto nulo que cumplan con el contrato.
- **Guard Clauses / Preconditions / Fail Fast**: Valida precondiciones al inicio del método. Falla en el punto exacto donde ocurre el error, no más tarde.

### Mantenibilidad

- **Scout Rule**: Deja el código mejor de como lo encontraste. Cada refactorización es una oportunidad para mejorar.
- **Persistence Ignorance**: Las entidades de dominio no deben saber ni depender de cómo se persisten. El modelo de dominio debe ser ignorante de la infraestructura.
- **Avoid Slop Code / Dead Code**: Elimina código muerto, variables sin uso, imports no utilizados, comentarios obsoletos.
- **Pragmatic Error Handling**: Maneja errores de forma explícita y en el nivel adecuado de abstracción. No tragues excepciones silenciosamente.
- **Avoid Smell Code**: Identifica y elimina code smells (feature envy, shotgun surgery, long parameter list, etc.).
- **Testability as a First-Class Citizen**: Cada decisión de diseño debe considerar: "¿Cómo voy a probar esto?" Inyección de dependencias, interfaces, funciones puras.

---

## Formato de Respuesta Esperado

### 1. Análisis de Violaciones (por archivo)

Lista cada violación encontrada en TODOS los archivos de la carpeta, clasificada por principio e indicando el archivo, la línea o bloque específico, y por qué es problemático.

Formato sugerido:

| Archivo | Principio Violado | Línea(s) | Problema |
|---------|-------------------|----------|----------|
| `src/orders/OrderProcessor.[ext]` | SRP | clase completa | OrderProcessor tiene responsabilidades de cálculo, persistencia y notificación |
| `src/orders/OrderProcessor.[ext]` | Magic Numbers | 10, 12, 14 | 1.16, 1.08, 1.21 son tasas de impuesto hardcodeadas |
| `src/payments/PaymentController.[ext]` | Arrow Code | 25-40 | Anidamiento de 4 niveles en bloque de validación |
| ... | ... | ... | ... |

### 2. Refactorización Paso a Paso

Presenta la transformación en componentes o pasos lógicos. Cada paso debe incluir:

- **Código**: El nuevo componente (interfaz, clase, función, Value Object)
- **Explicación**: Qué principio(s) aplica y qué problema del código original resuelve
- **Antes/Después**: Comparación del cambio (puede ser textual o descriptiva)

### 3. Código Resultante Completo

Muestra la estructura completa y organizada del código refactorizado, indicando los archivos y su propósito dentro de la arquitectura limpia (capas de dominio, aplicación, e infraestructura).

### 4. Resumen de Principios Aplicados

Tabla que resume qué principios se aplicaron, dónde (archivo/clase) y brevemente cómo.

Formato sugerido:

| Principio | Dónde se Aplicó | Cómo |
|-----------|-----------------|------|
| DIP | OrderService | Dependencias inyectadas vía interfaces (constructor, parámetros de función, o contenedor DI) |
| OCP | TaxCalculator | Nuevas categorías de impuesto se agregan sin modificar la clase existente |
| ... | ... | ... |

---

## Notas Finales

- El código refactorizado debe ser funcionalmente equivalente al original.
- No añadas funcionalidad que no existía en el original (YAGNI).
- Si identificas múltiples formas de resolver un problema, menciona las alternativas con sus trade-offs, pero implementa solo una.
- El diseño final debe ser testeable: todas las dependencias deben poder reemplazarse por dobles de prueba (mocks, stubs, fakes) según el mecanismo idiomático del lenguaje (inyección de dependencias, parámetros de función, mocking de interfaces, etc.).
- Prioriza la claridad pedagógica: explica el "por qué" detrás de cada cambio. Un participante debe entender no solo el QUÉ, sino el POR QUÉ es mejor.
