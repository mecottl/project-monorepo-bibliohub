import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrito } from './entities/carrito.entity';
import { ItemCarrito } from './entities/item-carrito.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { CarritoController } from './controllers/carrito.controller';
import { CarritoService } from './services/carrito.service';

@Module({
  imports: [TypeOrmModule.forFeature([Carrito, ItemCarrito, Libro])],
  controllers: [CarritoController],
  providers: [CarritoService],
})
export class CarritoModule {}
