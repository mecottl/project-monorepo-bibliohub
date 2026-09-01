import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ClientesService } from '../services/clientes.service';
import { QueryClienteDto } from '../dto/query-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';
import { CreateClienteDto } from '../dto/create-cliente.dto';
import { AjustePuntosClienteDto } from '../dto/ajuste-puntos-cliente.dto';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Roles('admin', 'cajero')
  @Get()
  findAll(@Query() query: QueryClienteDto) {
    return this.clientesService.findAll(query);
  }

  @Roles('admin')
  @Post()
  crear(@Body() dto: CreateClienteDto) {
    return this.clientesService.crear(dto);
  }

  @Roles('admin', 'cajero')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clientesService.findOne(id);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.clientesService.update(id, dto);
  }

  @Roles('admin')
  @Post(':id/ajuste-puntos')
  ajustarPuntos(@Param('id') id: string, @Body() dto: AjustePuntosClienteDto) {
    return this.clientesService.ajustarPuntos(id, dto);
  }
}
