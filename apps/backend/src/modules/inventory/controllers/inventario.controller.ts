import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { InventarioService } from '../services/inventario.service';
import { CreateMovimientoInventarioDto } from '../dto/create-movimiento-inventario.dto';
import { QueryMovimientoDto } from '../dto/query-movimiento.dto';

@ApiTags('inventario')
@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Roles('admin')
  @Post('movimientos')
  registrarMovimiento(
    @Body() dto: CreateMovimientoInventarioDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventarioService.registrarMovimiento(dto, user.id);
  }

  @Roles('admin', 'cajero')
  @Get('movimientos')
  findAll(@Query() query: QueryMovimientoDto) {
    return this.inventarioService.findAll(query);
  }
}
