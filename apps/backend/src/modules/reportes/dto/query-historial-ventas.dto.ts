import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryHistorialVentasDto {
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  hasta?: string;

  @ApiPropertyOptional({ enum: ['tienda', 'en_linea'] })
  @IsOptional()
  @IsIn(['tienda', 'en_linea'])
  canal?: 'tienda' | 'en_linea';

  @ApiPropertyOptional({ enum: ['completada', 'en_proceso', 'cancelada'] })
  @IsOptional()
  @IsIn(['completada', 'en_proceso', 'cancelada'])
  estado?: 'completada' | 'en_proceso' | 'cancelada';

  @ApiPropertyOptional({ description: 'Nombre o teléfono del cliente, o inicio del folio' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  busqueda?: string;

  @ApiPropertyOptional({ enum: ['fecha', 'total'], default: 'fecha' })
  @IsOptional()
  @IsIn(['fecha', 'total'])
  orden?: 'fecha' | 'total';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  direccion?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 15;
}
