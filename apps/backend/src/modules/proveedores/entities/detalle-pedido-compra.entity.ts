import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PedidoCompra } from './pedido-compra.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';

@Entity('detalle_pedido_compra')
export class DetallePedidoCompra {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'pedido_compra_id' })
  pedidoCompraId!: string;

  @ManyToOne(() => PedidoCompra, (pedido) => pedido.detalles)
  @JoinColumn({ name: 'pedido_compra_id' })
  pedidoCompra!: PedidoCompra;

  @Column({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @Column({ type: 'int', name: 'cantidad_solicitada' })
  cantidadSolicitada!: number;

  @Column({ type: 'int', name: 'cantidad_recibida', default: 0 })
  cantidadRecibida!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'precio_costo' })
  precioCosto!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'subtotal_linea' })
  subtotalLinea!: number;
}
