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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { PedidosService } from '../services/pedidos.service';
import { CreateDireccionDto } from '../dto/create-direccion.dto';
import { UpdateDireccionDto } from '../dto/update-direccion.dto';
import { CheckoutDto } from '../dto/checkout.dto';

@ApiTags('pedidos')
@Controller()
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Roles('cliente')
  @Get('direcciones')
  listarDirecciones(@CurrentUser() user: AuthenticatedUser) {
    return this.pedidosService.listarDirecciones(user.id);
  }

  @Roles('cliente')
  @Post('direcciones')
  crearDireccion(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDireccionDto) {
    return this.pedidosService.crearDireccion(user.id, dto);
  }

  @Roles('cliente')
  @Patch('direcciones/:id')
  actualizarDireccion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDireccionDto,
  ) {
    return this.pedidosService.actualizarDireccion(user.id, id, dto);
  }

  @Roles('cliente')
  @Delete('direcciones/:id')
  eliminarDireccion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.pedidosService.eliminarDireccion(user.id, id);
  }

  @Roles('cliente')
  @Post('pedidos/checkout')
  iniciarCheckout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.pedidosService.iniciarCheckout(user.id, dto);
  }

  @Roles('cliente')
  @Post('pedidos/confirmar-pago')
  confirmarPago(@CurrentUser() user: AuthenticatedUser, @Body('paymentIntentId') paymentIntentId: string) {
    if (!paymentIntentId) {
      throw new BadRequestException('Falta paymentIntentId');
    }
    return this.pedidosService.confirmarPago(user.id, paymentIntentId);
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
    await this.pedidosService.manejarWebhook(req.rawBody, firma);
    return { received: true };
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }
}
