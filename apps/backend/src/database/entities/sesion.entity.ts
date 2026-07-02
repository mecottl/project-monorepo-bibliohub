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

@Entity('sesion')
export class Sesion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: true })
  clienteId!: string | null;

  @ManyToOne(() => Cliente, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente | null;

  @Column({ name: 'empleado_id', type: 'uuid', nullable: true })
  empleadoId!: string | null;

  @ManyToOne(() => Empleado, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado | null;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, unique: true })
  tokenHash!: string;

  @Column({ name: 'expira_en', type: 'timestamp' })
  expiraEn!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
