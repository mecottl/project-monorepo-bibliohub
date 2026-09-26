import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from '../../database/entities/sesion.entity';
import { Empleado } from '../../database/entities/empleado.entity';
import { EmpleadosController } from './controllers/empleados.controller';
import { EmpleadosService } from './services/empleados.service';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, Sesion])],
  controllers: [EmpleadosController],
  providers: [EmpleadosService],
})
export class EmpleadosModule {}
