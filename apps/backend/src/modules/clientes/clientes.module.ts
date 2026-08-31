import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from '../../database/entities/cliente.entity';
import { TransaccionPuntos } from '../../database/entities/transaccion-puntos.entity';
import { ClientesController } from './controllers/clientes.controller';
import { ClientesService } from './services/clientes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente, TransaccionPuntos])],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
