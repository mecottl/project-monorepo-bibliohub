import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiPropertyOptional({ example: 'María López' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ example: 'maria@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({
    description: 'Activa o desactiva la cuenta del cliente',
  })
  @IsOptional()
  @IsBoolean()
  cuentaActiva?: boolean;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntosSaldo?: number;
}
