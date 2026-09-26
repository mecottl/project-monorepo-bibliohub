// src/modules/catalogo/dto/query-libro.dto.ts
import { IsBoolean, IsIn, IsOptional, IsString, IsInt, Min, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryLibroDto {
  @ApiPropertyOptional({
    description: 'Búsqueda general: coincide por título, ISBN o autor',
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

  @ApiPropertyOptional({ description: 'Solo libros con stock igual o menor al mínimo' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  stockBajo?: boolean;

  @ApiPropertyOptional({ description: 'Solo libros con existencias' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  disponibles?: boolean;

  @ApiPropertyOptional({ description: 'Precio de venta mínimo' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  precioMin?: number;

  @ApiPropertyOptional({ description: 'Precio de venta máximo' })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  precioMax?: number;

  @ApiPropertyOptional({ enum: ['titulo', 'isbn', 'stockActual', 'precioVenta', 'createdAt'] })
  @IsOptional()
  @IsIn(['titulo', 'isbn', 'stockActual', 'precioVenta', 'createdAt'])
  orden?: 'titulo' | 'isbn' | 'stockActual' | 'precioVenta' | 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  direccion?: 'ASC' | 'DESC';

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
