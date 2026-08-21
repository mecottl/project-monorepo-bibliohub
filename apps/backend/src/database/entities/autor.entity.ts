import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LibroAutor } from './libro-autor.entity';

@Entity('autor')
export class Autor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  nacionalidad!: string;

  @Column({ type: 'text', nullable: true })
  biografia!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @OneToMany(() => LibroAutor, (libroAutor) => libroAutor.autor)
  libroAutores!: LibroAutor[];
}
