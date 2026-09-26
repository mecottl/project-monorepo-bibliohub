import type { AbstractControl, ValidationErrors } from '@angular/forms';

// Misma política que el backend (common/validation/contrasena-segura.ts, #45): 8–72 caracteres,
// sin repeticiones ni secuencias triviales y fuera de una lista de contraseñas comunes.
export const AYUDA_CONTRASENA =
  'Mínimo 8 caracteres; evita contraseñas comunes o secuencias simples.';

const COMUNES = new Set([
  'password',
  'password1',
  'password123',
  'contrasena',
  'contrasena1',
  'contrasena123',
  'qwertyui',
  'qwerty123',
  'qwertyuiop',
  '12345678',
  '123456789',
  '1234567890',
  '87654321',
  '11111111',
  '00000000',
  'abcd1234',
  'abc12345',
  'iloveyou',
  'admin123',
  'administrador',
  'bienvenido',
  'bibliohub',
  'libreria',
  'libreria1',
  'letmein1',
  'welcome1',
  'monkey123',
  'dragon123',
  'football',
  'picapiedra',
  'mexico123',
]);

const SECUENCIAS = [
  '0123456789',
  '9876543210',
  'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiopasdfghjklzxcvbnm',
];

export function motivoContrasenaDebil(valor: string): string | null {
  if (valor.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (valor.length > 72) return 'La contraseña no puede superar 72 caracteres';
  const normal = valor.toLowerCase();
  if (COMUNES.has(normal)) return 'La contraseña es demasiado común';
  if (/^(.)\1+$/.test(normal)) return 'La contraseña no puede ser un mismo carácter repetido';
  if (SECUENCIAS.some((s) => s.includes(normal)))
    return 'La contraseña no puede ser una secuencia simple';
  return null;
}

export function contrasenaSegura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  if (typeof valor !== 'string' || valor === '') return null; // "required" se valida aparte
  const motivo = motivoContrasenaDebil(valor);
  return motivo ? { contrasenaDebil: motivo } : null;
}
