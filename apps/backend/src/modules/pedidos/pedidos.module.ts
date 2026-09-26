import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DireccionEntrega } from './entities/direccion-entrega.entity';
import { Carrito } from '@modules/carrito/entities/carrito.entity';
import { ItemCarrito } from '@modules/carrito/entities/item-carrito.entity';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { PedidoLinea } from './entities/pedido-linea.entity';
import { Configuracion } from '@modules/configuracion/entities/configuracion.entity';
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
