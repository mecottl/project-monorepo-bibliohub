import { HttpException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService, MAX_INTENTOS_FALLIDOS } from './auth.service';

const telefono = '5551234567';

function crear(opciones: { fallos: number; correo?: string | null }) {
  const cliente = {
    id: 'c1',
    telefono,
    cuentaActiva: true,
    email: opciones.correo === undefined ? 'a@b.com' : opciones.correo,
    passwordHash: bcrypt.hashSync('correcta-123', 4),
  };
  let fallos = opciones.fallos;
  const log = {
    findOne: jest.fn().mockResolvedValue(null),
    count: jest.fn().mockImplementation(async () => fallos),
    create: jest.fn((x) => x),
    save: jest.fn().mockImplementation(async () => {
      fallos++;
    }),
  };
  const email = { enviar: jest.fn().mockResolvedValue(undefined) };
  const jwt = { sign: jest.fn().mockReturnValue('token') };
  const servicio = new AuthService(
    { findOne: jest.fn().mockResolvedValue(cliente) } as never,
    {} as never,
    log as never,
    { save: jest.fn(), create: jest.fn((x) => x) } as never,
    jwt as never,
    email as never,
  );
  return { servicio, log, email };
}

describe('AuthService: bloqueo por intentos fallidos', () => {
  it('con el límite alcanzado rechaza con 429 aunque la contraseña sea correcta', async () => {
    const { servicio } = crear({ fallos: MAX_INTENTOS_FALLIDOS });
    const error = await servicio
      .login({ identificador: telefono, password: 'correcta-123' })
      .catch((e) => e);
    expect(error).toBeInstanceOf(HttpException);
    expect(error.getStatus()).toBe(429);
  });

  it('un fallo por debajo del límite responde credenciales inválidas', async () => {
    const { servicio, email } = crear({ fallos: 1 });
    await expect(
      servicio.login({ identificador: telefono, password: 'mala-clave-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(email.enviar).not.toHaveBeenCalled();
  });

  it('el fallo que alcanza el límite avisa por correo', async () => {
    const { servicio, email } = crear({ fallos: MAX_INTENTOS_FALLIDOS - 1 });
    await expect(
      servicio.login({ identificador: telefono, password: 'mala-clave-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(email.enviar).toHaveBeenCalledWith(expect.objectContaining({ para: 'a@b.com' }));
  });

  it('sin correo no se envía aviso ni falla', async () => {
    const { servicio, email } = crear({ fallos: MAX_INTENTOS_FALLIDOS - 1, correo: null });
    await expect(
      servicio.login({ identificador: telefono, password: 'mala-clave-1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(email.enviar).not.toHaveBeenCalled();
  });

  it('un acceso correcto por debajo del límite entra', async () => {
    const { servicio } = crear({ fallos: 2 });
    const r = await servicio.login({ identificador: telefono, password: 'correcta-123' });
    expect(r.accessToken).toBe('token');
  });
});
