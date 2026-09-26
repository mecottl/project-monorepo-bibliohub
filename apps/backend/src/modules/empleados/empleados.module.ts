import { BitacoraModule } from '@modules/bitacora/bitacora.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from '@modules/auth/entities/sesion.entity';
import { Empleado } from './entities/empleado.entity';
import { EmpleadosController } from './controllers/empleados.controller';
import { EmpleadosService } from './services/empleados.service';

@Module({
  imports: [BitacoraModule, TypeOrmModule.forFeature([Empleado, Sesion])],
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
})
export class EmpleadosModule {}
