import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Libro } from '@modules/catalogo/entities/libro.entity';

@Entity('lista_deseos')
export class ListaDeseos {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @Column({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
