import {
  IsUUID,
  IsInt,
  IsNumber,
  Min,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemPedidoCompraDto {
  @ApiProperty({ example: 'uuid-del-libro' })
  @IsUUID()
  libroId!: string;

  @ApiProperty({ example: 20 })
  @IsInt()
  @Min(1)
  cantidadSolicitada!: number;

  @ApiProperty({ example: 150.5 })
  @IsNumber()
  @Min(0)
  precioCosto!: number;
}

export class CreatePedidoCompraDto {
  @ApiProperty({ example: 'uuid-del-proveedor' })
  @IsUUID()
  proveedorId!: string;

  @ApiPropertyOptional({ example: 'Pedido de reposición trimestral' })
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiProperty({ type: [ItemPedidoCompraDto] })
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoCompraDto)
  @ArrayMinSize(1, { message: 'El pedido debe tener al menos un item' })
  items!: ItemPedidoCompraDto[];
}
