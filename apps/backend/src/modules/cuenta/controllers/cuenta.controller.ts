import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/auth/roles.decorator';
import { CurrentUser } from '@common/auth/current-user.decorator';
import type { AuthenticatedUser } from '@common/auth/jwt-payload.interface';
import { hashDeToken } from '@common/sesiones';
import { CuentaService } from '../services/cuenta.service';
import { CambiarPasswordClienteDto, UpdatePerfilDto } from '../dto/cuenta.dto';

// Todo lo de "Mi cuenta" es del cliente autenticado: el id sale siempre del
// JWT, nunca de la URL, así que nadie puede tocar la cuenta de otro.
@ApiTags('cuenta')
@Controller('cuenta')
@Roles('cliente')
export class CuentaController {
  constructor(private readonly cuentaService: CuentaService) {}

  @Get('perfil')
  perfil(@CurrentUser() user: AuthenticatedUser) {
    return this.cuentaService.obtenerPerfil(user.id);
  }

  @Patch('perfil')
  actualizarPerfil(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePerfilDto) {
    return this.cuentaService.actualizarPerfil(user.id, dto);
  }

  @Patch('password')
  cambiarPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CambiarPasswordClienteDto,
    @Req() req: Request,
  ) {
    return this.cuentaService.cambiarPassword(
      user.id,
      dto,
      hashDeToken(req.headers['authorization']),
    );
  }

  @Get('compras-tienda')
  comprasTienda(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.cuentaService.listarComprasTienda(user.id, `${req.protocol}://${req.get('host')}`);
  }

  @Get('compras-tienda/:id')
  compraTienda(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.cuentaService.obtenerCompraTienda(
      user.id,
      id,
      `${req.protocol}://${req.get('host')}`,
    );
  }

  @Get('puntos')
  puntos(@CurrentUser() user: AuthenticatedUser) {
    return this.cuentaService.obtenerPuntos(user.id);
  }

  @Post('tarjetas/setup')
  iniciarGuardadoTarjeta(@CurrentUser() user: AuthenticatedUser) {
    return this.cuentaService.iniciarGuardadoTarjeta(user.id);
  }

  @Get('tarjetas')
  tarjetas(@CurrentUser() user: AuthenticatedUser) {
    return this.cuentaService.listarTarjetas(user.id);
  }

  @Delete('tarjetas/:metodoId')
  eliminarTarjeta(@CurrentUser() user: AuthenticatedUser, @Param('metodoId') metodoId: string) {
    return this.cuentaService.eliminarTarjeta(user.id, metodoId);
  }
}
