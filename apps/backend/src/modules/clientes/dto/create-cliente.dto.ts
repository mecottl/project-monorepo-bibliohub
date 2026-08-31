import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Crea un cliente "solo teléfono": sin nombre, sin contraseña, cuenta
// inactiva. Pensado para el mostrador (venta/POS) cuando un cliente nuevo
// solo da su número para acumular puntos. Reclama la cuenta después
// registrándose con ese mismo teléfono (ver AuthService.registrarCliente).
export class CreateClienteDto {
  @ApiProperty({ example: '9991234567' })
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'El teléfono debe contener solo dígitos (10)',
  })
  telefono!: string;
}
