import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from '../../database/entities/venta.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Venta, DetalleVenta])],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
