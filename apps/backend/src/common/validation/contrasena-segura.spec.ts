import { validate } from 'class-validator';
import { ContrasenaSegura, motivoContrasenaDebil } from './contrasena-segura';

class Dto {
  @ContrasenaSegura()
  password!: string;
}

const errores = async (password: string) => {
  const dto = new Dto();
  dto.password = password;
  return validate(dto);
};

describe('política de contraseñas', () => {
  it.each([
    ['corta', 'abc12', /al menos 8/],
    ['común', 'Password123', /común/],
    ['repetida', 'aaaaaaaaaa', /repetido/],
    ['secuencia', '23456789', /secuencia/],
    ['demasiado larga', 'x'.repeat(73) + '1', /72/],
  ])('rechaza una contraseña %s', (_nombre, valor, mensaje) => {
    expect(motivoContrasenaDebil(valor)).toMatch(mensaje);
  });

  it('acepta una contraseña razonable', () => {
    expect(motivoContrasenaDebil('cafe-con-leche-77')).toBeNull();
  });

  it('el decorador rechaza y acepta según la política', async () => {
    expect(await errores('12345678')).toHaveLength(1);
    expect(await errores('Cielo-abierto-9')).toHaveLength(0);
  });
});
