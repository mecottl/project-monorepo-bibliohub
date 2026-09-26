import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/auth/roles.decorator';
import { ConfiguracionService } from '../services/configuracion.service';
import { UpdateConfiguracionDto } from '../dto/update-configuracion.dto';

@ApiTags('configuracion')
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracionService: ConfiguracionService) {}

  @Roles('admin')
  @Get()
  findAll() {
    return this.configuracionService.findAll();
  }

  @Roles('admin')
  @Patch(':clave')
  update(@Param('clave') clave: string, @Body() dto: UpdateConfiguracionDto) {
    return this.configuracionService.update(clave, dto.valor);
  }
}
