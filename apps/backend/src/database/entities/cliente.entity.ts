import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  telefono!: string;

  // Nulo mientras el cliente exista "solo por teléfono" (creado desde una
  // venta/POS antes de registrarse). Se completa al registrarse.
  @Column({ type: 'varchar', length: 120, nullable: true })
  nombre!: string | null;

  @Column({ type: 'varchar', length: 150, unique: true, nullable: true })
  email!: string | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  passwordHash!: string | null;

  @Column({ name: 'cuenta_activa', type: 'boolean', default: false })
  cuentaActiva!: boolean;

  @Column({ name: 'puntos_saldo', type: 'int', default: 0 })
  puntosSaldo!: number;

  @CreateDateColumn({ name: 'fecha_registro' })
  fechaRegistro!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
