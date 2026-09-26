import { applyDecorators } from '@nestjs/common';
import {
  IsString,
  MaxLength,
  MinLength,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

// Política única de contraseñas para clientes y empleados (#45): 8–72 caracteres (72 es el límite
// de bcrypt), sin caracteres repetidos ni secuencias triviales y fuera de una lista de contraseñas comunes.
export const CONTRASENA_MIN = 8;
export const CONTRASENA_MAX = 72;

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

// Devuelve el motivo del rechazo o null si la contraseña es aceptable.
export function motivoContrasenaDebil(valor: string): string | null {
  if (valor.length < CONTRASENA_MIN)
    return `La contraseña debe tener al menos ${CONTRASENA_MIN} caracteres`;
  if (valor.length > CONTRASENA_MAX)
    return `La contraseña no puede superar ${CONTRASENA_MAX} caracteres`;
  const normal = valor.toLowerCase();
  if (COMUNES.has(normal)) return 'La contraseña es demasiado común';
  if (/^(.)\1+$/.test(normal)) return 'La contraseña no puede ser un mismo carácter repetido';
  if (SECUENCIAS.some((s) => s.includes(normal)))
    return 'La contraseña no puede ser una secuencia simple';
  return null;
}

function NoEsComun(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'contrasenaSegura',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate: (valor: unknown) =>
          typeof valor === 'string' && motivoContrasenaDebil(valor) === null,
        defaultMessage: (args) =>
          motivoContrasenaDebil(String(args?.value ?? '')) ?? 'Contraseña no válida',
      },
    });
}

export const ContrasenaSegura = () =>
  applyDecorators(IsString(), MinLength(CONTRASENA_MIN), MaxLength(CONTRASENA_MAX), NoEsComun());
