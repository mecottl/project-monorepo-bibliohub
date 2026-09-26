import { BitacoraModule } from '@modules/bitacora/bitacora.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from './entities/libro.entity';
import { Autor } from './entities/autor.entity';
import { Editorial } from './entities/editorial.entity';
import { Categoria } from './entities/categoria.entity';
import { CatalogoController } from './controllers/catalogo.controller';
import { LibrosService } from './services/libros.service';
import { AutoresEditorialesService } from './services/autores-editoriales.service';
import { CategoriasService } from './services/categorias.service';
import { STORAGE_SERVICE, StorageService } from '@infra/storage/storage.interface';
import { LocalStorageService } from '@infra/storage/local-storage.service';

@Module({
  imports: [BitacoraModule, TypeOrmModule.forFeature([Libro, Autor, Editorial, Categoria])],
  controllers: [CatalogoController],
  providers: [
    LibrosService,
    AutoresEditorialesService,
    CategoriasService,
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
