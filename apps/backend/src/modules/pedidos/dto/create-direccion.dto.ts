import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDireccionDto {
  @ApiPropertyOptional({ example: 'Casa' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  alias?: string;

  @ApiProperty({ example: 'Av. Insurgentes Sur 123' })
  @IsString()
  @MaxLength(200)
  calle!: string;

  @ApiPropertyOptional({ example: 'Roma Norte' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  colonia?: string;

  @ApiProperty({ example: 'Ciudad de México' })
  @IsString()
  @MaxLength(100)
  ciudad!: string;

  @ApiProperty({ example: 'CDMX' })
  @IsString()
  @MaxLength(100)
  estado!: string;

  @ApiProperty({ example: '06700' })
  @IsString()
  @MaxLength(10)
  codigoPostal!: string;

  @ApiPropertyOptional({ example: 'Portón negro, casa azul' })
  @IsOptional()
  @IsString()
  referencias?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;
}
