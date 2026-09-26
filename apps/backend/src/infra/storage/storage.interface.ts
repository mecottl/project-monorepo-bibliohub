export interface StorageService {
  /** Guarda el archivo y devuelve la key con la que se puede recuperar/eliminar después. */
  guardar(archivo: Express.Multer.File): Promise<string>;
  eliminar(key: string): Promise<void>;
}

export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');
