import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';

import { Cliente } from './cliente.entity';

export type TipoTransaccionPuntos = 'ganado' | 'canjeado';
export type CanalTransaccionPuntos = 'pos' | 'online';

@Entity('transaccion_puntos')
export class TransaccionPuntos {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ type: 'varchar', length: 20 })
  tipo!: TipoTransaccionPuntos;

  // Magnitud siempre positiva; el signo del ajuste lo determina `tipo`
  // ('ganado' suma, 'canjeado' resta).
  @Column({ type: 'int' })
  puntos!: number;

  @Column({ type: 'varchar', length: 20 })
  canal!: CanalTransaccionPuntos;

  // Sin relación de objeto: los módulos de venta/pedidos aún no existen.
  @Column({ type: 'uuid', name: 'venta_id', nullable: true })
  ventaId?: string | null;

  @Column({ type: 'uuid', name: 'pedido_linea_id', nullable: true })
  pedidoLineaId?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  concepto?: string | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;
}
