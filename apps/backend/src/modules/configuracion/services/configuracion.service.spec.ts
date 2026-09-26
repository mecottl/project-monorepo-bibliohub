import { BadRequestException } from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';

function crear(filas: Record<string, { valor: string; tipoDato: string }>) {
  const repo = {
    findOne: jest.fn(async ({ where: { clave } }) =>
      filas[clave] ? { clave, ...filas[clave] } : null,
    ),
    save: jest.fn(async (x) => {
      filas[x.clave].valor = x.valor;
      return x;
    }),
  };
  return {
    repo,
    servicio: new ConfiguracionService(repo as never, { registrar: jest.fn() } as never),
  };
}

describe('ConfiguracionService', () => {
  it('valorNumerico convierte y cachea la lectura', async () => {
    const { repo, servicio } = crear({ tasa: { valor: '2.5', tipoDato: 'numeric' } });
    expect(await servicio.valorNumerico('tasa')).toBe(2.5);
    expect(await servicio.valorNumerico('tasa')).toBe(2.5);
    expect(repo.findOne).toHaveBeenCalledTimes(1);
  });

  it('sin porDefecto, una clave inexistente falla; con porDefecto lo devuelve', async () => {
    const { servicio } = crear({});
    await expect(servicio.valorNumerico('x')).rejects.toBeInstanceOf(BadRequestException);
    expect(await servicio.valorNumerico('x', 1)).toBe(1);
  });

  it('un valor no numérico falla', async () => {
    const { servicio } = crear({ t: { valor: 'abc', tipoDato: 'text' } });
    await expect(servicio.valorNumerico('t')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('update invalida la caché', async () => {
    const { servicio } = crear({ t: { valor: '1', tipoDato: 'numeric' } });
    expect(await servicio.valorNumerico('t')).toBe(1);
    await servicio.update('t', '3');
    expect(await servicio.valorNumerico('t')).toBe(3);
  });
});
