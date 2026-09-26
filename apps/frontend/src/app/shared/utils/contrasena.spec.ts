import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { contrasenaSegura, motivoContrasenaDebil } from './contrasena';

describe('contrasena', () => {
  it.each([
    ['abc12', /al menos 8/],
    ['Password123', /común/],
    ['aaaaaaaaaa', /repetido/],
    ['23456789', /secuencia/],
  ])('rechaza "%s"', (valor, mensaje) => {
    expect(motivoContrasenaDebil(valor)).toMatch(mensaje);
  });

  it('acepta una contraseña razonable', () => {
    expect(motivoContrasenaDebil('cafe-con-leche-77')).toBeNull();
  });

  it('el validador no exige valor (lo hace required) y marca las débiles', () => {
    expect(contrasenaSegura(new FormControl(''))).toBeNull();
    expect(contrasenaSegura(new FormControl('12345678'))).toEqual({
      contrasenaDebil: expect.any(String),
    });
    expect(contrasenaSegura(new FormControl('Cielo-abierto-9'))).toBeNull();
  });
});
