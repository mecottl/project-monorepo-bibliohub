// src/modules/catalogo/dto/query-libro.dto.ts
import { IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLibroDto {
  @ApiPropertyOptional({
    description: 'Búsqueda por título',
  })
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Búsqueda por nombre de autor',
  })
  @IsOptional()
  @IsString()
  autor?: string;

  @ApiPropertyOptional({ description: 'ISBN exacto' })
  @IsOptional()
  @IsString()
  isbn?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoría' })
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por editorial' })
  @IsOptional()
  @IsUUID()
  editorialId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
