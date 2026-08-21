import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Libro } from './libro.entity';

@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => Libro, (libro) => libro.categoria)
  libros!: Libro[];
}
