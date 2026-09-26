import { StripeModule } from '@infra/stripe/stripe.module';
import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DireccionEntrega } from './entities/direccion-entrega.entity';
import { Carrito } from '@modules/carrito/entities/carrito.entity';
import { ItemCarrito } from '@modules/carrito/entities/item-carrito.entity';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { PedidoLinea } from './entities/pedido-linea.entity';
import { PedidosController } from './controllers/pedidos.controller';
import { PedidosService } from './services/pedidos.service';

@Module({
  imports: [
    ConfiguracionModule,
    StripeModule,
    TypeOrmModule.forFeature([
      DireccionEntrega,
      Carrito,
      ItemCarrito,
      Cliente,
      PedidoLinea,
    ]),
  ],
  controllers: [PedidosController],
  providers: [PedidosService],
})
export class PedidosModule {}
