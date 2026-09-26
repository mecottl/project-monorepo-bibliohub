import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { Sesion } from '../database/entities/sesion.entity';

export function hashDeToken(authorization?: string): string {
  const token = authorization?.replace('Bearer ', '') ?? '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Cierra las sesiones de una cuenta menos la actual (si se indica su hash). Se usa al cambiar la
 * contraseña: quien tuviera la anterior abierta en otro dispositivo pierde el acceso.
 */
export async function cerrarOtrasSesiones(
  repo: Repository<Sesion>,
  cuenta: { clienteId?: string; empleadoId?: string },
  hashActual?: string,
): Promise<void> {
  const qb = repo.createQueryBuilder().delete();
  if (cuenta.clienteId) qb.where('cliente_id = :id', { id: cuenta.clienteId });
  else qb.where('empleado_id = :id', { id: cuenta.empleadoId });
  if (hashActual) qb.andWhere('token_hash <> :hash', { hash: hashActual });
  await qb.execute();
}
