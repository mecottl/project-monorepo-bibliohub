import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ActualizarItemCarritoDto {
  @ApiProperty({ example: 3, description: 'Cantidad final (no un incremento). 0 quita el item.' })
  @IsInt()
  @Min(0)
  cantidad!: number;
}
