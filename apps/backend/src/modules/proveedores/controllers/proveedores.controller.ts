import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/auth/roles.decorator';
import { CurrentUser } from '@common/auth/current-user.decorator';
import type { AuthenticatedUser } from '@common/auth/jwt-payload.interface';
import { ProveedoresService } from '../services/proveedores.service';
import { CreateProveedorDto } from '../dto/create-proveedor.dto';
import { UpdateProveedorDto } from '../dto/update-proveedor.dto';
import { CreatePedidoCompraDto } from '../dto/create-pedido-compra.dto';
import { RecibirPedidoCompraDto } from '../dto/recibir-pedido-compra.dto';
import { QueryPedidoCompraDto } from '../dto/query-pedido-compra.dto';

@ApiTags('proveedores')
@Controller()
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Roles('admin')
  @Get('proveedores')
  findAllProveedores() {
    return this.proveedoresService.findAllProveedores();
  }

  @Roles('admin')
  @Get('proveedores/:id')
  findOneProveedor(@Param('id') id: string) {
    return this.proveedoresService.findOneProveedor(id);
  }

  @Roles('admin')
  @Post('proveedores')
  createProveedor(@Body() dto: CreateProveedorDto) {
    return this.proveedoresService.createProveedor(dto);
  }

  @Roles('admin')
  @Patch('proveedores/:id')
  updateProveedor(@Param('id') id: string, @Body() dto: UpdateProveedorDto) {
    return this.proveedoresService.updateProveedor(id, dto);
  }

  @Roles('admin')
  @Delete('proveedores/:id')
  removeProveedor(@Param('id') id: string) {
    return this.proveedoresService.removeProveedor(id);
  }

  @Roles('admin')
  @Get('pedidos-compra')
  findAllPedidos(@Query() query: QueryPedidoCompraDto) {
    return this.proveedoresService.findAllPedidos(query);
  }

  @Roles('admin')
  @Get('pedidos-compra/:id')
  findOnePedido(@Param('id') id: string) {
    return this.proveedoresService.findOnePedido(id);
  }

  @Roles('admin')
  @Post('pedidos-compra')
  crearPedido(@Body() dto: CreatePedidoCompraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.proveedoresService.crearPedido(dto, user.id);
  }

  @Roles('admin')
  @Post('pedidos-compra/:id/recepcion')
  recibirPedido(@Param('id') id: string, @Body() dto: RecibirPedidoCompraDto) {
    return this.proveedoresService.recibirPedido(id, dto);
  }

  @Roles('admin')
  @Post('pedidos-compra/:id/cancelar')
  cancelarPedido(@Param('id') id: string) {
    return this.proveedoresService.cancelarPedido(id);
  }
}
