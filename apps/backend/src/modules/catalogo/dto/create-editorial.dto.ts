import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEditorialDto {
  @ApiProperty({ example: 'Penguin Random House' })
  @IsString()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ example: 'España' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  pais?: string;

  @ApiPropertyOptional({ example: 'https://www.penguinlibros.com' })
  @IsOptional()
  @IsUrl()
  @MaxLength(200)
  sitioWeb?: string;
}
