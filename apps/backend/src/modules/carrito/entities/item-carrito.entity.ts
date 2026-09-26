import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Carrito } from './carrito.entity';
import { Libro } from '@modules/catalogo/entities/libro.entity';

@Entity('item_carrito')
export class ItemCarrito {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'carrito_id' })
  carritoId!: string;

  @ManyToOne(() => Carrito, (carrito) => carrito.items)
  @JoinColumn({ name: 'carrito_id' })
  carrito!: Carrito;

  @Column({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @Column({ type: 'int' })
  cantidad!: number;
}
