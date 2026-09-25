import { Controller, Get, Post, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { CarritoService } from '../services/carrito.service';
import { AgregarItemCarritoDto } from '../dto/agregar-item-carrito.dto';
import { ActualizarItemCarritoDto } from '../dto/actualizar-item-carrito.dto';

@ApiTags('carrito')
@Controller('carrito')
@Roles('cliente')
export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  @Get()
  obtener(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.carritoService.obtenerCarrito(user.id, this.baseUrl(req));
  }

  @Post('items')
  agregarItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AgregarItemCarritoDto,
    @Req() req: Request,
  ) {
    return this.carritoService.agregarItem(user.id, dto, this.baseUrl(req));
  }

  @Patch('items/:libroId')
  actualizarItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('libroId') libroId: string,
    @Body() dto: ActualizarItemCarritoDto,
    @Req() req: Request,
  ) {
    return this.carritoService.actualizarItem(user.id, libroId, dto.cantidad, this.baseUrl(req));
  }

  @Delete('items/:libroId')
  quitarItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('libroId') libroId: string,
    @Req() req: Request,
  ) {
    return this.carritoService.quitarItem(user.id, libroId, this.baseUrl(req));
  }

  @Delete()
  vaciar(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.carritoService.vaciarCarrito(user.id, this.baseUrl(req));
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }
}
