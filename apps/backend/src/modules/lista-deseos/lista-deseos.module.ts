import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListaDeseos } from './entities/lista-deseos.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { ListaDeseosController } from './controllers/lista-deseos.controller';
import { ListaDeseosService } from './services/lista-deseos.service';

@Module({
  imports: [TypeOrmModule.forFeature([ListaDeseos, Libro])],
  controllers: [ListaDeseosController],
  providers: [ListaDeseosService],
})
export class ListaDeseosModule {}
