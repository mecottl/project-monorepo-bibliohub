import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ClientesService } from '../services/clientes.service';
import { QueryClienteDto } from '../dto/query-cliente.dto';
import { UpdateClienteDto } from '../dto/update-cliente.dto';

@ApiTags('clientes')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Roles('admin', 'cajero')
  @Get()
  findAll(@Query() query: QueryClienteDto) {
    return this.clientesService.findAll(query);
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
}
