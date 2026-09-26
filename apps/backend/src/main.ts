import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { JsonLogger } from '@common/logging/json-logger';
import { requestLogger } from '@common/logging/request-logger.middleware';
import { AllExceptionsFilter } from '@common/logging/all-exceptions.filter';

function validarJwtSecret(): void {
  const secreto = process.env.JWT_SECRET ?? '';
  if (process.env.NODE_ENV === 'production' && secreto.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres en producción.');
  }
}

async function bootstrap() {
  validarJwtSecret();

  // rawBody: true deja disponible req.rawBody — lo necesita el webhook de
  // Stripe (pedidos/pedidos.controller.ts) para verificar la firma, ya que esa
  // verificación requiere el cuerpo crudo tal cual Stripe lo firmó, antes de
  // que el ValidationPipe/body-parser lo transforme a JSON.
  // Logs en JSON (una línea por evento) en producción o con LOG_FORMAT=json.
  const logJson = process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json';
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    ...(logJson ? { logger: new JsonLogger() } : {}),
  });

  app.use(requestLogger);
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API JSON: la CSP no aplica (y rompería Swagger UI); el resto de headers
  // de helmet sí. CORP cross-origin para que el frontend (otro origen) pueda
  // cargar las portadas de /uploads.
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }),
  );

  // Detrás de un proxy/balanceador req.ip sería la IP del proxy y el rate
  // limiting bloquearía a todos a la vez — TRUST_PROXY=true lo corrige.
  if (process.env.TRUST_PROXY === 'true') {
    app.set('trust proxy', 1);
  }

  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:4200').split(',').map((o) => o.trim()),
  });

  // Assets públicos (portadas, etc.) fuera del prefijo /api y sin pasar por
  // el pipeline de guards de Nest (Express los sirve antes de llegar ahí).
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Librería')
    .setDescription('')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor corriendo en http://localhost:${port}/api`);
  console.log(`Swagger en http://localhost:${port}/api/docs`);
}
void bootstrap();
