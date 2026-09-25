import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoriaDto {
  @ApiProperty({ example: 'Ciencia Ficción' })
  @IsString()
  @MaxLength(100)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Narrativa especulativa ambientada en futuros posibles.' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
