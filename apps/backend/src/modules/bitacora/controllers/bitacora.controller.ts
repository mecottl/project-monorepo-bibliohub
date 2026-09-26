import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/auth/roles.decorator';
import { QueryBitacoraDto } from '../dto/query-bitacora.dto';
import { BitacoraService } from '../services/bitacora.service';

// Solo lectura: la bitácora no se edita ni se borra desde la API.
@ApiTags('bitacora')
@Controller('bitacora')
export class BitacoraController {
  constructor(private readonly bitacoraService: BitacoraService) {}

  @Roles('admin')
  @Get()
  listar(@Query() query: QueryBitacoraDto) {
    return this.bitacoraService.listar(query);
  }

  @Roles('admin')
  @Get('acciones')
  acciones() {
    return this.bitacoraService.acciones();
  }
}
