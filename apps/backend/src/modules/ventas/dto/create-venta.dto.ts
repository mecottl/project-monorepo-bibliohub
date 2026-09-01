import {
  IsUUID,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ItemVentaDto {
  @ApiProperty({ example: 'uuid-del-libro' })
  @IsUUID()
  libroId!: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  cantidad!: number;

  // Sin precioUnitario a propósito: el precio SIEMPRE se toma del catálogo real
  // (libro.precioVenta) en VentasService.crear(), nunca de lo que envíe el cliente
  // HTTP. Aceptarlo aquí permitiría vender a cualquier precio arbitrario — ver
  // correccion-backend-ventas.md para el detalle de por qué se quitó.
}

export class CreateVentaDto {
  @ApiPropertyOptional({
    example: '9991234567',
    description:
      'Teléfono del cliente (opcional — una venta puede ser sin cliente). Si el ' +
      'teléfono no existe todavía, se crea un cliente "solo teléfono" automáticamente ' +
      '(sin nombre, sin contraseña, cuenta inactiva) — no se requiere un clienteId ' +
      'previo ni un paso aparte.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, { message: 'El teléfono debe contener solo dígitos (10)' })
  clienteTelefono?: string;

  @ApiProperty({ example: 'efectivo', enum: ['efectivo', 'tarjeta'] })
  @IsIn(['efectivo', 'tarjeta'])
  medioPago!: 'efectivo' | 'tarjeta';

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Puntos que el cliente canjea en esta venta (requiere clienteTelefono)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntosUsados?: number = 0;

  @ApiProperty({ type: [ItemVentaDto] })
  @ValidateNested({ each: true })
  @Type(() => ItemVentaDto)
  @ArrayMinSize(1, { message: 'La venta debe tener al menos un item' })
  items!: ItemVentaDto[];
}
