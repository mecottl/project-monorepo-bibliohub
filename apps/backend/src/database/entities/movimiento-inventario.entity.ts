import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Libro } from './libro.entity';
import { Empleado } from './empleado.entity';

export type TipoMovimientoInventario = 'entrada' | 'salida' | 'ajuste';

@Entity('movimiento_inventario')
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'libro_id' })
  libroId!: string;

  @ManyToOne(() => Libro)
  @JoinColumn({ name: 'libro_id' })
  libro!: Libro;

  @Column({ type: 'uuid', name: 'empleado_id' })
  empleadoId!: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoMovimientoInventario;

  @Column({ type: 'int' })
  cantidad!: number;

  @Column({ type: 'int', name: 'stock_anterior' })
  stockAnterior!: number;

  @Column({ type: 'int', name: 'stock_nuevo' })
  stockNuevo!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
