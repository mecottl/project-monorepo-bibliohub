import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAutorDto {
  @ApiProperty({ example: 'Gabriel García Márquez' })
  @IsString()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Colombiana' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nacionalidad?: string;

  @ApiPropertyOptional({ example: 'Escritor y periodista, premio Nobel de Literatura 1982.' })
  @IsOptional()
  @IsString()
  biografia?: string;
}
