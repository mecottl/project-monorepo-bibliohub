import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// Red de seguridad para refactors estructurales (#75): valida que el grafo de módulos
// arranque, que el mapa de rutas/roles no cambie por accidente y un humo HTTP básico.
// Requiere la base de datos configurada en .env.
// Las claves 'roles' e 'isPublic' se duplican a propósito: el test no debe depender de
// las rutas de los archivos que se van a mover.
describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('mapa de rutas, roles y acceso público', () => {
    const reflector = new Reflector();
    const rutas: string[] = [];
    for (const modulo of app.get(ModulesContainer).values()) {
      for (const { metatype, instance } of modulo.controllers.values()) {
        if (!metatype || !instance) continue;
        const base: string = Reflect.getMetadata(PATH_METADATA, metatype) ?? '';
        const proto = Object.getPrototypeOf(instance);
        for (const nombre of Object.getOwnPropertyNames(proto)) {
          const handler = proto[nombre];
          const metodo = Reflect.getMetadata(METHOD_METADATA, handler);
          if (metodo === undefined) continue;
          const ruta: string = Reflect.getMetadata(PATH_METADATA, handler);
          const roles = reflector.getAllAndOverride<string[]>('roles', [handler, metatype]);
          const publico = reflector.getAllAndOverride<boolean>('isPublic', [handler, metatype]);
          const url = `/${[base, ruta].filter((p) => p && p !== '/').join('/')}`;
          rutas.push(
            `${RequestMethod[metodo]} ${url} roles=${roles?.join(',') ?? '-'}${publico ? ' publico' : ''}`,
          );
        }
      }
    }
    expect(rutas.sort()).toMatchSnapshot();
  });

  it('health responde 200 con la base disponible y sin sesión', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
  });

  it('el catálogo público responde sin sesión', async () => {
    await request(app.getHttpServer()).get('/api/catalogo/libros').expect(200);
    await request(app.getHttpServer()).get('/api/catalogo/categorias').expect(200);
  });

  it.each([
    ['/api/clientes'],
    ['/api/ventas'],
    ['/api/empleados'],
    ['/api/reportes/historial-ventas'],
    ['/api/pedidos/admin'],
    ['/api/carrito'],
  ])('%s exige sesión', async (ruta) => {
    await request(app.getHttpServer()).get(ruta).expect(401);
  });
});
