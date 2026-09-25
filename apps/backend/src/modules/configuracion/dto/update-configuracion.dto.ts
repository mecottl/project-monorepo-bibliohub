import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfiguracionDto {
  @ApiProperty({ example: '80', description: 'Nuevo valor, como texto. Se valida contra tipo_dato antes de guardar.' })
  @IsString()
  @IsNotEmpty()
  valor!: string;
}
