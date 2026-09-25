// Con `useDefineForClassFields` (activo por defecto desde target ES2022+, ver
// tsconfig.json), un DTO con campos opcionales sin inicializar (`nombre?: string`)
// crea esas propiedades en cada instancia con valor `undefined` — un
// `Object.assign(entidad, dto)` directo entonces SOBRESCRIBE los campos que el
// cliente no envió, borrándolos de la respuesta (aunque TypeORM no los persista
// en la fila real). Este helper solo copia las propiedades que sí vinieron con
// un valor.
export function asignarDefinidos<T extends object>(destino: T, origen: Partial<T>): T {
  for (const clave of Object.keys(origen) as (keyof T)[]) {
    if (origen[clave] !== undefined) {
      destino[clave] = origen[clave] as T[keyof T];
    }
  }
  return destino;
}
