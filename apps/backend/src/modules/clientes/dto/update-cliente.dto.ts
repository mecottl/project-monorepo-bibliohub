import { IsOptional, IsString, IsEmail, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClienteDto {
  @ApiPropertyOptional({
    example: 'María López',
    nullable: true,
    description:
      'Envía null para borrar el nombre (p. ej. si se cargó mal a mano); ' +
      'omite el campo para dejarlo como está.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string | null;

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
