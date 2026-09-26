import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuracion } from './entities/configuracion.entity';
import { ConfiguracionController } from './controllers/configuracion.controller';
import { ConfiguracionService } from './services/configuracion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Configuracion])],
  controllers: [ConfiguracionController],
  providers: [ConfiguracionService],
  exports: [ConfiguracionService],
})
export class ConfiguracionModule {}
