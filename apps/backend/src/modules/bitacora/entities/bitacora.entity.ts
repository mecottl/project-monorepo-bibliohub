import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: true })
  empleadoId!: string | null;

  @Column({ name: 'empleado_nombre', type: 'varchar', length: 120, nullable: true })
  empleadoNombre!: string | null;

  @Column({ type: 'varchar', length: 60 })
  accion!: string;

  @Column({ type: 'varchar', length: 40 })
  entidad!: string;

  @Column({ name: 'entidad_id', type: 'varchar', length: 80, nullable: true })
  entidadId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  antes!: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  despues!: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip!: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;
}
