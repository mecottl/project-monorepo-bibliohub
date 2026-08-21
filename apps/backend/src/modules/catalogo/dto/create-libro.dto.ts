import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
  IsOptional,
  //   IsBoolean,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AutorRolDto {
  @ApiProperty({ example: 'uuid-del-autor' })
  @IsUUID()
  autorId!: string;

  @ApiProperty({
    example: 'autor',
    enum: ['autor', 'coautor', 'editor', 'traductor', 'ilustrador'],
  })
  @IsString()
  @IsNotEmpty()
  rol!: string;
}

export class CreateLibroDto {
  @ApiProperty({ example: '9786073168518' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  isbn!: string;

  @ApiProperty({ example: 'Cien años de soledad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo!: string;

  @ApiProperty({ example: 'uuid-editorial' })
  @IsUUID()
  editorialId!: string;

  @ApiProperty({ example: 'uuid-categoria' })
  @IsUUID()
  categoriaId!: string;

  @ApiProperty({ example: 349.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioVenta!: number;

  @ApiProperty({ example: 210.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precioCosto!: number;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  stockActual!: number;

  @ApiPropertyOptional({ example: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockMinimo?: number;

  @ApiPropertyOptional({ type: [AutorRolDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AutorRolDto)
  @ArrayMinSize(1)
  autores?: AutorRolDto[];
}
