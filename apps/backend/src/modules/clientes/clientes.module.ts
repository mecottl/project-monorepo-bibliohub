import { BitacoraModule } from '@modules/bitacora/bitacora.module';
import { ConfiguracionModule } from '@modules/configuracion/configuracion.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './entities/cliente.entity';
import { TransaccionPuntos } from './entities/transaccion-puntos.entity';
import { ClientesController } from './controllers/clientes.controller';
import { ClientesService } from './services/clientes.service';

@Module({
  imports: [
    BitacoraModule,
    ConfiguracionModule,
    TypeOrmModule.forFeature([Cliente, TransaccionPuntos]),
  ],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
