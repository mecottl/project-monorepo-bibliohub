export interface Proveedor {
  id: string;
  nombre: string;
  contactoNombre: string | null;
  email: string | null;
  telefono: string | null;
  condicionesComerciales: string | null;
  activo: boolean;
  createdAt: string;
}

export interface CreateProveedorPayload {
  nombre: string;
  contactoNombre?: string;
  email?: string;
  telefono?: string;
  condicionesComerciales?: string;
}

export type UpdateProveedorPayload = Partial<CreateProveedorPayload>;
