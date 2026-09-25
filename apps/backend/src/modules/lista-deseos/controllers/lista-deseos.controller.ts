import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ListaDeseosService } from '../services/lista-deseos.service';

@ApiTags('lista-deseos')
@Controller('lista-deseos')
@Roles('cliente')
export class ListaDeseosController {
  constructor(private readonly service: ListaDeseosService) {}

  @Get()
  listar(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    return this.service.listar(user.id, `${req.protocol}://${req.get('host')}`);
  }

  @Get('ids')
  ids(@CurrentUser() user: AuthenticatedUser) {
    return this.service.ids(user.id);
  }

  @Post(':libroId')
  agregar(@CurrentUser() user: AuthenticatedUser, @Param('libroId', ParseUUIDPipe) libroId: string) {
    return this.service.agregar(user.id, libroId);
  }

  @Delete(':libroId')
  quitar(@CurrentUser() user: AuthenticatedUser, @Param('libroId', ParseUUIDPipe) libroId: string) {
    return this.service.quitar(user.id, libroId);
  }
}
