import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, OneToMany } from 'typeorm';
import { ItemCarrito } from './item-carrito.entity';

@Entity('carrito')
export class Carrito {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn!: Date;

  @OneToMany(() => ItemCarrito, (item) => item.carrito)
  items?: ItemCarrito[];
}
