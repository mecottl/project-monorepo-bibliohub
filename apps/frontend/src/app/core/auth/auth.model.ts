export interface AuthUser {
  id: string;
  nombre: string;
  rol: 'admin' | 'cajero' | 'cliente';
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

export interface RegistroClientePayload {
  telefono: string;
  password: string;
  nombre: string;
  email?: string;
}