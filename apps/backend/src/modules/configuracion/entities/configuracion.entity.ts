import { Entity, PrimaryColumn, Column } from 'typeorm';

export type TipoDatoConfiguracion = 'integer' | 'numeric' | 'text' | 'boolean';

@Entity('configuracion')
export class Configuracion {
  @PrimaryColumn({ type: 'varchar', length: 80 })
  clave!: string;

  @Column({ type: 'text' })
  valor!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion!: string | null;

  @Column({ type: 'varchar', length: 20, name: 'tipo_dato', default: 'text' })
  tipoDato!: TipoDatoConfiguracion;

  @Column({ type: 'timestamp', name: 'updated_at' })
  updatedAt!: Date;
}
