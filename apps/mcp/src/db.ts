import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


export interface Libro {
  id:           string;
  isbn:         string;
  titulo:       string;
  editorial_id: string;
  categoria_id: string;
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo: number;
  activo:       boolean;
}

export interface Autor {
  id:        string;
  nombre:    string;
  nacionalidad?: string;
}

export interface Editorial {
  id: string;
  nombre: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface LibroSinStock {
  isbn:              string;
  titulo:            string;
  editorial:         string;
  stock_actual:      number;
  stock_minimo:      number;
  unidades_faltantes: number;
}

export async function buscarEditorialPorNombre(nombre: string): Promise<Editorial | null> {
  const { rows } = await pool.query<Editorial>(
    `SELECT id, nombre FROM editorial WHERE LOWER(nombre) ILIKE LOWER($1) LIMIT 1`,
    [`%${nombre}%`]
  );
  return rows[0] || null;
}

export async function buscarCategoriaPorNombre(nombre: string): Promise<Categoria | null> {
  const { rows } = await pool.query<Categoria>(
    `SELECT id, nombre FROM categoria WHERE LOWER(nombre) ILIKE LOWER($1) LIMIT 1`,
    [`%${nombre}%`]
  );
  return rows[0] || null;
}

export async function buscarAutorPorNombre(nombre: string): Promise<Autor | null> {
  const { rows } = await pool.query<Autor>(
    `SELECT id, nombre, nacionalidad FROM autor WHERE LOWER(nombre) ILIKE LOWER($1) AND activo = true LIMIT 1`,
    [`%${nombre}%`]
  );
  return rows[0] || null;
}

export async function listarEditoriales(): Promise<Editorial[]> {
  const { rows } = await pool.query<Editorial>(
    `SELECT id, nombre FROM editorial WHERE activo = true ORDER BY nombre`
  );
  return rows;
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { rows } = await pool.query<Categoria>(
    `SELECT id, nombre FROM categoria WHERE activo = true ORDER BY nombre`
  );
  return rows;
}

export async function listarAutores(): Promise<Autor[]> {
  const { rows } = await pool.query<Autor>(
    `SELECT id, nombre, nacionalidad FROM autor WHERE activo = true ORDER BY nombre`
  );
  return rows;
}

export async function buscarAutores(nombre: string): Promise<Autor[]> {
  const { rows } = await pool.query<Autor>(
    `SELECT id, nombre, nacionalidad FROM autor 
     WHERE LOWER(nombre) ILIKE LOWER($1) AND activo = true 
     ORDER BY nombre`,
    [`%${nombre}%`]
  );
  return rows;
}

export async function getLibrosSinStock(): Promise<LibroSinStock[]> {
  const { rows } = await pool.query<LibroSinStock>(
    `SELECT isbn, titulo, editorial, stock_actual, stock_minimo,
            (stock_minimo - stock_actual) AS unidades_faltantes
     FROM alerta_stock_bajo
     ORDER BY stock_actual ASC`
  );
  return rows;
}

export interface NuevoLibro {
  isbn:         string;
  titulo:       string;
  editorial:    string;     
  categoria:    string;      
  precio_venta: number;
  precio_costo: number;
  stock_actual: number;
  stock_minimo?: number;
  autores?:     string[];   
}

export async function agregarLibro(datos: NuevoLibro): Promise<{ libro: Libro; autores_agregados: string[] }> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const editorialQuery = await client.query<Editorial>(
      `SELECT id, nombre FROM editorial WHERE LOWER(nombre) ILIKE LOWER($1) AND activo = true LIMIT 1`,
      [`%${datos.editorial}%`]
    );
    const editorial = editorialQuery.rows[0];

    if (!editorial) {
      throw new Error(
        `Editorial "${datos.editorial}" no encontrada. ` +
        `(solicita "listar_editoriales" para ver las disponibles)`
      );
    }

    const categoriaQuery = await client.query<Categoria>(
      `SELECT id, nombre FROM categoria WHERE LOWER(nombre) ILIKE LOWER($1) AND activo = true LIMIT 1`,
      [`%${datos.categoria}%`]
    );
    const categoria = categoriaQuery.rows[0];

    if (!categoria) {
      throw new Error(
        `Categoría "${datos.categoria}" no encontrada. ` +
        `(solicita "listar_categorias" para ver las disponibles)`
      );
    }

    const libroQuery = await client.query<Libro>(
      `INSERT INTO libro
         (isbn, titulo, editorial_id, categoria_id,
          precio_venta, precio_costo, stock_actual, stock_minimo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        datos.isbn,
        datos.titulo,
        editorial.id,
        categoria.id,
        datos.precio_venta,
        datos.precio_costo,
        datos.stock_actual,
        datos.stock_minimo || 5,
      ]
    );
    const libro = libroQuery.rows[0];

    const autores_agregados: string[] = [];
    if (datos.autores && datos.autores.length > 0) {
      for (const nombreAutor of datos.autores) {
        const autorQuery = await client.query<Autor>(
          `SELECT id, nombre FROM autor WHERE LOWER(nombre) ILIKE LOWER($1) AND activo = true LIMIT 1`,
          [`%${nombreAutor}%`]
        );
        const autor = autorQuery.rows[0];

        if (autor) {
          await client.query(
            `INSERT INTO libro_autor (libro_id, autor_id, rol) VALUES ($1, $2, $3)
             ON CONFLICT (libro_id, autor_id) DO NOTHING`,
            [libro.id, autor.id, "autor"]
          );
          autores_agregados.push(autor.nombre);
        }
      }
    }

    await client.query("COMMIT");
    return { libro, autores_agregados };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}