import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Headers,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '@common/auth/public.decorator';
import { Roles } from '@common/auth/roles.decorator';
import { CurrentUser } from '@common/auth/current-user.decorator';
import type { AuthenticatedUser } from '@common/auth/jwt-payload.interface';
import { PedidosService } from '../services/pedidos.service';
import { DireccionesService } from '../services/direcciones.service';
import { CheckoutService } from '../services/checkout.service';
import { CreateDireccionDto } from '../dto/create-direccion.dto';
import { UpdateDireccionDto } from '../dto/update-direccion.dto';
import { CambiarEstadoPedidoDto } from '../dto/cambiar-estado.dto';
import { CheckoutDto } from '../dto/checkout.dto';

@ApiTags('pedidos')
@Controller()
export class PedidosController {
  constructor(
    private readonly pedidosService: PedidosService,
    private readonly direccionesService: DireccionesService,
    private readonly checkoutService: CheckoutService,
  ) {}

  @Roles('cliente')
  @Get('direcciones')
  listarDirecciones(@CurrentUser() user: AuthenticatedUser) {
    return this.direccionesService.listarDirecciones(user.id);
  }

  @Roles('cliente')
  @Post('direcciones')
  crearDireccion(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDireccionDto) {
    return this.direccionesService.crearDireccion(user.id, dto);
  }

  @Roles('cliente')
  @Patch('direcciones/:id')
  actualizarDireccion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDireccionDto,
  ) {
    return this.direccionesService.actualizarDireccion(user.id, id, dto);
  }

  @Roles('cliente')
  @Delete('direcciones/:id')
  eliminarDireccion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.direccionesService.eliminarDireccion(user.id, id);
  }

  @Roles('cliente')
  @Post('pedidos/checkout')
  iniciarCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.checkoutService.iniciarCheckout(user.id, dto);
  }

  @Roles('cliente')
  @Post('pedidos/confirmar-pago')
  confirmarPago(
    @CurrentUser() user: AuthenticatedUser,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    if (!paymentIntentId) {
      throw new BadRequestException('Falta paymentIntentId');
    }
    return this.checkoutService.confirmarPago(user.id, paymentIntentId);
  }

  // Rutas 'admin/...' antes de 'pedidos/:id' no chocan: prefijo distinto.
  @Roles('admin', 'cajero')
  @Get('admin/pedidos')
  listarPedidosAdmin(@Query('estado') estado: string | undefined, @Req() req: Request) {
    return this.pedidosService.listarPedidosAdmin(
      estado as Parameters<PedidosService['listarPedidosAdmin']>[0],
      this.baseUrl(req),
    );
  }

  @Roles('admin', 'cajero')
  @Get('admin/pedidos/:id')
  obtenerPedidoAdmin(@Param('id') id: string, @Req() req: Request) {
    return this.pedidosService.obtenerPedidoAdmin(id, this.baseUrl(req));
  }

  @Roles('admin', 'cajero')
  @Patch('admin/pedidos/:id/estado')
  cambiarEstado(@Param('id') id: string, @Body() dto: CambiarEstadoPedidoDto) {
    return this.pedidosService.cambiarEstado(id, dto.estado);
  }

  @Roles('cliente')
  @Get('pedidos')
  listarPedidos(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.pedidosService.listarPedidos(user.id, this.baseUrl(req));
  }

  @Roles('cliente')
  @Get('pedidos/:id')
  obtenerPedido(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.pedidosService.obtenerPedido(user.id, id, this.baseUrl(req));
  }

  // Stripe llama esta ruta directamente, sin JWT — la firma en el header
  // stripe-signature es la única verificación de autenticidad.
  @Public()
  @SkipThrottle()
  @Post('pedidos/webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') firma: string) {
    if (!req.rawBody) {
      throw new BadRequestException('Falta el cuerpo crudo de la petición');
    }
    await this.checkoutService.manejarWebhook(req.rawBody, firma);
    return { received: true };
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }
}
