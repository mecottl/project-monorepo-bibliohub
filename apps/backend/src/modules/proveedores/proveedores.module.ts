import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { PedidoCompra } from './entities/pedido-compra.entity';
import { DetallePedidoCompra } from './entities/detalle-pedido-compra.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';
import { ProveedoresController } from './controllers/proveedores.controller';
import { ProveedoresService } from './services/proveedores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor, PedidoCompra, DetallePedidoCompra, Libro])],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
})
export class ProveedoresModule {}
