import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type RolEmpleado = 'cajero' | 'admin';

@Entity('empleado')
export class Empleado {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 30 })
  rol!: RolEmpleado;

  @Column({ type: 'varchar', length: 60, unique: true })
  usuario!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;

  @CreateDateColumn({ name: 'fecha_alta' })
  fechaAlta!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
