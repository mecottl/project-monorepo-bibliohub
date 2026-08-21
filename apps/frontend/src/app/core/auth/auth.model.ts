export interface AuthUser {
  id: number;
  tipo: 'empleado' | 'cliente';
  rol?: 'admin' | 'cajero';
  nombre: string;
  telefono?: string;
  puntosSaldo?: number;
}

export interface LoginResponse {
  accessToken: string;
  tipo: 'empleado' | 'cliente';
  perfil: AuthUser;
}

export interface LoginPayload {
  identificador: string;
  password: string;
}