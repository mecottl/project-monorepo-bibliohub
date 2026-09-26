import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroClienteDto } from './dto/registro-cliente.dto';
import { RecuperarPasswordDto, ResetPasswordDto } from './dto/recuperar-password.dto';
import { RecuperacionService } from './recuperacion.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './interfaces/jwt-payload.interface';

@ApiTags('auth')
// 10 intentos por minuto por IP en login, registro y recuperación: frena fuerza
// bruta y abuso del envío de correos sin estorbar a un usuario legítimo.
@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly recuperacionService: RecuperacionService,
  ) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<LoginResult> {
    return this.authService.login(dto, req.ip, req.headers['user-agent']);
  }

  @Public()
  @Post('registro-cliente')
  registroCliente(@Body() dto: RegistroClienteDto): Promise<LoginResult> {
    return this.authService.registrarCliente(dto);
  }

  @Public()
  @Post('recuperar-password')
  recuperarPassword(@Body() dto: RecuperarPasswordDto) {
    return this.recuperacionService.solicitar(dto.identificador);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.recuperacionService.restablecer(dto.token, dto.password);
  }

  @Post('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @Post('logout-all')
  logoutAll(@Req() req: Request, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.cerrarTodasLasSesiones(user, req.ip, req.headers['user-agent']);
  }

  @Post('logout')
  logout(
    @Req() req: Request,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    const token = req.headers['authorization']?.replace('Bearer ', '') ?? '';
    return this.authService.logout(
      token,
      user,
      req.ip,
      req.headers['user-agent'],
    );
  }
}
