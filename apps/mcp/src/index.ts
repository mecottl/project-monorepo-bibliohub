import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getLibrosSinStock,
  agregarLibro,
  listarEditoriales,
  listarCategorias,
  listarAutores,
  buscarAutores,
  pool,
  type NuevoLibro,
} from "./db.js";

const server = new McpServer({ name: "mcp-libreria", version: "1.0.0" });

// HERRAMIENTA — agregar_libro 
server.registerTool(
  "agregar_libro",
  {
    title: "Agregar Libro",
    description:
      "Inserta un libro nuevo en la base de datos con sus autores asociados. " +
      "Solo proporciona nombres de editorial, categoría y autores.",
    inputSchema: {
      isbn:         z.string().describe("ISBN del libro"),
      titulo:       z.string().describe("Título completo del libro"),
      editorial:    z.string().describe("Nombre de la editorial (ej: Alfaguara)"),
      categoria:    z.string().describe("Nombre de la categoría (ej: Terror)"),
      precio_venta: z.number().positive().describe("Precio al público en MXN"),
      precio_costo: z.number().positive().describe("Precio de adquisición en MXN"),
      stock_actual: z.number().int().min(0).describe("Unidades iniciales en inventario"),
      stock_minimo: z.number().int().min(0).optional().describe("Stock mínimo (default 5)"),
      autores:      z.string().array().optional().describe("Nombres de autores (ej: ['Stephen King'])"),
    },
  },
  async (datos) => {
    try {
      const resultado = await agregarLibro(datos as NuevoLibro);
      const autoresTexto = resultado.autores_agregados.length > 0
        ? `\n   Autores: ${resultado.autores_agregados.join(", ")}`
        : `\n   ⚠️  No se encontraron autores`;

      return {
        content: [{
          type: "text",
          text:
            `✅ Libro insertado correctamente.\n` +
            `   ISBN:         ${resultado.libro.isbn}\n` +
            `   Título:       ${resultado.libro.titulo}\n` +
            `   Precio venta: $${resultado.libro.precio_venta} MXN\n` +
            `   Stock:        ${resultado.libro.stock_actual} unidades` +
            autoresTexto,
        }],
      };
    } catch (err: unknown) {
      return {
        content: [{ type: "text", text: `❌ Error: ${(err as Error).message}` }],
        isError: true,
      };
    }
  }
);

// HERRAMIENTA — listar_autores 
server.registerTool(
  "listar_autores",
  {
    title: "Listar Autores",
    description: "Obtiene la lista de todos los autores registrados en la BD.",
    inputSchema: {},
  },
  async () => {
    const autores = await listarAutores();
    const texto = autores
      .map((a) => `  • ${a.nombre}${a.nacionalidad ? ` (${a.nacionalidad})` : ""}`)
      .join("\n");
    return {
      content: [{
        type: "text",
        text: `✍️  Autores disponibles (${autores.length}):\n\n${texto}`,
      }],
    };
  }
);

