import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('direccion_entrega')
export class DireccionEntrega {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @Column({ type: 'varchar', length: 60, default: 'Casa' })
  alias!: string;

  @Column({ type: 'varchar', length: 200 })
  calle!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  colonia!: string | null;

  @Column({ type: 'varchar', length: 100 })
  ciudad!: string;

  @Column({ type: 'varchar', length: 100 })
  estado!: string;

  @Column({ type: 'varchar', length: 10, name: 'codigo_postal' })
  codigoPostal!: string;

  @Column({ type: 'text', nullable: true })
  referencias!: string | null;

  @Column({ type: 'boolean', name: 'es_principal', default: false })
  esPrincipal!: boolean;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
