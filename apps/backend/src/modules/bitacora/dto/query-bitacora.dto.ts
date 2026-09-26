import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class QueryBitacoraDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  empleadoId?: string;

  @ApiPropertyOptional({ example: 'ajuste_puntos' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  accion?: string;

  @ApiPropertyOptional({ example: 'cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entidad?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;
}
