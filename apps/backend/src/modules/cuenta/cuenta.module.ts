import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '@modules/clientes/entities/cliente.entity';
import { TransaccionPuntos } from '@modules/clientes/entities/transaccion-puntos.entity';
import { Sesion } from '@modules/auth/entities/sesion.entity';
import { Venta } from '@modules/ventas/entities/venta.entity';
import { CuentaController } from './controllers/cuenta.controller';
import { CuentaService } from './services/cuenta.service';

@Module({
  imports: [
    ConfiguracionModule,TypeOrmModule.forFeature([Cliente, TransaccionPuntos, Venta, Sesion])],
  controllers: [CuentaController],
  providers: [CuentaService],
})
export class CuentaModule {}
