import { Empleado } from '../../../database/entities/empleado.entity';

export type EmpleadoSeguro = Omit<Empleado, 'passwordHash'>;
