import {
  IsUUID,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovimientoInventarioDto {
  @ApiProperty({ example: 'uuid-del-libro' })
  @IsUUID()
  libroId!: string;

  @ApiProperty({
    example: 'entrada',
    enum: ['entrada', 'salida', 'ajuste'],
  })
  @IsIn(['entrada', 'salida', 'ajuste'])
  tipo!: 'entrada' | 'salida' | 'ajuste';

  @ApiProperty({
    example: 5,
    description:
      'Delta con signo aplicado al stock. Para "entrada" debe ser positivo, para "salida" debe ser negativo. Para "ajuste" puede ser positivo o negativo, según lo que arroje el conteo físico.',
  })
  @IsInt()
  cantidad!: number;

  @ApiPropertyOptional({ example: 'Conteo físico de fin de mes' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  motivo?: string;
}
