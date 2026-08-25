import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { extname, join } from 'path';
import { StorageService } from './storage.interface';

export const PORTADAS_DIR = join(process.cwd(), 'uploads', 'portadas');

@Injectable()
export class LocalStorageService implements StorageService {
  async guardar(archivo: Express.Multer.File): Promise<string> {
    await fs.mkdir(PORTADAS_DIR, { recursive: true });

    const key = `${randomUUID()}${extname(archivo.originalname)}`;
    await fs.writeFile(join(PORTADAS_DIR, key), archivo.buffer);

    return key;
  }

  async eliminar(key: string): Promise<void> {
    await fs.rm(join(PORTADAS_DIR, key), { force: true });
  }
}
