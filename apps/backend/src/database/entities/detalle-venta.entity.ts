import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Venta } from './venta.entity';
import { Libro } from './libro.entity';

@Entity('detalle_venta')
export class DetalleVenta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'venta_id' })
  ventaId!: string;

  @ManyToOne(() => Venta, (venta) => venta.detalles)
  @JoinColumn({ name: 'venta_id' })
  venta!: Venta;

  @Column({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'precio_unitario' })
  precioUnitario!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'subtotal_linea' })
  subtotalLinea!: number;
}
