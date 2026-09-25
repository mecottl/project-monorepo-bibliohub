import { IsString, IsOptional, IsEmail, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty({ example: 'Distribuidora Editorial SA' })
  @IsString()
  @MaxLength(150)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Juan Pérez' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactoNombre?: string;

  @ApiPropertyOptional({ example: 'contacto@distribuidora.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ example: '5512345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefono?: string;

  @ApiPropertyOptional({ example: 'Pago a 30 días, pedido mínimo 50 unidades' })
  @IsOptional()
  @IsString()
  condicionesComerciales?: string;
}
