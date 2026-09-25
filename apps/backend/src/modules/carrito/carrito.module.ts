import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carrito } from '../../database/entities/carrito.entity';
import { ItemCarrito } from '../../database/entities/item-carrito.entity';
import { Libro } from '../../database/entities/libro.entity';
import { CarritoController } from './controllers/carrito.controller';
import { CarritoService } from './services/carrito.service';

@Module({
  imports: [TypeOrmModule.forFeature([Carrito, ItemCarrito, Libro])],
  controllers: [CarritoController],
  providers: [CarritoService],
})
export class CarritoModule {}
