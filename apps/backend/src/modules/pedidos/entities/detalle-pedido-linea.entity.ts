import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PedidoLinea } from './pedido-linea.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';

@Entity('detalle_pedido_linea')
export class DetallePedidoLinea {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'pedido_linea_id' })
  pedidoLineaId!: string;

  @ManyToOne(() => PedidoLinea, (pedido) => pedido.detalles)
  @JoinColumn({ name: 'pedido_linea_id' })
  pedidoLinea!: PedidoLinea;

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
