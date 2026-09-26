import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '../../database/entities/cliente.entity';
import { TransaccionPuntos } from '../../database/entities/transaccion-puntos.entity';
import { Sesion } from '../../database/entities/sesion.entity';
import { Venta } from '../../database/entities/venta.entity';
import { Configuracion } from '../../database/entities/configuracion.entity';
import { CuentaController } from './controllers/cuenta.controller';
import { CuentaService } from './services/cuenta.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, TransaccionPuntos, Configuracion, Venta, Sesion])],
  controllers: [CuentaController],
  providers: [CuentaService],
})
export class CuentaModule {}
