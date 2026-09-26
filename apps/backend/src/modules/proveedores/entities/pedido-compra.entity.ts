import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';

import { Proveedor } from './proveedor.entity';
import { Empleado } from '@modules/empleados/entities/empleado.entity';
import { DetallePedidoCompra } from './detalle-pedido-compra.entity';

export type EstadoPedidoCompra =
  | 'pendiente'
  | 'enviado'
  | 'recibido_parcial'
  | 'recibido'
  | 'cancelado';

@Entity('pedido_compra')
export class PedidoCompra {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'proveedor_id' })
  proveedorId!: string;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor!: Proveedor;

  @Column({ type: 'uuid', name: 'empleado_id' })
  empleadoId!: string;

  @ManyToOne(() => Empleado)
  @JoinColumn({ name: 'empleado_id' })
  empleado!: Empleado;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado!: EstadoPedidoCompra;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => DetallePedidoCompra, (detalle) => detalle.pedidoCompra)
  detalles?: DetallePedidoCompra[];
}
