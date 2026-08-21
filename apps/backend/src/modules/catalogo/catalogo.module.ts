import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../../database/entities/libro.entity';
import { Autor } from '../../database/entities/autor.entity';
import { Editorial } from '../../database/entities/editorial.entity';
import { Categoria } from '../../database/entities/categoria.entity';
import { CatalogoController } from './controllers/catalogo.controller';
import { CatalogoService } from './services/catalogo.service';

@Module({
  imports: [TypeOrmModule.forFeature([Libro, Autor, Editorial, Categoria])],
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}
