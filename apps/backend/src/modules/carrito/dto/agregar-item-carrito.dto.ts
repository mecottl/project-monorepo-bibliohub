import { IsUUID, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgregarItemCarritoDto {
  @ApiProperty({ example: 'uuid-del-libro' })
  @IsUUID()
  libroId!: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Se suma a la cantidad ya en el carrito' })
  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number = 1;
}
