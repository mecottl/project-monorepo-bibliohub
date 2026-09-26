import { BitacoraModule } from '@modules/bitacora/bitacora.module';
import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './entities/venta.entity';
import { DetalleVenta } from './entities/detalle-venta.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { VentasController } from './controllers/ventas.controller';
import { VentasService } from './services/ventas.service';
import { ClientesModule } from '@modules/clientes/clientes.module';

@Module({
  imports: [
    BitacoraModule,
    ConfiguracionModule,
    TypeOrmModule.forFeature([Venta, DetalleVenta, Libro]),
    ClientesModule,
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
