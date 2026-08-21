import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Libro } from './libro.entity';
import { Autor } from './autor.entity';

@Entity('libro_autor')
export class LibroAutor {
  @PrimaryColumn({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro, (libro) => libro.libroAutores)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @PrimaryColumn({ type: 'uuid', name: 'autor_id' })
  autorId!: string;

  @ManyToOne(() => Autor, (autor) => autor.libroAutores)
  @JoinColumn({ name: 'autor_id' })
  autor!: Autor;

  @Column({ type: 'varchar', length: 50 })
  rol!: string;
}
