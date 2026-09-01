import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { VentasService } from '../services/ventas.service';
import { CreateVentaDto } from '../dto/create-venta.dto';
import { QueryVentaDto } from '../dto/query-venta.dto';

@ApiTags('ventas')
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Roles('admin', 'cajero')
  @Post()
  crear(@Body() dto: CreateVentaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ventasService.crear(dto, user.id);
  }

  @Roles('admin', 'cajero')
  @Get()
  findAll(@Query() query: QueryVentaDto) {
    return this.ventasService.findAll(query);
  }

  @Roles('admin', 'cajero')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ventasService.findOne(id);
  }

  @Roles('admin')
  @Post(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.ventasService.cancelar(id);
  }
}
