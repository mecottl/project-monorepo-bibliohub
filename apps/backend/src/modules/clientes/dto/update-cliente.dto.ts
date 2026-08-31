import { IsOptional, IsString, IsEmail, IsBoolean, MaxLength } from 'class-validator';
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

  // puntosSaldo NO se edita aquí: es un campo derivado que solo debe
  // cambiar a través de POST /clientes/:id/ajuste-puntos, que además deja
  // un registro auditable en transaccion_puntos.
}
