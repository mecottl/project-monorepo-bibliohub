import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Libro } from '../../database/entities/libro.entity';
import { MovimientoInventario } from '../../database/entities/movimiento-inventario.entity';
import { InventarioController } from './controllers/inventario.controller';
import { InventarioService } from './services/inventario.service';

@Module({
  imports: [TypeOrmModule.forFeature([Libro, MovimientoInventario])],
  controllers: [InventarioController],
  providers: [InventarioService],
})
export class InventarioModule {}
