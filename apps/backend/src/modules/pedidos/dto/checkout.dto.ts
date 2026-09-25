import { IsUUID, IsIn, IsOptional, IsInt, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ example: 'envio_a_domicilio', enum: ['recoger_en_tienda', 'envio_a_domicilio'] })
  @IsIn(['recoger_en_tienda', 'envio_a_domicilio'])
  tipoEntrega!: 'recoger_en_tienda' | 'envio_a_domicilio';

  // Solo requerida cuando es envío a domicilio — al recoger en tienda no hay
  // a dónde enviar, por eso se valida condicionalmente en vez de con @IsUUID
  // simple.
  @ApiPropertyOptional({ example: 'uuid-de-la-direccion' })
  @ValidateIf((dto: CheckoutDto) => dto.tipoEntrega === 'envio_a_domicilio')
  @IsUUID()
  direccionId?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  puntosUsados?: number = 0;
}
