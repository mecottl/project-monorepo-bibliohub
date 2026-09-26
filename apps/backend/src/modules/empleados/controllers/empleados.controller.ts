import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '@common/auth/roles.decorator';
import { CurrentUser } from '@common/auth/current-user.decorator';
import type { AuthenticatedUser } from '@common/auth/jwt-payload.interface';
import { hashDeToken } from '@common/sesiones';
import { EmpleadosService } from '../services/empleados.service';
import { CreateEmpleadoDto } from '../dto/create-empleado.dto';
import { UpdateEmpleadoDto } from '../dto/update-empleado.dto';
import { UpdatePerfilEmpleadoDto } from '../dto/update-perfil-empleado.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';

@ApiTags('empleados')
@Controller('empleados')
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Roles('admin')
  @Get()
  findAll() {
    return this.empleadosService.findAll();
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateEmpleadoDto) {
    return this.empleadosService.create(dto);
  }

  // Antes de ':id' para que "me" no se interprete como un id.
  @Patch('me')
  actualizarPerfil(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePerfilEmpleadoDto) {
    return this.empleadosService.update(user.id, { nombre: dto.nombre });
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpleadoDto) {
    return this.empleadosService.update(id, dto);
  }

  // Sin @Roles: cualquier empleado autenticado (admin o cajero) puede cambiar
  // su propia contraseña — el id sale del JWT, nunca de la URL.
  @Patch('me/password')
  cambiarPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
  ) {
    return this.empleadosService.cambiarPassword(
      user.id,
      dto,
      hashDeToken(req.headers['authorization']),
    );
  }
}