// HERRAMIENTA — buscar_autores 
server.registerTool(
  "buscar_autores",
  {
    title: "Buscar Autores",
    description: "Busca autores por nombre en la base de datos.",
    inputSchema: {
      nombre: z.string().min(2).describe("Nombre o parte del nombre del autor a buscar"),
    },
  },
  async ({ nombre }) => {
    const autores = await buscarAutores(nombre);
    if (autores.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No se encontraron autores con el nombre "${nombre}".`,
        }],
      };
    }

    const texto = autores
      .map((a) => `  • ${a.nombre}${a.nacionalidad ? ` (${a.nacionalidad})` : ""}`)
      .join("\n");
    return {
      content: [{
        type: "text",
        text: `✍️  Autores encontrados:\n\n${texto}`,
      }],
    };
  }
);

// HERRAMIENTA — listar_editoriales 
server.registerTool(
  "listar_editoriales",
  {
    title: "Listar Editoriales",
    description: "Obtiene la lista de todas las editoriales registradas en la BD.",
    inputSchema: {},
  },
  async () => {
    const editoriales = await listarEditoriales();
    const texto = editoriales
      .map((e) => `  • ${e.nombre}`)
      .join("\n");
    return {
      content: [{
        type: "text",
        text: `📚 Editoriales disponibles (${editoriales.length}):\n\n${texto}`,
      }],
    };
  }
);

// HERRAMIENTA — listar_categorias 
server.registerTool(
  "listar_categorias",
  {
    title: "Listar Categorías",
    description: "Obtiene la lista de todas las categorías de libros registradas en la BD.",
    inputSchema: {},
  },
  async () => {
    const categorias = await listarCategorias();
    const texto = categorias
      .map((c) => `  • ${c.nombre}`)
      .join("\n");
    return {
      content: [{
        type: "text",
        text: `📂 Categorías disponibles (${categorias.length}):\n\n${texto}`,
      }],
    };
  }
);

// RECURSO — libros sin stock 
server.registerResource(
  "sin-stock",
  "libreria://sin-stock",
  {
    title: "Libros Sin Stock",
    description:
      "Lista de libros con stock_actual = 0 obtenida de la vista alerta_stock_bajo en PostgreSQL.",
    mimeType: "application/json",
  },
  async () => {
    const libros = await getLibrosSinStock();
    return {
      contents: [{
        uri: "libreria://sin-stock",
        mimeType: "application/json",
        text: JSON.stringify({
          total:        libros.length,
          generado_en:  new Date().toISOString(),
          libros,
        }, null, 2),
      }],
    };
  }
);

// PROMPT — generar_reporte_stock
server.registerPrompt(
  "generar_reporte_stock",
  {
    title: "Generar Reporte de Stock",
    description:
      "Genera un análisis completo del inventario: libros agotados, " +
      "stock bajo, categorías críticas y recomendaciones de acción.",
    argsSchema: {
      incluir_acciones: z
        .enum(["si", "no"])
        .default("si")
        .describe("Si incluir recomendaciones de compra"),
    },
  },
  ({ incluir_acciones }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text:
          `Eres un analista de inventario para una librería.\n` +
          `Lee el recurso \`libreria://sin-stock\` para ver el estado crítico del inventario.\n\n` +
          `Genera un reporte ejecutivo que incluya:\n` +
          `1. Resumen: cantidad total de libros agotados y % del catálogo afectado\n` +
          `2. Libros más críticos (los que más urgentemente necesitan reposición)\n` +
          `3. Análisis por categoría (si hay patrones de categorías desabastecidas)\n` +
          (incluir_acciones === "si"
            ? `4. Recomendaciones de acción inmediata (cuáles reponer primero, urgencia)\n`
            : ``) +
          `\nTono: profesional, conciso, enfocado en decisiones ejecutivas.`,
      },
    }],
  })
);

// PROMPT — generar_libros_de_autor 
server.registerPrompt(
  "generar_libros_de_autor",
  {
    title: "Generar Libros de Autor",
    description:
      "Busca un autor por nombre, y luego genera varios libros suyos " +
      "usando editoriales y categorías automáticamente de la BD.",
    argsSchema: {
      nombre_autor: z.string().describe("Nombre del autor a buscar (ej: Stephen King)"),
      cantidad_libros: z.string().describe("Cuántos libros crear del autor (ej: '5')"),
      stock_bajo: z
        .string()
        .describe("Cuántos libros deben tener stock bajo (ej: '2' de los 5)"),
    },
  },
  ({ nombre_autor, cantidad_libros, stock_bajo }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text:
          `Eres un asistente de catálogo para una librería.\n\n` +
          `Tu tarea:\n` +
          `1. Busca al autor "${nombre_autor}" usando la herramienta "buscar_autores"\n` +
          `2. Si lo encuentras, obtén las listas de editoriales y categorías disponibles\n` +
          `3. Crea ${cantidad_libros} libros diferentes de "${nombre_autor}" usando:\n` +
          `   - Editoriales reales de la BD (varía entre ellas)\n` +
          `   - Categorías variadas de la BD\n` +
          `   - ISBNs ficticios pero válidos (formato 978-XXXXXXXXXX)\n` +
          `   - Precios realistas (150-500 MXN)\n` +
          `4. De los ${cantidad_libros} libros:\n` +
          `   - ${stock_bajo} deben tener stock_actual por debajo de stock_minimo\n` +
          `   - Los otros tendrán stock normal\n\n` +
          `Usa la herramienta "agregar_libro" para insertar cada uno.\n` +
          `Si el autor no existe, sugiere otros autores similares disponibles.`,
      },
    }],
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
process.stderr.write("mcp-libreria conectado a PostgreSQL\n");

process.on("SIGINT",  async () => { await pool.end(); process.exit(0); });
process.on("SIGTERM", async () => { await pool.end(); process.exit(0); });