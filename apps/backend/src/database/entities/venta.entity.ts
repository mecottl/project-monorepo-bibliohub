import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Cliente } from './cliente.entity';
import { Empleado } from './empleado.entity';
import { DetalleVenta } from './detalle-venta.entity';

export type MedioPago = 'efectivo' | 'tarjeta';
export type EstadoVenta = 'completada' | 'cancelada';

@Entity('venta')
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Nulo si la venta fue a un cliente anónimo (sin acumular puntos).
  @Column({ type: 'uuid', name: 'cliente_id', nullable: true })
  clienteId!: string | null;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente?: Cliente | null;

  @Column({ type: 'uuid', name: 'empleado_id' })
  empleadoId!: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'descuento_puntos' })
  descuentoPuntos!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'varchar', length: 20, name: 'medio_pago' })
  medioPago!: MedioPago;

  @Column({ type: 'int', name: 'puntos_usados' })
  puntosUsados!: number;

  @Column({ type: 'int', name: 'puntos_ganados' })
  puntosGanados!: number;

  @Column({ type: 'varchar', length: 20, default: 'completada' })
  estado!: EstadoVenta;

  @OneToMany(() => DetalleVenta, (detalle) => detalle.venta)
  detalles?: DetalleVenta[];
}
