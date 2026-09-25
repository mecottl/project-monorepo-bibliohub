export interface ItemCarritoConLibro {
  id: string;
  libroId: string;
  cantidad: number;
  libro: {
    id: string;
    titulo: string;
    precioVenta: number;
    stockActual: number;
    imagenUrl: string | null;
  };
  subtotal: number;
}

export interface CarritoConItems {
  id: string;
  items: ItemCarritoConLibro[];
  totalItems: number;
  subtotal: number;
}
