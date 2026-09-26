import { StripeModule } from '@infra/stripe/stripe.module';
import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { ClientesModule } from '@modules/clientes/clientes.module';
import { VentasModule } from '@modules/ventas/ventas.module';
import { Sesion } from '@modules/auth/entities/sesion.entity';
import { CuentaController } from './controllers/cuenta.controller';
import { CuentaService } from './services/cuenta.service';

@Module({
  imports: [
    ConfiguracionModule,
    StripeModule,
    ClientesModule,
    VentasModule,
    TypeOrmModule.forFeature([Cliente, Sesion]),
  ],
  controllers: [CuentaController],
  providers: [CuentaService],
})
export class CuentaModule {}
