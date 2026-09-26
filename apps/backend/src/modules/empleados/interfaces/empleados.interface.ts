import { Empleado } from '../entities/empleado.entity';

export type EmpleadoSeguro = Omit<Empleado, 'passwordHash'>;
