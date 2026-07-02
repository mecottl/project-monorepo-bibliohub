import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cliente } from './cliente.entity';
import { Empleado } from './empleado.entity';

export type EventoAcceso =
  | 'login_ok'
  | 'login_fallido'
  | 'logout'
  | 'cambio_password';

@Entity('log_acceso')
export class LogAcceso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  clienteId!: string | null;

  @ManyToOne(() => Cliente, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente | null;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: true })
  empleadoId!: string | null;

  @ManyToOne(() => Empleado, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado | null;

  @Column({ type: 'varchar', length: 40 })
  evento!: EventoAcceso;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 300, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;
}
