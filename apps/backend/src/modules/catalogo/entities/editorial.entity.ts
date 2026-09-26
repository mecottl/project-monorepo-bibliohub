import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Libro } from './libro.entity';

@Entity('editorial')
export class Editorial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  nombre!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  pais!: string;

  @Column({ type: 'varchar', length: 200, name: 'sitio_web', nullable: true })
  sitioWeb!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => Libro, (libro) => libro.editorial)
  libros!: Libro[];
}
