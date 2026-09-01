import {
  IsUUID,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemVentaDto {
  @ApiProperty({ example: 'uuid-del-libro' })
  @IsUUID()
  libroId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  cantidad!: number;

  @ApiProperty({ example: 349.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioUnitario!: number;
}

export class CreateVentaDto {
  @ApiPropertyOptional({
    example: 'uuid-del-cliente',
    description: 'Omite si la venta es a un cliente anónimo (no acumula puntos)',
  })
  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @ApiProperty({ example: 'efectivo', enum: ['efectivo', 'tarjeta'] })
  @IsIn(['efectivo', 'tarjeta'])
  medioPago!: 'efectivo' | 'tarjeta';

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Puntos que el cliente canjea en esta venta (requiere clienteId)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntosUsados?: number = 0;

  @ApiProperty({ type: [ItemVentaDto] })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  @ArrayMinSize(1)
  items!: ItemVentaDto[];
}
