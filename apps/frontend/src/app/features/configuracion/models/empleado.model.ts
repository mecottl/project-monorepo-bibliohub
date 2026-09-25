export type RolEmpleado = 'cajero' | 'admin';

export interface Empleado {
  id: string;
  nombre: string;
  usuario: string;
  rol: RolEmpleado;
  activo: boolean;
  fechaAlta: string;
  updatedAt: string;
}

export interface CreateEmpleadoPayload {
  nombre: string;
  usuario: string;
  password: string;
  rol: RolEmpleado;
}

export interface UpdateEmpleadoPayload {
  nombre?: string;
  rol?: RolEmpleado;
  activo?: boolean;
}

export interface ChangePasswordPayload {
  passwordActual: string;
  passwordNueva: string;
}
