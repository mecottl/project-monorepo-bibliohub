import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
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
  cambiarPassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: CambiarPasswordClienteDto) {
    return this.cuentaService.cambiarPassword(user.id, dto);
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
