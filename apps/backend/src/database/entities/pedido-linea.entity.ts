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
import { DireccionEntrega } from './direccion-entrega.entity';
import { DetallePedidoLinea } from './detalle-pedido-linea.entity';

export type EstadoPedidoLinea =
  | 'recibido'
  | 'en_preparacion'
  | 'listo'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

export type TipoEntrega = 'recoger_en_tienda' | 'envio_a_domicilio';

export type EstadoPago = 'pendiente' | 'pagado' | 'fallido' | 'reembolsado';

@Entity('pedido_linea')
export class PedidoLinea {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'cliente_id' })
  clienteId!: string;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ type: 'uuid', name: 'direccion_id', nullable: true })
  direccionId!: string | null;

  @ManyToOne(() => DireccionEntrega)
  @JoinColumn({ name: 'direccion_id' })
  direccion?: DireccionEntrega | null;

  @CreateDateColumn({ name: 'fecha' })
  fecha!: Date;

  @Column({ type: 'varchar', length: 30, default: 'recibido' })
  estado!: EstadoPedidoLinea;

  @Column({ type: 'varchar', length: 20, name: 'tipo_entrega' })
  tipoEntrega!: TipoEntrega;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'descuento_puntos' })
  descuentoPuntos!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2, name: 'costo_envio' })
  costoEnvio!: number;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'int', name: 'puntos_usados' })
  puntosUsados!: number;

  @Column({ type: 'int', name: 'puntos_ganados' })
  puntosGanados!: number;

  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @Column({ type: 'varchar', length: 255, name: 'stripe_payment_intent_id', nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'estado_pago', default: 'pendiente' })
  estadoPago!: EstadoPago;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => DetallePedidoLinea, (detalle) => detalle.pedidoLinea)
  detalles?: DetallePedidoLinea[];
}
