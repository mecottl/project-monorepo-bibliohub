import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from '../../database/entities/proveedor.entity';
import { PedidoCompra } from '../../database/entities/pedido-compra.entity';
import { DetallePedidoCompra } from '../../database/entities/detalle-pedido-compra.entity';
import { Libro } from '../../database/entities/libro.entity';
import { ProveedoresController } from './controllers/proveedores.controller';
import { ProveedoresService } from './services/proveedores.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proveedor, PedidoCompra, DetallePedidoCompra, Libro]),
  ],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}
