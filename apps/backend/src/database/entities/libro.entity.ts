import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Editorial } from './editorial.entity';
import { Categoria } from './categoria.entity';
import { LibroAutor } from './libro-autor.entity';

@Entity('libro')
export class Libro {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  isbn!: string;

  @Column({ type: 'varchar', length: 255 })
  titulo!: string;

  @Column({ type: 'uuid', name: 'editorial_id' })
  editorialId!: string;

  @ManyToOne(() => Editorial, (editorial) => editorial.libros)
  @JoinColumn({ name: 'editorial_id' })
  editorial!: Editorial;

  @Column({ type: 'uuid', name: 'categoria_id' })
  categoriaId!: string;

  @ManyToOne(() => Categoria, (categoria) => categoria.libros)
  @JoinColumn({ name: 'categoria_id' })
  categoria!: Categoria;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'precio_venta' })
  precioVenta!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'precio_costo' })
  precioCosto!: number;

  @Column({ type: 'int', name: 'stock_actual' })
  stockActual!: number;

  @Column({ type: 'int', name: 'stock_minimo', default: 5 })
  stockMinimo!: number;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @Column({ type: 'timestamp', name: 'created_at' })
  createdAt!: Date;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => LibroAutor, (libroAutor) => libroAutor.libro)
  libroAutores!: LibroAutor[];
}
