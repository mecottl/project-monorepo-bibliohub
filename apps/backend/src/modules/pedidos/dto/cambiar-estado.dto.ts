import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { EstadoPedidoLinea } from '../entities/pedido-linea.entity';

export class CambiarEstadoPedidoDto {
  @ApiProperty({ enum: ['en_preparacion', 'listo', 'enviado', 'entregado', 'cancelado'] })
  @IsIn(['en_preparacion', 'listo', 'enviado', 'entregado', 'cancelado'])
  estado!: EstadoPedidoLinea;
}
