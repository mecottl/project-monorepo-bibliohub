import { IsIn, IsInt, Min, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AjustePuntosClienteDto {
  @ApiProperty({
    example: 'ganado',
    enum: ['ganado', 'canjeado'],
    description: '"ganado" suma al saldo, "canjeado" resta',
  })
  @IsIn(['ganado', 'canjeado'])
  tipo!: 'ganado' | 'canjeado';

  @ApiProperty({
    example: 50,
    description: 'Magnitud del ajuste, siempre positiva',
  })
  @IsInt()
  @Min(1)
  puntos!: number;

  @ApiPropertyOptional({ example: 'Compensación por reclamo #123' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  concepto?: string;
}
