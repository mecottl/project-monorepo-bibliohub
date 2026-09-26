import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('recuperacion_password')
export class RecuperacionPassword {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @Column({ type: 'varchar', length: 64, name: 'token_hash', unique: true })
  tokenHash!: string;

  @Column({ type: 'timestamp', name: 'expira_en' })
  expiraEn!: Date;

  @Column({ type: 'boolean', default: false })
  usado!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
