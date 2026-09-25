import { IsUUID, IsInt, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ItemRecepcionDto {
  @ApiProperty({ example: 'uuid-del-detalle', description: 'id de la línea (detalle_pedido_compra)' })
  @IsUUID()
  detalleId!: string;

  @ApiProperty({
    example: 20,
    description: 'Cantidad total recibida acumulada para esta línea (no un incremento)',
  })
  @IsInt()
  @Min(0)
  cantidadRecibida!: number;
}

export class RecibirPedidoCompraDto {
  @ApiProperty({ type: [ItemRecepcionDto] })
  @ValidateNested({ each: true })
  @Type(() => ItemRecepcionDto)
  @ArrayMinSize(1)
  items!: ItemRecepcionDto[];
}
