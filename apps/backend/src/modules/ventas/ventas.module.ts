import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from '../../database/entities/venta.entity';
import { DetalleVenta } from '../../database/entities/detalle-venta.entity';
import { Libro } from '../../database/entities/libro.entity';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, DetalleVenta, Libro]),
    ClientesModule,
  ],
  controllers: [VentasController],
  providers: [VentasService],
})
export class VentasModule {}
