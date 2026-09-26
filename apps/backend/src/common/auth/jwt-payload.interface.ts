export type TipoUsuario = 'cliente' | 'empleado';

export interface JwtPayload {
  sub: string;
  tipo: TipoUsuario;
  rol: string;
  nombre: string;
}

export interface AuthenticatedUser {
  id: string;
  tipo: TipoUsuario;
  rol: string;
  nombre: string;
}
