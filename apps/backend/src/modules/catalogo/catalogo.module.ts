import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../../database/entities/libro.entity';
import { Autor } from '../../database/entities/autor.entity';
import { Editorial } from '../../database/entities/editorial.entity';
import { Categoria } from '../../database/entities/categoria.entity';
import { CatalogoController } from './controllers/catalogo.controller';
import { CatalogoService } from './services/catalogo.service';
import { STORAGE_SERVICE, StorageService } from './storage/storage.interface';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Libro, Autor, Editorial, Categoria])],
  controllers: [CatalogoController],
  providers: [
    CatalogoService,
    {
      provide: STORAGE_SERVICE,
      useFactory: (): StorageService => {
        const driver = process.env.STORAGE_DRIVER ?? 'local';
        switch (driver) {
          // Cuando exista S3StorageService, se agrega aquí: case 's3': return new S3StorageService();
          case 'local':
          default:
            return new LocalStorageService();
        }
      },
    },
  ],
})
export class CatalogoModule {}
