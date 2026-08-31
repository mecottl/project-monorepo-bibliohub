// Script de mantenimiento: rellena portadas de libros sin imagen usando la
// API pública y gratuita de Open Library Covers, buscando por ISBN.
// Uso: ADMIN_USUARIO=... ADMIN_PASSWORD=... node apps/backend/scripts/rellenar-portadas.mjs

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:2077/api';
const ADMIN_USUARIO = process.env.ADMIN_USUARIO;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const MIN_COVER_BYTES = 1000; // Open Library devuelve un placeholder minúsculo si no hay portada
const DELAY_MS = 250;

if (!ADMIN_USUARIO || !ADMIN_PASSWORD) {
  console.error('Faltan las variables de entorno ADMIN_USUARIO y ADMIN_PASSWORD.');
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function login() {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // El endpoint de login autentica por "identificador" (usuario del
    // empleado o teléfono del cliente), no por email.
    body: JSON.stringify({ identificador: ADMIN_USUARIO, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`No se pudo iniciar sesión (${res.status}). Revisa ADMIN_USUARIO/ADMIN_PASSWORD.`);
  }
  const data = await res.json();
  return data.accessToken ?? data.token;
}

async function obtenerTodosLosLibros(token) {
  const libros = [];
  let page = 1;
  const limit = 50;

  while (true) {
    const res = await fetch(`${API_BASE_URL}/catalogo/libros?page=${page}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Error al listar libros (${res.status}) en página ${page}.`);
    }
    const data = await res.json();
    libros.push(...data.data);

    const totalPaginas = Math.ceil(data.total / limit);
    if (page >= totalPaginas) break;
    page += 1;
  }

  return libros;
}

async function descargarPortadaOpenLibrary(isbn) {
  const url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < MIN_COVER_BYTES) {
    return null; // Era el placeholder de "sin portada" de Open Library
  }
  return buffer;
}

async function subirPortada(token, libroId, buffer) {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'image/jpeg' });
  formData.append('archivo', blob, `${libroId}.jpg`);

  const res = await fetch(`${API_BASE_URL}/catalogo/libros/${libroId}/portada`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Error al subir portada (${res.status})`);
  }
}

async function main() {
  console.log('Iniciando sesión…');
  const token = await login();

  console.log('Obteniendo catálogo completo…');
  const libros = await obtenerTodosLosLibros(token);
  const sinPortada = libros.filter((libro) => !libro.imagenUrl);

  console.log(`${libros.length} libros en total, ${sinPortada.length} sin portada.`);

  let completados = 0;
  let sinCoverDisponible = 0;
  let fallidos = 0;

  for (const libro of sinPortada) {
    try {
      const buffer = await descargarPortadaOpenLibrary(libro.isbn);
      if (!buffer) {
        console.log(`—  Sin portada disponible: "${libro.titulo}" (${libro.isbn})`);
        sinCoverDisponible += 1;
      } else {
        await subirPortada(token, libro.id, buffer);
        console.log(`✓  Portada agregada: "${libro.titulo}" (${libro.isbn})`);
        completados += 1;
      }
    } catch (error) {
      console.error(`✗  Falló "${libro.titulo}" (${libro.isbn}):`, error.message);
      fallidos += 1;
    }
    await sleep(DELAY_MS);
  }

  console.log('\n--- Resumen ---');
  console.log(`Completados:            ${completados}`);
  console.log(`Sin portada en Open Library: ${sinCoverDisponible}`);
  console.log(`Fallidos:               ${fallidos}`);
}

main().catch((error) => {
  console.error('Error fatal:', error.message);
  process.exit(1);
});
