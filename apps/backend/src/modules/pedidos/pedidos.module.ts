import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DireccionEntrega } from '../../database/entities/direccion-entrega.entity';
import { Carrito } from '../../database/entities/carrito.entity';
import { ItemCarrito } from '../../database/entities/item-carrito.entity';
import { Cliente } from '../../database/entities/cliente.entity';
import { PedidoLinea } from '../../database/entities/pedido-linea.entity';
import { Configuracion } from '../../database/entities/configuracion.entity';
import { PedidosController } from './controllers/pedidos.controller';
import { PedidosService } from './services/pedidos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DireccionEntrega,
      Carrito,
      ItemCarrito,
      Cliente,
      PedidoLinea,
      Configuracion,
    ]),
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
