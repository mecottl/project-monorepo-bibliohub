import { contextoPeticion } from '@common/logging/contexto';
import { BitacoraService } from './bitacora.service';

function crear(guardar: jest.Mock = jest.fn().mockResolvedValue(undefined)) {
  const repo = { create: jest.fn((x) => x), save: guardar };
  return { servicio: new BitacoraService(repo as never), repo };
}

describe('BitacoraService.registrar', () => {
  it('toma empleado, nombre e IP del contexto de la petición', async () => {
    const { servicio, repo } = crear();
    await contextoPeticion.run(
      {
        requestId: 'r1',
        ip: '10.0.0.5',
        usuario: { id: 'e1', tipo: 'empleado', rol: 'admin', nombre: 'Ana' },
      },
      () =>
        servicio.registrar({
          accion: 'ajuste_puntos',
          entidad: 'cliente',
          entidadId: 'c1',
          antes: { puntosSaldo: 10 },
          despues: { puntosSaldo: 20 },
        }),
    );
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        empleadoId: 'e1',
        empleadoNombre: 'Ana',
        ip: '10.0.0.5',
        accion: 'ajuste_puntos',
        antes: { puntosSaldo: 10 },
        despues: { puntosSaldo: 20 },
      }),
    );
  });

  it('un cliente autenticado no se guarda como empleado', async () => {
    const { servicio, repo } = crear();
    await contextoPeticion.run(
      { requestId: 'r', usuario: { id: 'c9', tipo: 'cliente', rol: 'cliente', nombre: 'Luis' } },
      () => servicio.registrar({ accion: 'x', entidad: 'y' }),
    );
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ empleadoId: null }));
  });

  it('sin contexto (script, prueba) guarda sin actor ni IP', async () => {
    const { servicio, repo } = crear();
    await servicio.registrar({ accion: 'x', entidad: 'y' });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ empleadoId: null, empleadoNombre: null, ip: null }),
    );
  });

  it('si guardar falla no rompe la operación auditada', async () => {
    const { servicio } = crear(jest.fn().mockRejectedValue(new Error('db caída')));
    await expect(servicio.registrar({ accion: 'x', entidad: 'y' })).resolves.toBeUndefined();
  });
});
